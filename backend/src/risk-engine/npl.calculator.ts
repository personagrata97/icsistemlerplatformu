import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RiskCalculationResult, ScenarioParameters } from './risk-engine.types';

/**
 * NPL (Non-Performing Loan) Calculator
 * Hesaplama: Takipteki sözleşme sayısı / Toplam sözleşme sayısı
 */
@Injectable()
export class NplCalculator {
    constructor(private prisma: PrismaService) { }

    async calculate(params?: ScenarioParameters): Promise<RiskCalculationResult> {
        // Tüm aktif sözleşmeleri getir
        const sozlesmeler = await this.prisma.sozlesme.findMany({
            where: { durum: { not: 'TAMAMLANDI' } },
            include: {
                odeme_hareketleri: {
                    select: { gecikme_gun: true },
                },
            },
        });

        const toplamSozlesme = sozlesmeler.length;
        let nplSozlesmeSayisi = 0;

        // Her sözleşmenin max gecikmesini kontrol et
        sozlesmeler.forEach(s => {
            const maxGecikme = s.odeme_hareketleri.reduce((max, h) => Math.max(max, h.gecikme_gun), 0);
            if (maxGecikme > 90) {
                nplSozlesmeSayisi++;
            }
        });

        // Senaryo uygula
        if (params && params.gecikme_artis > 0) {
            // Olumsuz senaryoda NPL sayısını artır
            nplSozlesmeSayisi = Math.round(nplSozlesmeSayisi * (1 + params.gecikme_artis));
        } else if (params && params.gecikme_artis < 0) {
            nplSozlesmeSayisi = Math.round(nplSozlesmeSayisi * (1 + params.gecikme_artis));
        }

        // NPL sayısı toplamı geçemez
        if (nplSozlesmeSayisi > toplamSozlesme) nplSozlesmeSayisi = toplamSozlesme;

        const nplOran = toplamSozlesme > 0 ? nplSozlesmeSayisi / toplamSozlesme : 0;

        // Risk seviyesi belirleme
        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        if (nplOran > 0.05) { // %5 üzeri kritik (Mevzuat NPL limiti genelde düşüktür)
            riskSeviyesi = 'RED';
        } else if (nplOran > 0.03) {
            riskSeviyesi = 'YELLOW';
        }

        return {
            kpi_kodu: 'NPL',
            deger: nplOran * 100, // Yüzde olarak gösterim
            risk_seviyesi: riskSeviyesi,
            detay: {
                toplam_sozlesme: toplamSozlesme,
                npl_sozlesme: nplSozlesmeSayisi,
                aciklama: '90+ gün gecikmeli sözleşme oranı'
            },
        };
    }
}
