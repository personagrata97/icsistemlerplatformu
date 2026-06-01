import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../common/prisma.service';
import { AuditModule } from '../audit/audit.module';
import { AuditronModule } from '../auditron/auditron.module';

@Module({
    imports: [
        MulterModule.register({
            storage: memoryStorage(),
        }),
        AuditModule,
        AuditronModule,
    ],
    controllers: [DocumentsController],
    providers: [DocumentsService, PrismaService],
    exports: [DocumentsService],
})
export class DocumentsModule { }
