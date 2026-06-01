import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RiskCalculationResult, ScenarioParameters } from './risk-engine.types';

/**
 * Teslimat Yükümlülüğü Hesaplama Modülü
 * Mevzuat uyumlu tanım:
 * 1) Birikmiş teslimat talepleri (teslim_tarihi_planlanan <= bugün)
 * 2) + Önümüzdeki 30 günde teslim edilmesi gereken sözleşmeler
 * 3) - Gerçekleşmiş teslimatlar
 * 
 * Dinamik Hesaplama:
 * (Planlanan Tarih <= Bugün + 30) VE (Henüz Teslim Edilmemiş) olan sözleşmelerin toplam tutarı.
 */
@Injectable()
export class DeliveryLiabilityCalculator {
    constructor(private prisma: PrismaService) { }

    /**
     * Toplam teslimat yükümlülüğünü hesapla
     * Bu değer LCR hesaplamasında payda olarak kullanılır.
     */
    async calculateTotalLiability(params?: ScenarioParameters): Promise<number> {
        const bugun = new Date();
        const otuzGunSonra = new Date(bugun);
        otuzGunSonra.setDate(bugun.getDate() + 30);

        // Kriterlere uyan sözleşmeleri bul
        // 1. Planlanan tarih <= 30 gün sonra
        // 2. Henüz teslim edilmemiş (teslim_tarihi_gerceklesen NULL)
        // 3. İptal edilmemiş
        const contracts = await this.prisma.sozlesme.findMany({
            where: {
                teslim_tarihi_planlanan: {
                    lte: otuzGunSonra,
                },
                teslim_tarihi_gerceklesen: null,
                durum: {
                    not: 'IPTAL',
                },
            },
            select: {
                toplam_tutar: true,
            },
        });

        let totalLiability = contracts.reduce((sum, c) => sum + Number(c.toplam_tutar), 0);

        // Senaryo parametrelerine göre stres testi uygula (teslimat_artis)
        if (params && params.teslimat_artis > 0) {
            totalLiability = totalLiability * (1 + params.teslimat_artis);
        }

        return totalLiability;
    }

    /**
     * KPI sonucu olarak döndür
     */
    async calculate(params?: ScenarioParameters): Promise<RiskCalculationResult> {
        const liability = await this.calculateTotalLiability(params);

        const limit = 5_000_000; // Örnek eşik değer (5 Milyon TL)

        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        if (liability > limit * 1.5) {
            riskSeviyesi = 'RED';
        } else if (liability > limit) {
            riskSeviyesi = 'YELLOW';
        }

        return {
            kpi_kodu: 'TESLIMAT_YUKUMLULUGU',
            deger: liability,
            risk_seviyesi: riskSeviyesi,
            detay: {
                aciklama: 'Mevzuata uygun 30 günlük teslimat yükümlülüğü',
                limit: limit
            }
        };
    }
}
