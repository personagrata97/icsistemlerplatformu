import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RiskCalculationResult, ScenarioParameters } from './risk-engine.types';

/**
 * NPL (Non-Performing Loan) Calculator
 * BDDK Hesaplama: 90+ Gün Gecikmeli Kredi Hacmi / Toplam Kredi Hacmi
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

        let toplamHacim = 0;
        let nplHacim = 0;

        // Her sözleşmenin max gecikmesini kontrol et
        sozlesmeler.forEach(s => {
            const maxGecikme = s.odeme_hareketleri.reduce((max, h) => Math.max(max, h.gecikme_gun), 0);
            const tutar = Number(s.toplam_tutar);
            
            toplamHacim += tutar;

            if (maxGecikme > 90) { // 3. 4. ve 5. Grup
                nplHacim += tutar;
            }
        });

        // Senaryo uygula
        if (params && params.gecikme_artis !== 0) {
            // Olumsuz/Olumlu senaryoda NPL hacmini artır/azalt
            nplHacim += toplamHacim * params.gecikme_artis;
            if (nplHacim < 0) nplHacim = 0;
            if (nplHacim > toplamHacim) nplHacim = toplamHacim;
        }

        const nplOran = toplamHacim > 0 ? nplHacim / toplamHacim : 0;
        const nplYuzde = nplOran * 100;

        // Risk seviyesi belirleme
        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        if (nplYuzde > 5) { // %5 üzeri kritik (Mevzuat NPL limiti genelde düşüktür)
            riskSeviyesi = 'RED';
        } else if (nplYuzde > 3) {
            riskSeviyesi = 'YELLOW';
        }

        return {
            kpi_kodu: 'NPL',
            deger: nplYuzde,
            risk_seviyesi: riskSeviyesi,
            detay: {
                toplam_hacim: toplamHacim,
                npl_hacim: nplHacim,
                aciklama: 'Hacim Bazlı 90+ gün gecikmeli kredi oranı (TFRS 9 Grup 3-4-5)'
            },
        };
    }
}
