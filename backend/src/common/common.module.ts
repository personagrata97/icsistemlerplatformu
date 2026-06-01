import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaService } from './prisma.service';
import { SecureFileController } from './secure-file.controller';
import { AuditAccessLogInterceptor } from './interceptors/audit-access-log.interceptor';

@Global()
@Module({
    controllers: [SecureFileController],
    providers: [
        PrismaService,
        {
            provide: APP_INTERCEPTOR,
            useClass: AuditAccessLogInterceptor,
        },
    ],
    exports: [PrismaService],
})
export class CommonModule { }
