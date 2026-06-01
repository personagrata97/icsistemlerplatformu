import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { DeliveryLiabilityCalculator } from '../risk-engine/delivery-liability.calculator';

export interface StressTestResult {
    senaryo_ad: string;
    lcr_deger: number;
    risk_seviyesi: 'GREEN' | 'YELLOW' | 'RED';
}

@Injectable()
export class LiquidityStressService {
    constructor(
        private prisma: PrismaService,
        private deliveryLiabilityCalculator: DeliveryLiabilityCalculator
    ) { }

    async calculateAllScenarios(): Promise<StressTestResult[]> {
        // En son likidite pozisyonunu al
        const pozisyon = await this.prisma.likiditePozisyonu.findFirst({
            orderBy: { tarih: 'desc' },
        });

        if (!pozisyon) {
            return [];
        }

        const nakit = Number(pozisyon.nakit);
        const likitVarlik = Number(pozisyon.likit_varlik);
        const kisaVadeliYukumluluk = Number(pozisyon.kisa_vadeli_yukumluluk);

        // Baz teslimat yükümlülüğünü hesapla
        const bazTeslimatYukumlulugu = await this.deliveryLiabilityCalculator.calculateTotalLiability();

        const results: StressTestResult[] = [];

        // Senaryo 1: Teslimat Talebi %25 Artışı
        // LCR = (Likit Varlık) / (Yükümlülük + (Teslimat * 1.25))
        const lcr1 = this.calculateLcr(
            nakit + likitVarlik,
            kisaVadeliYukumluluk + (bazTeslimatYukumlulugu * 1.25)
        );
        results.push(this.createResult('TESLIMAT_ARTIS_25', lcr1));

        // Senaryo 2: İptal Oranı %20 Artışı
        // İptaller nakit çıkışını artırır -> Likit varlığı azaltır (Basitleştirilmiş yaklaşım: Nakit %10 azalır varsayımı)
        // Veya daha sofistike: İptal iadeleri yükümlülüğe eklenir. 
        // Basitlik için: İptallerin %20 artması kısa vadeli yükümlülüğü %10 artırsın.
        const lcr2 = this.calculateLcr(
            nakit + likitVarlik,
            (kisaVadeliYukumluluk * 1.10) + bazTeslimatYukumlulugu
        );
        results.push(this.createResult('IPTAL_ARTIS_20', lcr2));

        // Senaryo 3: Tahsilat Oranı %15 Azalışı
        // Likit varlıklar (nakit girişi) azalır.
        const lcr3 = this.calculateLcr(
            (nakit + likitVarlik) * 0.85,
            kisaVadeliYukumluluk + bazTeslimatYukumlulugu
        );
        results.push(this.createResult('TAHSILAT_DUSUS_15', lcr3));

        // Sonuçları DB'ye kaydet
        await this.saveResults(results);

        return results;
    }

    private calculateLcr(pay: number, payda: number): number {
        return payda > 0 ? pay / payda : 0;
    }

    private createResult(senaryoAd: string, lcr: number): StressTestResult {
        let risk = 'GREEN';
        if (lcr < 0.8) risk = 'RED';
        else if (lcr < 1.0) risk = 'YELLOW';

        return {
            senaryo_ad: senaryoAd,
            lcr_deger: lcr,
            risk_seviyesi: risk as 'GREEN' | 'YELLOW' | 'RED'
        };
    }

    private async saveResults(results: StressTestResult[]) {
        // Önce bugünkü aynı senaryoları temizle (opsiyonel, veya log gibi tutabiliriz)
        // Log gibi tutalım.
        await this.prisma.likiditeStresSonucu.createMany({
            data: results.map(r => ({
                senaryo_ad: r.senaryo_ad,
                lcr_deger: r.lcr_deger,
                risk_seviyesi: r.risk_seviyesi
            }))
        });
    }
}
