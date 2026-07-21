import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './common/prisma.service';
import { Public } from './auth/decorators/public.decorator';

@Controller('health')
@Public()
export class HealthController {
    constructor(private readonly prisma: PrismaService) {}

    @Get()
    async check() {
        const startTime = Date.now();
        let dbStatus = 'up';

        try {
            await this.prisma.$queryRaw`SELECT 1`;
        } catch {
            dbStatus = 'down';
        }

        return {
            status: dbStatus === 'up' ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            responseTimeMs: Date.now() - startTime,
            services: {
                database: dbStatus,
                smtp: process.env.SMTP_HOST ? 'configured' : 'not_configured',
                auditron: process.env.AUDITRON_ENABLED === 'true' ? 'enabled' : 'disabled',
            },
            version: process.env.npm_package_version || '1.0.0',
        };
    }
}
