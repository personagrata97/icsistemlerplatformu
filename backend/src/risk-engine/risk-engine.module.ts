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
    ],
    exports: [RiskEngineService, DeliveryLiabilityCalculator],
})
export class RiskEngineModule { }
