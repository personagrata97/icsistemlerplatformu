import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RiskCalculationResult } from './risk-engine.types';

/**
 * Vade Sınırları Uyum Calculator (Konut ≤ 120 Ay, Taşıt ≤ 60 Ay)
 * 
 * Mevzuat Dayanağı:
 * - 6361 sayılı Kanun m.39 & TFŞ Yönetmeliği m.18
 * - Yürürlük Tarihi: 30/05/2025 Güncel Yönetmelik
 * - Kural: Konut ve çatılı işyeri finansmanlarında azami vade 120 ay, taşıt finansmanlarında azami vade 60 aydır.
 */
@Injectable()
export class TenorLimitCalculator {
    constructor(private prisma: PrismaService) { }

    async calculate(): Promise<RiskCalculationResult> {
        const sozlesmeler = await this.prisma.sozlesme.findMany({
            where: { durum: 'AKTIF' },
        });

        let konutIhlalSayisi = 0;
        let tasitIhlalSayisi = 0;

        sozlesmeler.forEach((s: any) => {
            const tur = String(s.sozlesme_turu || s.tur || '').toUpperCase();
            const vade = s.vade || 0;

            if ((tur.includes('KONUT') || tur.includes('ISYERI') || tur.includes('İŞYERİ')) && vade > 120) {
                konutIhlalSayisi++;
            } else if ((tur.includes('TASIT') || tur.includes('TAŞIT') || tur.includes('OTO')) && vade > 60) {
                tasitIhlalSayisi++;
            }
        });

        const toplamIhlal = konutIhlalSayisi + tasitIhlalSayisi;

        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        let mesaj = '✅ Tüm aktif sözleşmeler yasal vade sınırlarına (Konut 120 ay, Taşıt 60 ay) uygundur.';

        if (toplamIhlal > 0) {
            riskSeviyesi = 'RED';
            mesaj = `🚨 YASAL İHLAL: Toplam ${toplamIhlal} sözleşmede mevzuat vade sınırı aşıldı! (Konut ihlal: ${konutIhlalSayisi}, Taşıt ihlal: ${tasitIhlalSayisi})`;
        }

        return {
            kpi_kodu: 'VADE_SINIRI_MEVZUAT_UYUM',
            deger: toplamIhlal,
            risk_seviyesi: riskSeviyesi,
            detay: {
                konut_ihlal_sayisi: konutIhlalSayisi,
                tasit_ihlal_sayisi: tasitIhlalSayisi,
                konut_max_vade_ay: 120,
                tasit_max_vade_ay: 60,
                bddk_mesaji: mesaj,
                mevzuat_dayanak: '6361 s. Kanun & TFŞ Yönetmeliği m.18 (30/05/2025): Konut azami 120 ay, Taşıt azami 60 ay.'
            },
        };
    }
}
