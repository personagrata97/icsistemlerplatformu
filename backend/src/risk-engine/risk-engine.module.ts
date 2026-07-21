import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RiskEngineService } from './risk-engine.service';
import { NplCalculator } from './npl.calculator';
import { LiquidityCalculator } from './liquidity.calculator';
import { DeliveryPressureCalculator } from './delivery-pressure.calculator';
import { ConcentrationCalculator } from './concentration.calculator';
import { DpdCalculator } from './dpd.calculator';
import { DeliveryLiabilityCalculator } from './delivery-liability.calculator';
import { CancellationCalculator } from './cancellation.calculator';
import { FinancingLimitCalculator } from './financing-limit.calculator';
import { EquityRatioCalculator } from './equity-ratio.calculator';
import { FinancialLiabilityCalculator } from './financial-liability.calculator';
import { TenorLimitCalculator } from './tenor-limit.calculator';
import { LotteryGroupCalculator } from './lottery-group.calculator';
import { BddkExportService } from './bddk-export.service';
import { DataIngestionService } from './data-ingestion.service';

@Module({
    providers: [
        PrismaService,
        RiskEngineService,
        NplCalculator,
        LiquidityCalculator,
        DeliveryPressureCalculator,
        ConcentrationCalculator,
        DpdCalculator,
        DeliveryLiabilityCalculator,
        CancellationCalculator,
        FinancingLimitCalculator,
        EquityRatioCalculator,
        FinancialLiabilityCalculator,
        TenorLimitCalculator,
        LotteryGroupCalculator,
        BddkExportService,
        DataIngestionService,
    ],
    exports: [
        RiskEngineService,
        DeliveryLiabilityCalculator,
        BddkExportService,
        DataIngestionService,
        FinancialLiabilityCalculator,
        TenorLimitCalculator,
        LotteryGroupCalculator,
    ],
})
export class RiskEngineModule { }
