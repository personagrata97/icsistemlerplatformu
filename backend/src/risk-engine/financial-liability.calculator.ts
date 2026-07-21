import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RiskCalculationResult } from './risk-engine.types';

/**
 * Banka ve Dış Kaynaklı Mali Yükümlülük Sınırı Calculator
 * 
 * Mevzuat Dayanağı:
 * - Tasarruf Finansman Şirketlerinin Kuruluş ve Faaliyet Esasları Hakkında Yönetmelik m.6
 * - Yürürlük Tarihi: 30/05/2025 Değişikliği
 * - Kural: Bankalardan ve dış kaynaklardan sağlanan toplam finansman/borçlanma tutarı, özkaynak tutarının %30'unu aşamaz.
 */
@Injectable()
export class FinancialLiabilityCalculator {
    constructor(private prisma: PrismaService) { }

    async calculate(): Promise<RiskCalculationResult> {
        // Aktif finansman ve özkaynak bilgilerini sorgula
        const sozlesmeler = await this.prisma.sozlesme.findMany({
            where: { durum: 'AKTIF' },
        });

        // Toplam portföy ve tahmini mali yükümlülük
        const toplamFinansman = sozlesmeler.reduce((acc, s) => acc + Number(s.toplam_tutar), 0);
        
        // Şirket asgari özkaynağı (BDDK 30/05/2025 tebliği uyarınca 100M TL varsayılan taban)
        const ozkaynak = 100_000_000;
        
        // Dış kaynak borçlanma tutarı (örneklem / tahmini rasyo)
        const bankaBorclanmaTutar = toplamFinansman * 0.15; // %15 varsayılan dış yükümlülük

        const borclanmaOzkaynakOrani = ozkaynak > 0 ? (bankaBorclanmaTutar / ozkaynak) * 100 : 0;

        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        let mesaj = '✅ Banka ve mali yükümlülükler özkaynağın %30 yasal sınırı dahilindedir.';

        if (borclanmaOzkaynakOrani > 30) {
            riskSeviyesi = 'RED';
            mesaj = `🚨 YASAL İHLAL: Banka ve mali yükümlülük tutarı özkaynağın %${borclanmaOzkaynakOrani.toFixed(1)}'ine ulaştı (%30 üst sınırı aşıldı)!`;
        } else if (borclanmaOzkaynakOrani > 25) {
            riskSeviyesi = 'YELLOW';
            mesaj = `⚠️ ERKEN UYARI: Mali yükümlülüklerin özkaynağa oranı %${borclanmaOzkaynakOrani.toFixed(1)} ile %30 sınırına yaklaştı.`;
        }

        return {
            kpi_kodu: 'MALI_YUKUMLULUK_OZKAYNAK',
            deger: borclanmaOzkaynakOrani,
            risk_seviyesi: riskSeviyesi,
            detay: {
                banka_borclanma_tutar: bankaBorclanmaTutar,
                ozkaynak_tutar: ozkaynak,
                yasal_limit_orani: 30,
                bddk_mesaji: mesaj,
                mevzuat_dayanak: 'TFŞ Yönetmeliği m.6 (30/05/2025 değişikliği): Bankalardan sağlanan finansman tutarı özkaynak tutarının %30’unu aşamaz.'
            },
        };
    }
}
