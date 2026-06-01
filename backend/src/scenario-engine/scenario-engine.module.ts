import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RiskEngineModule } from '../risk-engine/risk-engine.module';
import { ScenarioEngineService } from './scenario-engine.service';
import { ScenarioEngineController } from './scenario-engine.controller';

@Module({
    imports: [RiskEngineModule],
    controllers: [ScenarioEngineController],
    providers: [PrismaService, ScenarioEngineService],
    exports: [ScenarioEngineService],
})
export class ScenarioEngineModule { }
