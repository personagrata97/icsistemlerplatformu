import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SanctionService {
    private readonly IV_LENGTH = 16;
    private readonly logger = new Logger(SanctionService.name);

    constructor(private prisma: PrismaService) {}

    private getEncryptionKey(): string {
        const key = process.env.ENCRYPTION_KEY;
        if (!key) {
            if (process.env.NODE_ENV === 'production') {
                this.logger.error('KRİTİK GÜVENLİK ENGELİ: ENCRYPTION_KEY ortam değişkeni eksik!');
                throw new Error('KRİTİK GÜVENLİK ENGELİ: Production ortamında ENCRYPTION_KEY ortam değişkeni tanımlı değildir!');
            }
            return 'icsistemler-platformu-secure-key-1234567890';
        }
        return key;
    }

    private encrypt(text: string | null | undefined): string | null {
        if (!text) return null;
        try {
            const crypto = require('crypto');
            const iv = crypto.randomBytes(this.IV_LENGTH);
            const key = crypto.scryptSync(this.getEncryptionKey(), 'salt', 32);
            const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return iv.toString('hex') + ':' + encrypted;
        } catch (e) {
            this.logger.error('Sanction Şifreleme hatası', e);
            throw new Error('Veri güvenliği ihlali: Şifreleme başarısız.');
        }
    }

    private decrypt(text: string | null | undefined): string | null {
        if (!text) return null;
        if (!text.includes(':')) return text;
        try {
            const crypto = require('crypto');
            const textParts = text.split(':');
            const iv = Buffer.from(textParts.shift()!, 'hex');
            const encryptedText = Buffer.from(textParts.join(':'), 'hex');
            const key = crypto.scryptSync(this.getEncryptionKey(), 'salt', 32);
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString('utf8');
        } catch (e) {
            this.logger.error('Sanction Deşifre hatası', e);
            return '*** ŞİFRELİ VERİ (DEŞİFRE EDİLEMEDİ) ***';
        }
    }

    // ============================================================
    // TÜRKÇE VE MEVZUAT UYUMLU ISIM NORMALIZASYONU (ADIM 4)
    // ============================================================
    public normalizeName(name: string): string {
        if (!name) return '';
        let str = name.toLocaleUpperCase('tr-TR');

        // Türkçe Karakter Değişimi
        const trMap: Record<string, string> = {
            'Ş': 'S', 'Ç': 'C', 'İ': 'I', 'I': 'I', 'Ğ': 'G', 'Ö': 'O', 'Ü': 'U'
        };
        str = str.replace(/[ŞÇİIĞÖÜ]/g, (char) => trMap[char] || char);

        // Unvan / Şirket Ekleri Temizliği
        const titles = [
            /\bDR\b/g, /\bAV\b/g, /\bPROF\b/g, /\bDOÇ\b/g, /\bLTD\b/g, /\bŞTİ\b/g, /\bSTI\b/g,
            /\bA\.Ş\b/g, /\bAS\b/g, /\bINC\b/g, /\bLLC\b/g, /\bCORP\b/g
        ];
        titles.forEach(t => { str = str.replace(t, ''); });

        // Noktalama ve Fazla Boşluk Temizliği
        str = str.replace(/[^A-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
        return str;
    }

    // Levenshtein Benzerlik Oranı (%0 - 100)
    public calculateSimilarity(str1: string, str2: string): number {
        const s1 = this.normalizeName(str1);
        const s2 = this.normalizeName(str2);
        if (s1 === s2) return 100;
        if (!s1 || !s2) return 0;

        const track = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
        for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
        for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

        for (let j = 1; j <= s2.length; j += 1) {
            for (let i = 1; i <= s1.length; i += 1) {
                const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
                track[j][i] = Math.min(
                    track[j][i - 1] + 1,
                    track[j - 1][i] + 1,
                    track[j - 1][i - 1] + indicator
                );
            }
        }

        const distance = track[s2.length][s1.length];
        const maxLength = Math.max(s1.length, s2.length);
        return Math.round(((maxLength - distance) / maxLength) * 100);
    }

    // ============================================================
    // MÜŞTERİ / PORTFÖY TARAMA MOTORU (6 ADIMLI ALGORİTMA)
    // ============================================================
    async screenCustomer(musteriId: string): Promise<any[]> {
        const musteri = await this.prisma.musteri.findUnique({
            where: { musteri_id: musteriId }
        });
        if (!musteri) throw new NotFoundException('Müşteri bulunamadı');

        const entities = await this.prisma.sanctionEntity.findMany({
            include: { list: true }
        });

        const normMusteriAd = this.normalizeName(musteri.ad_soyad);
        const matches: any[] = [];

        for (const entity of entities) {
            let score = 0;
            let eslesmeTuru = 'BULANIK';

            // 1. Kimlik Eşleşmesi (TCKN veya Pasaport -> Skor 100)
            if (musteri.tckn && entity.kimlikNo && musteri.tckn === entity.kimlikNo) {
                score = 100;
                eslesmeTuru = 'KIMLIK';
            } else if (musteri.pasaportNo && entity.pasaportNo && musteri.pasaportNo === entity.pasaportNo) {
                score = 100;
                eslesmeTuru = 'KIMLIK';
            } else {
                // 2. Tam İsim Eşleşmesi -> Skor 95
                if (normMusteriAd === entity.normalizedAd) {
                    score = 95;
                    eslesmeTuru = 'TAM';
                } else {
                    // 3. Bulanık Eşleşme (Levenshtein)
                    const sim = this.calculateSimilarity(normMusteriAd, entity.normalizedAd);
                    if (sim >= 85) {
                        score = sim;
                        eslesmeTuru = 'BULANIK';
                    }
                }
            }

            // 4. Doğum Tarihi / Uyruk Teyidi (Skor Ayarlama)
            if (score >= 85 && musteri.dogumTarihi && entity.dogumTarihi) {
                const d1 = new Date(musteri.dogumTarihi).toDateString();
                const d2 = new Date(entity.dogumTarihi).toDateString();
                if (d1 === d2) score = Math.min(100, score + 10);
                else score = Math.max(0, score - 15);
            }

            // 5. Kayıt Oluşturma (Skor >= 85 ise Eşleşme Kaydedilir)
            if (score >= 85) {
                const match = await this.prisma.sanctionMatch.create({
                    data: {
                        musteriId: musteri.musteri_id,
                        entityId: entity.id,
                        skor: score,
                        eslesmeTuru: eslesmeTuru,
                        durum: score >= 95 ? 'ACIK' : 'INCELEMEDE',
                    }
                });
                matches.push(match);
            }
        }

        return matches;
    }

    // ============================================================
    // PORTFÖY TOPLU TARAMA VE SEED LİSTELERİ
    // ============================================================
    async screenAllPortfolios(calistiran: string = 'Sistem'): Promise<any> {
        const start = new Date();
        const meyn = await this.prisma.musteri.findMany({ select: { musteri_id: true } });

        const screening = await this.prisma.sanctionScreening.create({
            data: {
                tetikleyici: 'PERIYODIK',
                calistiran: calistiran,
                tarananKayitSayisi: meyn.length,
            }
        });

        let totalMatches = 0;
        for (const m of meyn) {
            const matches = await this.screenCustomer(m.musteri_id);
            totalMatches += matches.length;
        }

        await this.prisma.sanctionScreening.update({
            where: { id: screening.id },
            data: {
                bitis: new Date(),
                eslesmeSayisi: totalMatches,
            }
        });

        return {
            screeningId: screening.id,
            tarananKayitSayisi: meyn.length,
            eslesmeSayisi: totalMatches,
            sure: `${((Date.now() - start.getTime()) / 1000).toFixed(2)} saniye`
        };
    }

    async getLogs() {
        const logs = await this.prisma.sanctionLog.findMany({
            orderBy: { timestamp: 'desc' },
            take: 100
        });

        return logs.map((log: any) => ({
            ...log,
            details: this.decrypt(log.details)
        }));
    }

    async createLog(data: any) {
        return this.prisma.sanctionLog.create({
            data: {
                user: data.user,
                category: data.category,
                action: data.action,
                details: this.encrypt(data.details),
            }
        });
    }
}
