import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RiskCalculationResult, ScenarioParameters } from './risk-engine.types';

/**
 * Likidite Oranı (LCR - Liquidity Coverage Ratio) Calculator
 * Hesaplama: (Nakit + Likit Varlıklar) / (Kısa Vadeli Yükümlülükler + 30 Gün Teslimat Yükümlülüğü)
 */
import { DeliveryLiabilityCalculator } from './delivery-liability.calculator';

@Injectable()
export class LiquidityCalculator {
    constructor(
        private prisma: PrismaService,
        private deliveryLiabilityCalculator: DeliveryLiabilityCalculator
    ) { }

    async calculate(params?: ScenarioParameters): Promise<RiskCalculationResult> {
        // En son likidite pozisyonunu al
        const pozisyon = await this.prisma.likiditePozisyonu.findFirst({
            orderBy: { tarih: 'desc' },
        });

        if (!pozisyon) {
            return {
                kpi_kodu: 'LCR',
                deger: 0,
                risk_seviyesi: 'RED',
                detay: { mesaj: 'Likidite verisi bulunamadı' },
            };
        }

        let nakit = Number(pozisyon.nakit);
        let likitVarlik = Number(pozisyon.likit_varlik);
        let kisaVadeliYukumluluk = Number(pozisyon.kisa_vadeli_yukumluluk);

        // Dinamik Teslimat Yükümlülüğü Hesaplama
        // (Eski seed verisi yerine canlı sözleşme verisinden hesaplanır)
        let teslimatYukumlulugu = await this.deliveryLiabilityCalculator.calculateTotalLiability(params);

        // Senaryo uygula - Sadece likidite ve kısa vadeli yük. için (teslimat yukarıda handle edildi)
        if (params) {
            if (params.likidite_dusus !== 0) {
                nakit = nakit * (1 - params.likidite_dusus);
                likitVarlik = likitVarlik * (1 - params.likidite_dusus);
            }

            // İptal (Cayma) riski senaryosu: iptal_artis
            if (params.iptal_artis > 0) {
                nakit = nakit * (1 - params.iptal_artis);
                likitVarlik = likitVarlik * (1 - params.iptal_artis);
            }
        }
        const pay = nakit + likitVarlik;
        const payda = kisaVadeliYukumluluk + teslimatYukumlulugu;
        const lcr = payda > 0 ? pay / payda : 0;

        // Risk seviyesi belirleme (LCR > 1.0 ideal)
        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        if (lcr < 0.8) {
            riskSeviyesi = 'RED';
        } else if (lcr < 1.0) {
            riskSeviyesi = 'YELLOW';
        }

        return {
            kpi_kodu: 'LCR',
            deger: lcr,
            risk_seviyesi: riskSeviyesi,
            detay: {
                nakit,
                likit_varlik: likitVarlik,
                kisa_vadeli_yukumluluk: kisaVadeliYukumluluk,
                teslimat_yukumlulugu: teslimatYukumlulugu,
            },
        };
    }
}
