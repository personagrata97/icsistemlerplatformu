import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SanctionImportService {
    private readonly logger = new Logger(SanctionImportService.name);

    constructor(private prisma: PrismaService) {}

    public normalizeName(name: string): string {
        if (!name) return '';
        let str = name.toLocaleUpperCase('tr-TR');
        const trMap: Record<string, string> = {
            'Ş': 'S', 'Ç': 'C', 'İ': 'I', 'I': 'I', 'Ğ': 'G', 'Ö': 'O', 'Ü': 'U'
        };
        str = str.replace(/[ŞÇİIĞÖÜ]/g, (char) => trMap[char] || char);
        const titles = [
            /\bDR\b/g, /\bAV\b/g, /\bPROF\b/g, /\bDOÇ\b/g, /\bLTD\b/g, /\bŞTİ\b/g, /\bSTI\b/g,
            /\bA\.Ş\b/g, /\bAS\b/g, /\bINC\b/g, /\bLLC\b/g, /\bCORP\b/g
        ];
        titles.forEach(t => { str = str.replace(t, ''); });
        return str.replace(/[^A-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    async syncList(kod: string): Promise<any> {
        this.logger.log(`Yaptırım listesi senkronize ediliyor: ${kod}`);

        let list = await this.prisma.sanctionList.findUnique({ where: { kod } });
        if (!list) {
            list = await this.prisma.sanctionList.create({
                data: {
                    kod,
                    ad: this.getListName(kod),
                    sonGuncelleme: new Date(),
                    kayitSayisi: 0,
                    aktif: true,
                }
            });
        }

        const newEntities = this.generateSeedEntities(kod, list.id);

        for (const entity of newEntities) {
            await this.prisma.sanctionEntity.upsert({
                where: { id: entity.id },
                create: entity,
                update: entity,
            });
        }

        const count = await this.prisma.sanctionEntity.count({ where: { listId: list.id } });

        await this.prisma.sanctionList.update({
            where: { id: list.id },
            data: {
                sonGuncelleme: new Date(),
                kayitSayisi: count,
            }
        });

        return {
            kod,
            guncellenenKayit: newEntities.length,
            toplamKayit: count,
            tarih: new Date(),
        };
    }

    private getListName(kod: string): string {
        switch (kod) {
            case 'MASAK_5549_6415_7262': return 'MASAK & Resmî Gazete Malvarlığı Dondurma Listesi';
            case 'OFAC_SDN': return 'ABD Hazine Bakanlığı OFAC SDN Listesi';
            case 'UN_SECURITY_COUNCIL': return 'Birleşmiş Milletler Güvenlik Konseyi Konsolide Listesi';
            case 'EU_CONSOLIDATED': return 'Avrupa Birliği Konsolide Yaptırım Listesi';
            case 'INTERNAL_BLACK_LIST': return 'Kurum İçi Özel Kara Liste';
            default: return kod;
        }
    }

    private generateSeedEntities(kod: string, listId: string): any[] {
        const now = new Date();
        if (kod.includes('MASAK')) {
            return [
                {
                    id: `masak-1`,
                    listId,
                    tur: 'GERCEK',
                    adSoyad: 'Zelımkhan YANDARBIEV',
                    normalizedAd: this.normalizeName('Zelımkhan YANDARBIEV'),
                    kimlikNo: '99281726401',
                    kararNo: '2026/12',
                    aciklama: '6415 S.K. m.5 Terörün Finansmanı Kararı',
                    listeyeGirisTarihi: now,
                },
                {
                    id: `masak-2`,
                    listId,
                    tur: 'TUZEL',
                    adSoyad: 'Al-Furqan Medya Vakfı',
                    normalizedAd: this.normalizeName('Al-Furqan Medya Vakfı'),
                    kararNo: '2026/44',
                    aciklama: '7262 S.K. m.3 Kitle İmha Silahları Dondurma Kararı',
                    listeyeGirisTarihi: now,
                },
                {
                    id: `masak-3`,
                    listId,
                    tur: 'GERCEK',
                    adSoyad: 'Tariq Anwar AL-SAYED',
                    normalizedAd: this.normalizeName('Tariq Anwar AL-SAYED'),
                    kimlikNo: '99102938475',
                    kararNo: '2026/08',
                    aciklama: '5549 S.K. m.19 Şüpheli İşlem Bildirimi Dondurma',
                    listeyeGirisTarihi: now,
                }
            ];
        } else if (kod.includes('OFAC')) {
            return [
                {
                    id: 'ofac-1',
                    listId,
                    tur: 'GERCEK',
                    adSoyad: 'Viktor Anatolyevich BOUT',
                    normalizedAd: this.normalizeName('Viktor Anatolyevich BOUT'),
                    pasaportNo: 'RU-992144',
                    aciklama: 'SDGT Küresel Terörizm Programı',
                    listeyeGirisTarihi: now,
                },
                {
                    id: 'ofac-2',
                    listId,
                    tur: 'TUZEL',
                    adSoyad: 'Rosneft Trading S.A.',
                    normalizedAd: this.normalizeName('Rosneft Trading S.A.'),
                    aciklama: 'VENEZUELA Yaptırım Programı',
                    listeyeGirisTarihi: now,
                }
            ];
        } else if (kod.includes('UN')) {
            return [
                {
                    id: 'un-1',
                    listId,
                    tur: 'TUZEL',
                    adSoyad: 'AL-QAIDA CONSOLIDATED LIST',
                    normalizedAd: this.normalizeName('AL-QAIDA CONSOLIDATED LIST'),
                    aciklama: 'UNSC 1267/1989/2253 Karar Komitesi',
                    listeyeGirisTarihi: now,
                },
                {
                    id: 'un-2',
                    listId,
                    tur: 'GERCEK',
                    adSoyad: 'Mullah Mohammad OMAR',
                    normalizedAd: this.normalizeName('Mullah Mohammad OMAR'),
                    aciklama: 'UNSC 1988 Taliban Komitesi',
                    listeyeGirisTarihi: now,
                }
            ];
        } else if (kod.includes('EU')) {
            return [
                {
                    id: 'eu-1',
                    listId,
                    tur: 'TUZEL',
                    adSoyad: 'CONSOLIDATED LIST OF FINANCIAL SANCTIONS TARGETS',
                    normalizedAd: this.normalizeName('CONSOLIDATED LIST OF FINANCIAL SANCTIONS TARGETS'),
                    kararNo: 'EU 2024/771',
                    aciklama: 'EU Financial Sanctions Regulatory List',
                    listeyeGirisTarihi: now,
                },
                {
                    id: 'eu-2',
                    listId,
                    tur: 'GERCEK',
                    adSoyad: 'Sergei Vladimirovich KOROLEV',
                    normalizedAd: this.normalizeName('Sergei Vladimirovich KOROLEV'),
                    kararNo: 'EU 2024/890',
                    aciklama: 'EU Targeted Individual Sanction',
                    listeyeGirisTarihi: now,
                }
            ];
        }
        return [];
    }
}
