import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

/**
 * MASAK Şüpheli İşlem Bildirimi (ŞİB) Motoru
 * Kural tabanlı anomali tespiti (Örn: Büyük montanlı peşin ödemeler)
 */
@Injectable()
export class MasakService {
    private readonly logger = new Logger(MasakService.name);

    constructor(private prisma: PrismaService) { }

    async scanForSuspiciousTransactions() {
        const bugun = new Date();
        const onGunOnce = new Date();
        onGunOnce.setDate(bugun.getDate() - 10);

        const supheliIslemler = await this.prisma.odemeHareketi.findMany({
            where: {
                tarih: {
                    gte: onGunOnce,
                    lte: bugun,
                },
                tutar: {
                    gte: 500000, 
                },
            },
            include: {
                sozlesme: {
                    include: { musteri: true }
                }
            }
        });

        const raporListesi = [];

        for (const islem of supheliIslemler) {
            raporListesi.push({
                hareket_id: islem.hareket_id,
                tarih: islem.tarih,
                tutar: Number(islem.tutar),
                tip: islem.tip,
                musteri: islem.sozlesme.musteri.ad_soyad,
                risk_skoru: 'YUKSEK',
                aciklama: 'Tek seferde yüksek montanlı ödeme tespiti (ŞİB Adayı)'
            });
            
            this.logger.warn(`MASAK ŞİB ADAYI TESPİT EDİLDİ: ${islem.sozlesme.musteri.ad_soyad} - ${Number(islem.tutar)} TL`);
        }

        return {
            tarama_tarihi: bugun,
            tespit_edilen_supheli_islem_sayisi: raporListesi.length,
            islemler: raporListesi,
            masak_bildirim_suresi_uyarisi: 'Şüpheli işlemler öğrenildiği tarihten itibaren 10 iş günü içinde MASAK\'a bildirilmelidir.'
        };
    }
}
