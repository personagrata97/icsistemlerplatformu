import { Module } from '@nestjs/common';
import { LiquidityStressService } from './liquidity-stress.service';
import { LiquidityStressController } from './liquidity-stress.controller';
import { PrismaService } from '../common/prisma.service';
import { RiskEngineModule } from '../risk-engine/risk-engine.module';

@Module({
    imports: [RiskEngineModule], // DeliveryLiabilityCalculator için
    controllers: [LiquidityStressController],
    providers: [LiquidityStressService, PrismaService],
})
export class LiquidityStressModule { }
