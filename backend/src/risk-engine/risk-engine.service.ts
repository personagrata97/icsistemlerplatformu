import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NplCalculator } from './npl.calculator';
import { LiquidityCalculator } from './liquidity.calculator';
import { DeliveryPressureCalculator } from './delivery-pressure.calculator';
import { DeliveryLiabilityCalculator } from './delivery-liability.calculator';
import { ConcentrationCalculator } from './concentration.calculator';
import { DpdCalculator } from './dpd.calculator';
import { CancellationCalculator } from './cancellation.calculator';
import { FinancingLimitCalculator } from './financing-limit.calculator';
import { EquityRatioCalculator } from './equity-ratio.calculator';
import { FinancialLiabilityCalculator } from './financial-liability.calculator';
import { TenorLimitCalculator } from './tenor-limit.calculator';
import { LotteryGroupCalculator } from './lottery-group.calculator';
import { RiskCalculationResult, ScenarioParameters } from './risk-engine.types';

@Injectable()
export class RiskEngineService implements OnModuleInit {
    constructor(
        private prisma: PrismaService,
        private nplCalculator: NplCalculator,
        private liquidityCalculator: LiquidityCalculator,
        private deliveryPressureCalculator: DeliveryPressureCalculator,
        private concentrationCalculator: ConcentrationCalculator,
        private dpdCalculator: DpdCalculator,
        private deliveryLiabilityCalculator: DeliveryLiabilityCalculator,
        private cancellationCalculator: CancellationCalculator,
        private financingLimitCalculator: FinancingLimitCalculator,
        private equityRatioCalculator: EquityRatioCalculator,
        private financialLiabilityCalculator: FinancialLiabilityCalculator,
        private tenorLimitCalculator: TenorLimitCalculator,
        private lotteryGroupCalculator: LotteryGroupCalculator
    ) { }

    private readonly logger = new Logger(RiskEngineService.name);

    async onModuleInit() {
        this.logger.log('Sistem başlangıcında Risk KPI tanımları ve Limitleri doğrulanıyor...');
        try {
            const kpis = [
                { kpi_kodu: 'NPL', aciklama: 'Takipteki Sözleşme Oranı', birim: 'YUZDE' },
                { kpi_kodu: 'LCR', aciklama: 'Likidite Oranı', birim: 'YUZDE' },
                { kpi_kodu: 'TESLIMAT_BASKI', aciklama: 'Teslimat Baskısı', birim: 'ORAN' },
                { kpi_kodu: 'KONSANTRASYON_BOLGE', aciklama: 'Bölge Konsantrasyonu', birim: 'YUZDE' },
                { kpi_kodu: 'KONSANTRASYON_VADE', aciklama: 'Vade Konsantrasyonu', birim: 'YUZDE' },
                { kpi_kodu: 'KONSANTRASYON_TUZEL', aciklama: 'Tüzel Kişi Konsantrasyonu', birim: 'YUZDE' },
                { kpi_kodu: 'KONSANTRASYON_TEKIL_MUSTERI', aciklama: 'Tekil Müşteri Finansman Limiti (%150)', birim: 'YUZDE' },
                { kpi_kodu: 'DPD_DAGILIM', aciklama: 'Gecikme Dağılımı (90+ Gün Oranı)', birim: 'YUZDE' },
                { kpi_kodu: 'TESLIMAT_YUKUMLULUGU', aciklama: 'Teslimat Yükümlülüğü (30 Gün)', birim: 'TUTAR' },
                { kpi_kodu: 'IPTAL_ORANI', aciklama: 'İptal Oranı', birim: 'YUZDE' },
                { kpi_kodu: 'FINANSMAN_LIMITI', aciklama: 'Toplam Finansman Limiti', birim: 'YUZDE' },
                { kpi_kodu: 'OZKAYNAK_YETERLILIK', aciklama: 'Özkaynak Yeterlilik Oranı', birim: 'YUZDE' },
                { kpi_kodu: 'KONSANTRASYON_RISK_GRUBU', aciklama: 'Risk Grubu Yoğunlaşması', birim: 'YUZDE' },
                { kpi_kodu: 'MALI_YUKUMLULUK_OZKAYNAK', aciklama: 'Mali Yükümlülük / Özkaynak Oranı (%30)', birim: 'YUZDE' },
                { kpi_kodu: 'VADE_SINIRI_MEVZUAT_UYUM', aciklama: 'Vade Sınırı Mevzuat İhlal Sayısı', birim: 'ADET' },
                { kpi_kodu: 'CEKILISLI_GRUP_DOLULUK_ORANI', aciklama: 'Çekilişli Grup Asgari Doluluk Oranı (%40)', birim: 'YUZDE' }
            ];

            for (const kpi of kpis) {
                await this.prisma.riskKpi.upsert({
                    where: { kpi_kodu: kpi.kpi_kodu },
                    update: { aciklama: kpi.aciklama, birim: kpi.birim },
                    create: kpi
                });
            }

            // Remove existing limits to ensure clean sync and prevent duplicates
            await this.prisma.riskLimit.deleteMany({});

            const defaultLimits = [
                { kpi_kodu: 'NPL', esik_deger: 3.00, karsilastirma: 'GT', seviye: 'YELLOW' },
                { kpi_kodu: 'NPL', esik_deger: 5.00, karsilastirma: 'GT', seviye: 'RED' },
                { kpi_kodu: 'LCR', esik_deger: 110.00, karsilastirma: 'LT', seviye: 'YELLOW' },
                { kpi_kodu: 'LCR', esik_deger: 100.00, karsilastirma: 'LT', seviye: 'RED' },
                { kpi_kodu: 'TESLIMAT_BASKI', esik_deger: 1.00, karsilastirma: 'GT', seviye: 'YELLOW' },
                { kpi_kodu: 'TESLIMAT_BASKI', esik_deger: 1.50, karsilastirma: 'GT', seviye: 'RED' },
                { kpi_kodu: 'KONSANTRASYON_BOLGE', esik_deger: 25.00, karsilastirma: 'GT', seviye: 'YELLOW' },
                { kpi_kodu: 'KONSANTRASYON_BOLGE', esik_deger: 30.00, karsilastirma: 'GT', seviye: 'RED' },
                { kpi_kodu: 'KONSANTRASYON_VADE', esik_deger: 35.00, karsilastirma: 'GT', seviye: 'YELLOW' },
                { kpi_kodu: 'KONSANTRASYON_VADE', esik_deger: 40.00, karsilastirma: 'GT', seviye: 'RED' },
                { kpi_kodu: 'KONSANTRASYON_TUZEL', esik_deger: 4.00, karsilastirma: 'GT', seviye: 'YELLOW' },
                { kpi_kodu: 'KONSANTRASYON_TUZEL', esik_deger: 5.00, karsilastirma: 'GT', seviye: 'RED' },
                { kpi_kodu: 'KONSANTRASYON_TEKIL_MUSTERI', esik_deger: 10.00, karsilastirma: 'GT', seviye: 'YELLOW' },
                { kpi_kodu: 'KONSANTRASYON_TEKIL_MUSTERI', esik_deger: 15.00, karsilastirma: 'GT', seviye: 'RED' },
                { kpi_kodu: 'DPD_DAGILIM', esik_deger: 10.00, karsilastirma: 'GT', seviye: 'YELLOW' },
                { kpi_kodu: 'DPD_DAGILIM', esik_deger: 20.00, karsilastirma: 'GT', seviye: 'RED' },
                { kpi_kodu: 'TESLIMAT_YUKUMLULUGU', esik_deger: 5000000.00, karsilastirma: 'GT', seviye: 'YELLOW' },
                { kpi_kodu: 'TESLIMAT_YUKUMLULUGU', esik_deger: 7500000.00, karsilastirma: 'GT', seviye: 'RED' },
                { kpi_kodu: 'IPTAL_ORANI', esik_deger: 8.00, karsilastirma: 'GT', seviye: 'YELLOW' },
                { kpi_kodu: 'IPTAL_ORANI', esik_deger: 10.00, karsilastirma: 'GT', seviye: 'RED' },
                { kpi_kodu: 'FINANSMAN_LIMITI', esik_deger: 180.00, karsilastirma: 'GT', seviye: 'YELLOW' },
                { kpi_kodu: 'FINANSMAN_LIMITI', esik_deger: 200.00, karsilastirma: 'GT', seviye: 'RED' },
                { kpi_kodu: 'OZKAYNAK_YETERLILIK', esik_deger: 4.00, karsilastirma: 'LT', seviye: 'YELLOW' },
                { kpi_kodu: 'OZKAYNAK_YETERLILIK', esik_deger: 3.00, karsilastirma: 'LT', seviye: 'RED' },
                { kpi_kodu: 'KONSANTRASYON_RISK_GRUBU', esik_deger: 20.00, karsilastirma: 'GT', seviye: 'YELLOW' },
                { kpi_kodu: 'KONSANTRASYON_RISK_GRUBU', esik_deger: 25.00, karsilastirma: 'GT', seviye: 'RED' },
                { kpi_kodu: 'MALI_YUKUMLULUK_OZKAYNAK', esik_deger: 25.00, karsilastirma: 'GT', seviye: 'YELLOW' },
                { kpi_kodu: 'MALI_YUKUMLULUK_OZKAYNAK', esik_deger: 30.00, karsilastirma: 'GT', seviye: 'RED' },
                { kpi_kodu: 'VADE_SINIRI_MEVZUAT_UYUM', esik_deger: 1.00, karsilastirma: 'GT', seviye: 'RED' },
                { kpi_kodu: 'CEKILISLI_GRUP_DOLULUK_ORANI', esik_deger: 50.00, karsilastirma: 'LT', seviye: 'YELLOW' },
                { kpi_kodu: 'CEKILISLI_GRUP_DOLULUK_ORANI', esik_deger: 40.00, karsilastirma: 'LT', seviye: 'RED' }
            ];

            for (const limit of defaultLimits) {
                await this.prisma.riskLimit.create({ data: limit });
            }
            this.logger.log('Risk KPI tanımları ve Limitleri başarıyla temizlendi ve yeniden yüklendi.');
        } catch (error) {
            this.logger.error('Risk KPI tanımları ve Limitleri doğrulanırken hata:', error);
        }
    }

    /**
     * Tüm KPI'ları hesapla
     */
    async calculateAllKpis(
        scenarioParams?: ScenarioParameters,
    ): Promise<RiskCalculationResult[]> {
        this.logger.log(`Tüm KPI hesaplamaları başlatıldı ${scenarioParams ? '(senaryo parametreleri mevcut)' : ''}`);
        try {
            const results: RiskCalculationResult[] = [];

            // NPL
            results.push(await this.nplCalculator.calculate(scenarioParams));

            // Likidite
            results.push(await this.liquidityCalculator.calculate(scenarioParams));

            // Teslimat Baskısı
            results.push(await this.deliveryPressureCalculator.calculate(scenarioParams));

            // Konsantrasyon - Bölge
            results.push(await this.concentrationCalculator.calculateByRegion());

            // Konsantrasyon - Vade
            results.push(await this.concentrationCalculator.calculateByMaturity());

            // Konsantrasyon - Tüzel Kişi Sınırı (BDDK %5)
            results.push(await this.concentrationCalculator.calculateByCustomerType());

            // Konsantrasyon - Tekil Müşteri Finansman Limiti (%150)
            results.push(await this.concentrationCalculator.calculateSingleCustomerLimit());

            // DPD Dağılım
            results.push(await this.dpdCalculator.calculate(scenarioParams));

            // Teslimat Yükümlülüğü
            results.push(await this.deliveryLiabilityCalculator.calculate(scenarioParams));

            // İptal Oranı
            results.push(await this.cancellationCalculator.calculate(scenarioParams));

            // Toplam Finansman Limiti (Yönetmelik %200 sınırı)
            results.push(await this.financingLimitCalculator.calculate());

            // Özkaynak Yeterlilik Oranı (Yönetmelik asgari %3)
            results.push(await this.equityRatioCalculator.calculate());

            // Risk Grubu Konsantrasyonu (Yönetmelik Aralık 2023)
            results.push(await this.concentrationCalculator.calculateByRiskGroup());

            // Mali Yükümlülük / Özkaynak Oranı (Yönetmelik m.6, %30 Sınırı)
            results.push(await this.financialLiabilityCalculator.calculate());

            // Vade Sınırı Mevzuat İhlali (Konut 120 ay, Taşıt 60 ay)
            results.push(await this.tenorLimitCalculator.calculate());

            // Çekilişli Grup Asgari Doluluk Oranı (Yönetmelik m.21, %40 Sınırı)
            results.push(await this.lotteryGroupCalculator.calculate());

            return results;
        } catch (error) {
            this.logger.error('KPI hesaplama hatası:', error);
            throw error;
        }
    }

    /**
     * Tekil KPI hesapla
     */
    async calculateSingleKpi(
        kpiCode: string,
        scenarioParams?: ScenarioParameters,
    ): Promise<RiskCalculationResult | null> {
        switch (kpiCode) {
            case 'NPL':
                return this.nplCalculator.calculate(scenarioParams);
            case 'LCR':
                return this.liquidityCalculator.calculate(scenarioParams);
            case 'TESLIMAT_BASKI':
                return this.deliveryPressureCalculator.calculate(scenarioParams);
            case 'KONSANTRASYON_BOLGE':
                return this.concentrationCalculator.calculateByRegion();
            case 'KONSANTRASYON_VADE':
                return this.concentrationCalculator.calculateByMaturity();
            case 'KONSANTRASYON_TUZEL':
                return this.concentrationCalculator.calculateByCustomerType();
            case 'KONSANTRASYON_TEKIL_MUSTERI':
                return this.concentrationCalculator.calculateSingleCustomerLimit();
            case 'DPD_DAGILIM':
                return this.dpdCalculator.calculate(scenarioParams);
            case 'TESLIMAT_YUKUMLULUGU':
                return this.deliveryLiabilityCalculator.calculate(scenarioParams);
            case 'IPTAL_ORANI':
                return this.cancellationCalculator.calculate(scenarioParams);
            case 'FINANSMAN_LIMITI':
                return this.financingLimitCalculator.calculate();
            case 'OZKAYNAK_YETERLILIK':
                return this.equityRatioCalculator.calculate();
            case 'KONSANTRASYON_RISK_GRUBU':
                return this.concentrationCalculator.calculateByRiskGroup();
            case 'MALI_YUKUMLULUK_OZKAYNAK':
                return this.financialLiabilityCalculator.calculate();
            case 'VADE_SINIRI_MEVZUAT_UYUM':
                return this.tenorLimitCalculator.calculate();
            case 'CEKILISLI_GRUP_DOLULUK_ORANI':
                return this.lotteryGroupCalculator.calculate();
            default:
                return null;
        }
    }
}
