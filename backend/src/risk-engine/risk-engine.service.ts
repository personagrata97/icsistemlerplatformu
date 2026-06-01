import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { NplCalculator } from './npl.calculator';
import { LiquidityCalculator } from './liquidity.calculator';
import { DeliveryPressureCalculator } from './delivery-pressure.calculator';
import { DeliveryLiabilityCalculator } from './delivery-liability.calculator';
import { ConcentrationCalculator } from './concentration.calculator';
import { DpdCalculator } from './dpd.calculator';
import { CancellationCalculator } from './cancellation.calculator';
import { RiskCalculationResult, ScenarioParameters } from './risk-engine.types';

@Injectable()
export class RiskEngineService {
    constructor(
        private prisma: PrismaService,
        private nplCalculator: NplCalculator,
        private liquidityCalculator: LiquidityCalculator,
        private deliveryPressureCalculator: DeliveryPressureCalculator,
        private concentrationCalculator: ConcentrationCalculator,
        private dpdCalculator: DpdCalculator,
        private deliveryLiabilityCalculator: DeliveryLiabilityCalculator,
        private cancellationCalculator: CancellationCalculator
    ) { }

    private readonly logger = new Logger(RiskEngineService.name);

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
            this.logger.debug('NPL hesaplanıyor...');
            results.push(await this.nplCalculator.calculate(scenarioParams));

            // Likidite
            this.logger.debug('Likidite hesaplanıyor...');
            results.push(await this.liquidityCalculator.calculate(scenarioParams));

            // Teslimat Baskısı
            this.logger.debug('Teslimat baskısı hesaplanıyor...');
            results.push(await this.deliveryPressureCalculator.calculate(scenarioParams));

            // Konsantrasyon - Bölge
            this.logger.debug('Konsantrasyon (bölge) hesaplanıyor...');
            results.push(await this.concentrationCalculator.calculateByRegion());

            // Konsantrasyon - Vade
            this.logger.debug('Konsantrasyon (vade) hesaplanıyor...');
            results.push(await this.concentrationCalculator.calculateByMaturity());

            // DPD Dağılım
            this.logger.debug('DPD dağılım hesaplanıyor...');
            results.push(await this.dpdCalculator.calculate(scenarioParams));

            // Teslimat Yükümlülüğü
            this.logger.debug('Teslimat yükümlülüğü hesaplanıyor...');
            results.push(await this.deliveryLiabilityCalculator.calculate(scenarioParams));

            // İptal Oranı
            this.logger.debug('İptal oranı hesaplanıyor...');
            results.push(await this.cancellationCalculator.calculate(scenarioParams));

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
            case 'DPD_DAGILIM':
                return this.dpdCalculator.calculate(scenarioParams);
            case 'TESLIMAT_YUKUMLULUGU':
                return this.deliveryLiabilityCalculator.calculate(scenarioParams);
            case 'IPTAL_ORANI':
                return this.cancellationCalculator.calculate(scenarioParams);
            default:
                return null;
        }
    }
}
