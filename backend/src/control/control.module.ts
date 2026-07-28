import { Module } from '@nestjs/common';
import { ControlController } from './control.controller';
import { ControlService } from './control.service';
import { PrismaService } from '../common/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';

@Module({
    controllers: [ControlController],
    providers: [ControlService, PrismaService, AuditLogService],
    exports: [ControlService],
})
export class ControlModule {}
