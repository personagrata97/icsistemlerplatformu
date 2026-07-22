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
import { PdfReportService } from './pdf-report.service';
import { WorkpaperTemplateService } from './workpaper-template.service';
import { WorkpaperTemplateController } from './workpaper-template.controller';

import { EthicsController } from './ethics.controller';
import { EthicsService } from './ethics.service';
import { EmailModule } from '../email/email.module';
import { PharosModule } from '../pharos/pharos.module';
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
import { BilgiNotuService } from './bilgi-notu.service';
import { BilgiNotuController } from './bilgi-notu.controller';
import { PartialReportService } from './partial-report.service';

@Module({
    imports: [EmailModule, PharosModule, RiskEngineModule, NotificationModule],
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
        BilgiNotuController,
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
        PdfReportService,
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
        BilgiNotuService,
        PartialReportService,
    ],
    exports: [AuditService, FindingService, AuditTrashService, AuditLogService, AuditRiskService, PdfReportService, PartialReportService],
})
export class AuditModule { }
