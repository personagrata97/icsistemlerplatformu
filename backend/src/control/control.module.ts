import { Module } from '@nestjs/common';
import { ControlController } from './control.controller';
import { ControlService } from './control.service';
import { PrismaService } from '../common/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { ControlCronService } from './control-cron.service';
import { NotificationModule } from '../common/notification/notification.module';

@Module({
    imports: [NotificationModule],
    controllers: [ControlController],
    providers: [ControlService, PrismaService, AuditLogService, ControlCronService],
    exports: [ControlService],
})
export class ControlModule {}
