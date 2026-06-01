import { Module } from '@nestjs/common';
import { AuditronService } from './auditron.service';
import { AuditronController } from './auditron.controller';
import { EmailModule } from '../email/email.module';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [CommonModule, EmailModule],
    controllers: [AuditronController],
    providers: [AuditronService],
    exports: [AuditronService],
})
export class AuditronModule { }
