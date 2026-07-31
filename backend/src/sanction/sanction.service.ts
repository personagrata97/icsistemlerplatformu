import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NotificationService } from '../common/notification/notification.service';
import { parsePaginationParams, buildPaginatedResponse, PaginationParams } from '../common/pagination.util';

@Injectable()
export class SanctionService {
    private readonly IV_LENGTH = 16;
    private readonly logger = new Logger(SanctionService.name);

    constructor(
        private prisma: PrismaService,
        private notificationService: NotificationService
    ) {}

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

                if (score >= 95) {
                    await this.notificationService.notifyByRole('Uyum Görevlisi', {
                        title: 'Kesin Eşleşme Tespit Edildi',
                        description: `Müşteri taramasında (Skor: ${score}) kesin eşleşme bulundu. İvedilikle inceleme gereklidir.`,
                        type: 'error',
                        module: 'sanction',
                        link: `/sanction/matches`
                    });
                    await this.notificationService.notifyByRole('Uyum Yöneticisi', {
                        title: 'Kesin Eşleşme Tespit Edildi',
                        description: `Müşteri taramasında (Skor: ${score}) kesin eşleşme bulundu.`,
                        type: 'error',
                        module: 'sanction',
                        link: `/sanction/matches`
                    });
                } else {
                    await this.notificationService.notifyByRole('Uyum Görevlisi', {
                        title: 'Yeni Eşleşme Bulundu',
                        description: `Müşteri taramasında (Skor: ${score}) yeni eşleşme saptandı. İnceleme bekliyor.`,
                        type: 'warning',
                        module: 'sanction',
                        link: `/sanction/matches`
                    });
                }
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

    async getDashboardStats() {
        const totalCustomers = await this.prisma.musteri.count();
        const criticalMatches = await this.prisma.sanctionMatch.count({ where: { durum: 'ACIK' } });
        const inReviewMatches = await this.prisma.sanctionMatch.count({ where: { durum: 'INCELEMEDE' } });
        const activeLists = await this.prisma.sanctionList.count({ where: { aktif: true } });

        return {
            totalCustomers,
            criticalMatches,
            inReviewMatches,
            activeLists,
        };
    }

    async getMatches(params?: { search?: string; status?: string; list?: string }, query?: PaginationParams) {
        const { page, pageSize, skip, take } = parsePaginationParams(query);
        const where: any = {};
        if (params?.status && params.status !== 'ALL') {
            where.durum = params.status;
        }
        if (params?.search) {
            where.musteri = {
                ad_soyad: { contains: params.search, mode: 'insensitive' }
            };
        }

        const total = await this.prisma.sanctionMatch.count({ where });
        const matches = await this.prisma.sanctionMatch.findMany({
            where,
            include: {
                musteri: true,
                entity: { include: { list: true } }
            },
            orderBy: query?.sortBy ? { [query.sortBy]: query.sortDir || 'desc' } : { created_at: 'desc' },
            skip,
            take,
        });

        const formatted = matches.map(m => ({
            id: m.id,
            musteriId: m.musteriId,
            musteriAd: m.musteri?.ad_soyad || 'Bilinmeyen Müşteri',
            tckn: m.musteri?.tckn ? `***${m.musteri.tckn.slice(-4)}` : '***1234',
            liste: m.entity?.list?.ad || 'MASAK Yaptırım Listesi',
            skor: m.skor,
            eslesmeTuru: m.eslesmeTuru,
            durum: m.durum,
            tarih: m.created_at.toISOString().split('T')[0],
        }));

        return buildPaginatedResponse(formatted, total, page, pageSize);
    }

    async decideMatch(id: string, decision: 'YANLIS_ESLESME' | 'DOGRULANDI', reason?: string, username: string = 'Sistem') {
        const match = await this.prisma.sanctionMatch.update({
            where: { id },
            data: {
                durum: decision,
                karar: decision,
                karariVeren: username,
                kararTarihi: new Date(),
                gerekce: reason || 'Kullanıcı kararı',
            }
        });

        await this.createLog({
            user: username,
            category: 'YAPTIRIM_KARAR',
            action: decision,
            details: `Eşleşme No ${id} için karar verildi: ${decision}. Gerekçe: ${reason || '-'}`
        });

        return match;
    }

    async createFindingFromMatch(matchId: string, username: string = 'Sistem') {
        const match = await this.prisma.sanctionMatch.findUnique({
            where: { id: matchId },
            include: { musteri: true, entity: { include: { list: true } } }
        });
        
        if (!match) throw new Error('Eşleşme bulunamadı');
        if (match.durum !== 'DOGRULANDI') throw new Error('Yalnızca doğrulanan eşleşmeler için bulgu oluşturulabilir');

        // Find or create an audit to attach the finding to
        let audit = await this.prisma.audit.findFirst({
            where: { title: 'Mevzuat Uyum ve Yaptırım Kontrolleri', isDeleted: false }
        });

        if (!audit) {
            audit = await this.prisma.audit.create({
                data: {
                    title: 'Mevzuat Uyum ve Yaptırım Kontrolleri',
                    type: 'Mevzuat ve Uyum',
                    status: 'Devam Ediyor',
                    startDate: new Date().toISOString().split('T')[0],
                    auditCode: 'UYUM-YAPTIRIM'
                }
            });
        }

        // Generate Finding Code
        const currentYear = new Date().getFullYear();
        const sequenceCount = await this.prisma.finding.count({
            where: { code: { startsWith: `UYM-${currentYear}-` } }
        });
        const sequence = (sequenceCount + 1).toString().padStart(3, '0');
        const findingCode = `UYM-${currentYear}-${sequence}`;
        const matchData = match as any;
        const titlePattern = `Yaptırım Listesi Eşleşmesi: ${matchData.musteriAd || match.musteri?.ad_soyad}`;

        // Create Finding
        const finding = await this.prisma.finding.create({
            data: {
                auditId: audit.id,
                code: findingCode,
                title: titlePattern,
                risk: 'Kritik', // Yaptırım ihlali her zaman kritiktir
                category: 'Yaptırım ve Ambargo',
                status: 'Açık',
                description: `Müşteri (${matchData.musteriAd || match.musteri?.ad_soyad} - TCKN: ${match.musteri?.tckn || '-'}) ile yaptırım listesindeki kayıt eşleşmiştir.\nListe: ${matchData.liste || matchData.entity?.list?.ad}\nSkor: %${match.skor}\nGerekçe: ${match.gerekce}\n\nLütfen eşleşmeye dair gerekli dondurma ve bildirim (MASAK) işlemlerini başlatınız.`,
                department: 'Uyum ve Mevzuat',
                criteria: 'MASAK 6415 sayılı Terörizmin Finansmanının Önlenmesi Hakkında Kanun, OFAC, AB Yaptırım Kuralları',
                rootCause: 'Uluslararası yaptırım ve yerel izleme listelerinde eşleşme tespiti.',
                recommendation: 'Malvarlığı dondurma süreci başlatılmalı ve yasal süresi içinde MASAK bildirimi (Şüpheli İşlem Bildirimi / Dondurma Bildirimi) yapılmalıdır.',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 gün
            }
        });

        await this.createLog({
            user: username,
            category: 'YAPTIRIM_KARAR',
            action: 'Bulgu Oluşturuldu',
            details: `Eşleşme No ${matchId} için uyum bulgusu oluşturuldu: ${findingCode}`
        });

        return finding;
    }

    async getLists() {
        const lists = await this.prisma.sanctionList.findMany({
            include: { _count: { select: { entities: true } } }
        });

        if (lists.length === 0) {
            // Initial seed if empty
            await this.seedInitialLists();
            return this.prisma.sanctionList.findMany({
                include: { _count: { select: { entities: true } } }
            });
        }

        return lists.map(l => ({
            id: l.id,
            kod: l.kod,
            ad: l.ad,
            kaynak: l.kaynakUrl || 'Resmî Entegrasyon',
            kayitSayisi: l._count.entities || l.kayitSayisi,
            sonGuncelleme: l.sonGuncelleme ? l.sonGuncelleme.toISOString().replace('T', ' ').slice(0, 16) : '2026-07-22 06:00',
            durum: l.aktif ? 'AKTIF' : 'PASIF',
        }));
    }

    private async seedInitialLists() {
        const defaults = [
            { kod: 'MASAK_6415_7262', ad: 'MASAK & Resmî Gazete Malvarlığı Dondurma Listesi', kaynakUrl: 'Resmî Gazete / MASAK API', kayitSayisi: 1420 },
            { kod: 'OFAC_SDN', ad: 'ABD Hazine Bakanlığı OFAC SDN Listesi', kaynakUrl: 'US Treasury XML', kayitSayisi: 12450 },
            { kod: 'UN_SECURITY_COUNCIL', ad: 'Birleşmiş Milletler Güvenlik Konseyi Konsolide Listesi', kaynakUrl: 'UN Security Council XML', kayitSayisi: 890 },
            { kod: 'EU_CONSOLIDATED', ad: 'Avrupa Birliği Konsolide Yaptırım Listesi', kaynakUrl: 'EU Financial Sanctions XML', kayitSayisi: 3200 },
            { kod: 'INTERNAL_BLACK_LIST', ad: 'Kurum İçi Özel Kara Liste', kaynakUrl: 'Emlak Katılım Teftiş / Uyum', kayitSayisi: 42 },
        ];

        for (const item of defaults) {
            await this.prisma.sanctionList.upsert({
                where: { kod: item.kod },
                create: { ...item, sonGuncelleme: new Date() },
                update: {},
            });
        }
    }

    async createCustomEntity(data: { adSoyad: string; tckn?: string; gerekce?: string }, username: string = 'Sistem') {
        let list = await this.prisma.sanctionList.findUnique({ where: { kod: 'INTERNAL_BLACK_LIST' } });
        if (!list) {
            await this.seedInitialLists();
            list = await this.prisma.sanctionList.findUnique({ where: { kod: 'INTERNAL_BLACK_LIST' } });
        }

        const entity = await this.prisma.sanctionEntity.create({
            data: {
                listId: list!.id,
                adSoyad: data.adSoyad,
                normalizedAd: this.normalizeName(data.adSoyad),
                kimlikNo: data.tckn,
                tur: data.tckn && data.tckn.length === 11 ? 'GERCEK' : 'TUZEL',
                aciklama: data.gerekce || 'Kurum İçi Teftiş Kararı',
            }
        });

        await this.createLog({
            user: username,
            category: 'KARA_LISTE_EKLE',
            action: 'CREATE',
            details: `Dahili kara listeye yeni kayıt eklendi: ${data.adSoyad} (${data.tckn || '-'})`
        });

        return entity;
    }

    async getListEntities(kod: string, search?: string, query?: PaginationParams) {
        const { page, pageSize, skip, take } = parsePaginationParams(query);
        const list = await this.prisma.sanctionList.findUnique({ where: { kod } });
        if (!list) return buildPaginatedResponse([], 0, page, pageSize);

        const where: any = { listId: list.id };
        if (search) {
            where.adSoyad = { contains: search, mode: 'insensitive' };
        }

        const total = await this.prisma.sanctionEntity.count({ where });
        const items = await this.prisma.sanctionEntity.findMany({
            where,
            orderBy: query?.sortBy ? { [query.sortBy]: query.sortDir || 'desc' } : { created_at: 'desc' },
            skip,
            take,
        });

        return buildPaginatedResponse(items, total, page, pageSize);
    }

    async getHistory(query?: PaginationParams) {
        const { page, pageSize, skip, take } = parsePaginationParams(query);
        const total = await this.prisma.sanctionScreening.count();
        const screenings = await this.prisma.sanctionScreening.findMany({
            orderBy: query?.sortBy ? { [query.sortBy]: query.sortDir || 'desc' } : { baslangic: 'desc' },
            skip,
            take,
        });

        const formatted = screenings.map(s => ({
            id: s.id,
            tetikleyici: s.tetikleyici,
            taranan: s.tarananKayitSayisi,
            eslesme: s.eslesmeSayisi,
            baslangic: s.baslangic.toISOString().replace('T', ' ').slice(0, 16),
            sure: s.bitis ? `${((s.bitis.getTime() - s.baslangic.getTime()) / 1000).toFixed(2)}s` : 'Çalışıyor',
            calistiran: s.calistiran,
        }));

        return buildPaginatedResponse(formatted, total, page, pageSize);
    }

    async getLogs(query?: PaginationParams) {
        const { page, pageSize, skip, take } = parsePaginationParams(query);
        const total = await this.prisma.sanctionLog.count();
        const logs = await this.prisma.sanctionLog.findMany({
            orderBy: query?.sortBy ? { [query.sortBy]: query.sortDir || 'desc' } : { timestamp: 'desc' },
            skip,
            take,
        });

        const formatted = logs.map((log: any) => ({
            ...log,
            details: this.decrypt(log.details)
        }));

        return buildPaginatedResponse(formatted, total, page, pageSize);
    }

    async getReports() {
        const reports = await this.prisma.generatedReport.findMany({
            orderBy: { generatedAt: 'desc' },
            take: 50
        });

        if (reports.length === 0) {
            const screenings = await this.prisma.sanctionScreening.findMany({
                orderBy: { baslangic: 'desc' },
                take: 10
            });
            return screenings.map(s => ({
                id: s.id,
                title: `${s.tetikleyici} Yaptırım Taraması Raporu`,
                code: `RAP-SAN-${s.id.slice(-6).toUpperCase()}`,
                type: 'Yaptırım ve MASAK Uyum Raporu',
                period: s.baslangic.toISOString().slice(0, 10),
                matchesCount: s.eslesmeSayisi,
                screenedCount: s.tarananKayitSayisi,
                status: 'YAYINLANDI',
                generatedAt: s.baslangic.toISOString()
            }));
        }

        return reports;
    }

    async getParameters() {
        const existing = await this.prisma.sanctionParameter.findMany({
            orderBy: { created_at: 'asc' }
        });

        if (existing.length === 0) {
            const defaults = [
                { kod: 'eslesmeKesinEsigi', ad: 'Kesin Eşleşme Skoru', deger: '95', birim: 'PUAN', minVal: 50, maxVal: 100, varsayilan: '95', aciklama: 'Yaptırım listelerinde otomatik dondurma sürecini tetikleyen skor', guncelleyen: 'Sistem Yöneticisi' },
                { kod: 'eslesmeSupheliEsigi', ad: 'Şüpheli Eşleşme Alt Eşiği', deger: '85', birim: 'PUAN', minVal: 50, maxVal: 100, varsayilan: '85', aciklama: 'İnceleme kuyruğuna düşen minimum bulanık eşleşme skoru', guncelleyen: 'Sistem Yöneticisi' },
                { kod: 'yuksekTutarEsigi', ad: 'Yüksek Tutar Fesih Eşiği', deger: '500000', birim: 'TL', minVal: 10000, maxVal: 100000000, varsayilan: '500000', aciklama: 'Erken fesih ve yüksek tutarlı işlemlerde uyarı tetikleme eşiği', guncelleyen: 'Sistem Yöneticisi' },
                { kod: 'listeEskimeUyariGun', ad: 'Liste Güncellik Uyarı Süresi', deger: '7', birim: 'GUN', minVal: 1, maxVal: 30, varsayilan: '7', aciklama: 'Yaptırım listesi güncellenmediğinde uyarı üretilecek maksimum gün', guncelleyen: 'Sistem Yöneticisi' },
            ];

            for (const item of defaults) {
                await this.prisma.sanctionParameter.upsert({
                    where: { kod: item.kod },
                    create: item,
                    update: {}
                });
            }
            return this.prisma.sanctionParameter.findMany({ orderBy: { created_at: 'asc' } });
        }

        return existing;
    }

    async updateParameter(id: string, newDeger: string, username: string = 'Sistem Yöneticisi') {
        const param = await this.prisma.sanctionParameter.findFirst({
            where: { OR: [{ id }, { kod: id }] }
        });
        if (!param) throw new NotFoundException('Parametre bulunamadı');

        const numVal = parseFloat(newDeger);
        if (!isNaN(numVal)) {
            if (param.minVal !== null && numVal < param.minVal) {
                throw new Error(`Parametre değeri minimum sınır olan ${param.minVal} alt küçüğünde olamaz.`);
            }
            if (param.maxVal !== null && numVal > param.maxVal) {
                throw new Error(`Parametre değeri maksimum sınır olan ${param.maxVal} üstünde olamaz.`);
            }
        }

        const updated = await this.prisma.sanctionParameter.update({
            where: { id: param.id },
            data: {
                deger: newDeger,
                guncelleyen: username,
            }
        });

        await this.createLog({
            user: username,
            category: 'PARAMETRE_GUNCELLE',
            action: 'UPDATE',
            details: `Sanction parametresi güncellendi (${param.ad} / ${param.kod}): ${param.deger} -> ${newDeger}`
        });

        return updated;
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
