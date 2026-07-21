import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SanctionService } from './sanction.service';
import { MasakService } from './masak.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('sanction')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SanctionController {
    constructor(
        private readonly sanctionService: SanctionService,
        private readonly masakService: MasakService
    ) { }

    @Get('logs')
    async getLogs() {
        return this.sanctionService.getLogs();
    }

    @Post('logs')
    async createLog(@Body() data: any) {
        return this.sanctionService.createLog(data);
    }

    /**
     * GET /sanction/masak/scan
     * MASAK Şüpheli İşlem Taraması (ŞİB)
     */
    @Get('masak/scan')
    async scanMasak() {
        return this.masakService.scanForSuspiciousTransactions();
    }
}
