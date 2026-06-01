import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RiskCalculationResult } from './risk-engine.types';

/**
 * Konsantrasyon Risk Calculator
 * Bölge ve vade bazlı konsantrasyon risklerini hesaplar
 */
@Injectable()
export class ConcentrationCalculator {
    constructor(private prisma: PrismaService) { }

    async calculateByRegion(): Promise<RiskCalculationResult> {
        // Bölge bazında sözleşme dağılımı
        const sozlesmeler = await this.prisma.sozlesme.findMany({
            where: { durum: 'AKTIF' },
            include: { musteri: true },
        });

        const bolgeMap = new Map<string, number>();
        let toplamTutar = 0;

        sozlesmeler.forEach((s) => {
            const bolge = s.musteri.bolge;
            const tutar = Number(s.toplam_tutar);
            bolgeMap.set(bolge, (bolgeMap.get(bolge) || 0) + tutar);
            toplamTutar += tutar;
        });

        // En yüksek konsantrasyonu bul
        let maxKonsantrasyon = 0;
        let maxBolge = '';

        bolgeMap.forEach((tutar, bolge) => {
            const oran = toplamTutar > 0 ? tutar / toplamTutar : 0;
            if (oran > maxKonsantrasyon) {
                maxKonsantrasyon = oran;
                maxBolge = bolge;
            }
        });

        // Risk seviyesi
        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        if (maxKonsantrasyon > 0.40) {
            riskSeviyesi = 'RED';
        } else if (maxKonsantrasyon > 0.30) {
            riskSeviyesi = 'YELLOW';
        }

        return {
            kpi_kodu: 'KONSANTRASYON_BOLGE',
            deger: maxKonsantrasyon,
            risk_seviyesi: riskSeviyesi,
            detay: {
                max_bolge: maxBolge,
                bolge_dagilim: Object.fromEntries(bolgeMap),
            },
        };
    }

    async calculateByMaturity(): Promise<RiskCalculationResult> {
        // Vade bazında sözleşme dağılımı
        const sozlesmeler = await this.prisma.sozlesme.findMany({
            where: { durum: 'AKTIF' },
        });

        const vadeMap = new Map<string, number>();
        let toplamTutar = 0;

        sozlesmeler.forEach((s) => {
            let vadeGrup = '';
            if (s.vade <= 12) vadeGrup = '0-12 Ay';
            else if (s.vade <= 24) vadeGrup = '13-24 Ay';
            else if (s.vade <= 36) vadeGrup = '25-36 Ay';
            else vadeGrup = '36+ Ay';

            const tutar = Number(s.toplam_tutar);
            vadeMap.set(vadeGrup, (vadeMap.get(vadeGrup) || 0) + tutar);
            toplamTutar += tutar;
        });

        // En yüksek konsantrasyonu bul
        let maxKonsantrasyon = 0;
        let maxVadeGrup = '';

        vadeMap.forEach((tutar, vadeGrup) => {
            const oran = toplamTutar > 0 ? tutar / toplamTutar : 0;
            if (oran > maxKonsantrasyon) {
                maxKonsantrasyon = oran;
                maxVadeGrup = vadeGrup;
            }
        });

        // Risk seviyesi
        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        if (maxKonsantrasyon > 0.50) {
            riskSeviyesi = 'RED';
        } else if (maxKonsantrasyon > 0.40) {
            riskSeviyesi = 'YELLOW';
        }

        return {
            kpi_kodu: 'KONSANTRASYON_VADE',
            deger: maxKonsantrasyon,
            risk_seviyesi: riskSeviyesi,
            detay: {
                max_vade_grup: maxVadeGrup,
                vade_dagilim: Object.fromEntries(vadeMap),
            },
        };
    }
}
