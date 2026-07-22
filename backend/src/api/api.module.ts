import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ScenarioEngineModule } from '../scenario-engine/scenario-engine.module';
import { AlertSystemModule } from '../alert-system/alert-system.module';
import { RiskEngineModule } from '../risk-engine/risk-engine.module';
import { AuditModule } from '../audit/audit.module';
import { RiskController } from './risk.controller';
import { ProjectionController } from './projection.controller';
import { ContractController } from './contract.controller';

@Module({
    imports: [ScenarioEngineModule, AlertSystemModule, RiskEngineModule, AuditModule],
    providers: [PrismaService],
    controllers: [RiskController, ProjectionController, ContractController],
})
export class ApiModule { }
