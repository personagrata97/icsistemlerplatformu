import { Module, MiddlewareConsumer, RequestMethod, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { DataMaskingInterceptor } from './common/data-masking.interceptor';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaService } from './common/prisma.service'; // Keeping original import
import { CommonModule } from './common/common.module';
import { RiskEngineModule } from './risk-engine/risk-engine.module';
import { ScenarioEngineModule } from './scenario-engine/scenario-engine.module';
import { AlertSystemModule } from './alert-system/alert-system.module';
import { ApiModule } from './api/api.module';
import { LiquidityStressModule } from './liquidity-stress/liquidity-stress.module';
import { AuditModule } from './audit/audit.module';
import { PharosModule } from './pharos/pharos.module';
import { ControlModule } from './control/control.module';
import { SanctionModule } from './sanction/sanction.module';
import { AuthModule } from './auth/auth.module';
import { DocumentsModule } from './documents/documents.module';
import { AdminModule } from './admin/admin.module';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailModule } from './email/email.module';
import { OrganizationModule } from './organization/organization.module';
import { NotificationModule } from './common/notification/notification.module';
import { HealthController } from './health.controller';

@Module({
    imports: [
        CommonModule,
        NotificationModule,
        ScheduleModule.forRoot(),
        EventEmitterModule.forRoot(),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        // Dakikada 60 istek limiti (brute force koruması)
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 60,
        }]),
        RiskEngineModule,
        ScenarioEngineModule,
        AlertSystemModule,
        ApiModule,
        LiquidityStressModule,
        AuditModule,
        PharosModule,
        ControlModule,
        SanctionModule,
        AuthModule,
        DocumentsModule,
        AdminModule,
        EmailModule,
        OrganizationModule,
    ],
    controllers: [HealthController],
    providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: DataMaskingInterceptor,
        },
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: PermissionsGuard,
        },
    ],
    exports: [],
})
export class AppModule {
    private readonly logger = new Logger('HTTP');

    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply((req, res, next) => {
                this.logger.log(`${req.method} ${req.url}`);
                next();
            })
            .forRoutes({ path: '*', method: RequestMethod.ALL });
    }
}
