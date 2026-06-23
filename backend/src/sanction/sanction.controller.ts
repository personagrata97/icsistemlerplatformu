import { Controller, Get, Post, Body } from '@nestjs/common';
import { SanctionService } from './sanction.service';
import { MasakService } from './masak.service';

@Controller('sanction')
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
