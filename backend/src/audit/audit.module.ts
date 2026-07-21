import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { PrismaService } from '../common/prisma.service';
import { TimesheetController } from './timesheet.controller';
import { TimesheetService } from './timesheet.service';
import { WorkpaperController } from './workpaper.controller';
import { WorkpaperService } from './workpaper.service';
import { QualityController } from './quality.controller';
import { QualityService } from './quality.service';
import { IndependenceController } from './independence.controller';
import { IndependenceService } from './independence.service';
import { SamplingController } from './sampling.controller';
import { SamplingService } from './sampling.service';

import { MultiYearPlanController } from './multi-year-plan.controller';
import { MultiYearPlanService } from './multi-year-plan.service';
import { ReportGeneratorService } from './report-generator.service';
import { WorkpaperTemplateService } from './workpaper-template.service';
import { WorkpaperTemplateController } from './workpaper-template.controller';

import { EthicsController } from './ethics.controller';
import { EthicsService } from './ethics.service';
import { EmailModule } from '../email/email.module';
import { AuditronModule } from '../auditron/auditron.module';
import { FindingService } from './finding.service';
import { AuditTrashService } from './audit-trash.service';
import { AuditLogService } from './audit-log.service';
import { AuditRiskService } from './audit-risk.service';
import { RiskEngineModule } from '../risk-engine/risk-engine.module';
import { AuditStaffService } from './audit-staff.service';
import { CronService } from './cron.service';
import { DataRetentionService } from './data-retention.service';
import { EscalationService } from './escalation.service';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { NotificationModule } from '../common/notification/notification.module';
import { KvkkController } from './kvkk.controller';
import { KvkkService } from './kvkk.service';
@Module({
    imports: [EmailModule, AuditronModule, RiskEngineModule, NotificationModule],
    controllers: [
        AuditController,
        TimesheetController,
        WorkpaperController,
        QualityController,
        IndependenceController,
        SamplingController,
        MultiYearPlanController,
        WorkpaperTemplateController,
        EthicsController,
        CommunicationController,
        KvkkController,
    ],
    providers: [
        AuditService,
        TimesheetService,
        WorkpaperService,
        QualityService,
        IndependenceService,
        SamplingService,
        MultiYearPlanService,
        ReportGeneratorService,
        WorkpaperTemplateService,
        EthicsService,
        CronService,
        DataRetentionService,
        EscalationService,
        FindingService,
        AuditTrashService,
        AuditLogService,
        AuditRiskService,
        PrismaService,
        CommunicationService,
        AuditStaffService,
        KvkkService,
    ],
    exports: [AuditService, FindingService, AuditTrashService, AuditLogService, AuditRiskService],
})
export class AuditModule { }
