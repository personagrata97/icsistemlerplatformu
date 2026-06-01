import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RiskCalculationResult, ScenarioParameters } from './risk-engine.types';

/**
 * Teslimat Baskısı Calculator
 * Hesaplama: Önümüzdeki 30 gün içinde yapılması gereken teslimat tutarı / Mevcut nakit
 */
@Injectable()
export class DeliveryPressureCalculator {
    constructor(private prisma: PrismaService) { }

    async calculate(params?: ScenarioParameters): Promise<RiskCalculationResult> {
        const bugun = new Date();
        const onGunSonra = new Date();
        onGunSonra.setDate(bugun.getDate() + 30);

        // 30 gün içindeki planlanan teslimatlar
        const sozlesmeler = await this.prisma.sozlesme.findMany({
            where: {
                teslim_tarihi_planlanan: {
                    gte: bugun,
                    lte: onGunSonra,
                },
                durum: 'AKTIF',
            },
        });

        let teslimatTutari = sozlesmeler.reduce(
            (sum, s) => sum + Number(s.toplam_tutar),
            0,
        );

        // Senaryo uygula
        if (params && params.teslimat_artis > 0) {
            teslimatTutari = teslimatTutari * (1 + params.teslimat_artis);
        }

        // Mevcut nakit
        const pozisyon = await this.prisma.likiditePozisyonu.findFirst({
            orderBy: { tarih: 'desc' },
        });

        let mevcutNakit = pozisyon ? Number(pozisyon.nakit) : 0;

        if (params && params.likidite_dusus !== 0) {
            mevcutNakit = mevcutNakit * (1 - params.likidite_dusus);
        }

        const teslimatBaski = mevcutNakit > 0 ? teslimatTutari / mevcutNakit : 0;

        // Risk seviyesi
        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        if (teslimatBaski > 1.5) {
            riskSeviyesi = 'RED';
        } else if (teslimatBaski > 1.0) {
            riskSeviyesi = 'YELLOW';
        }

        return {
            kpi_kodu: 'TESLIMAT_BASKI',
            deger: teslimatBaski,
            risk_seviyesi: riskSeviyesi,
            detay: {
                teslimat_tutari: teslimatTutari,
                mevcut_nakit: mevcutNakit,
                sozlesme_sayisi: sozlesmeler.length,
            },
        };
    }
}
