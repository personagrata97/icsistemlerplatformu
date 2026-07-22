import { Controller, Get, Post, Body, Query, Param, Req, UseGuards } from '@nestjs/common';
import { SanctionService } from './sanction.service';
import { MasakService } from './masak.service';
import { SanctionImportService } from './sanction-import.service';
import { SanctionCronService } from './sanction-cron.service';
import { ReputationSignalService } from './reputation-signal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('sanction')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SanctionController {
    constructor(
        private readonly sanctionService: SanctionService,
        private readonly masakService: MasakService,
        private readonly importService: SanctionImportService,
        private readonly cronService: SanctionCronService,
        private readonly signalService: ReputationSignalService
    ) { }

    @Get('dashboard')
    async getDashboardStats() {
        return this.sanctionService.getDashboardStats();
    }

    @Get('matches')
    async getMatches(
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('list') list?: string,
    ) {
        return this.sanctionService.getMatches({ search, status, list });
    }

    @Post('scan')
    async runScan(@Body() body: any, @Req() req: any) {
        const username = req.user?.displayName || req.user?.username || 'Sistem';
        return this.sanctionService.screenAllPortfolios(username);
    }

    @Post('screening/customer/:id')
    async screenCustomer(@Param('id') id: string) {
        return this.sanctionService.screenCustomer(id);
    }

    @Post('screening/portfolio')
    async screenPortfolio(@Req() req: any) {
        const username = req.user?.displayName || req.user?.username || 'Sistem Uyum Görevlisi';
        return this.sanctionService.screenAllPortfolios(username);
    }

    @Post('matches/:id/decide')
    async decideMatch(@Param('id') id: string, @Body() body: any, @Req() req: any) {
        const username = req.user?.displayName || req.user?.username || 'Sistem';
        return this.sanctionService.decideMatch(id, body.decision, body.reason, username);
    }

    @Get('lists')
    async getLists() {
        return this.sanctionService.getLists();
    }

    @Get('lists/:kod/entities')
    async getListEntities(@Param('kod') kod: string, @Query('search') search?: string) {
        return this.sanctionService.getListEntities(kod, search);
    }

    @Post('lists/custom/entities')
    async createCustomEntity(@Body() body: any, @Req() req: any) {
        const username = req.user?.displayName || req.user?.username || 'Sistem';
        return this.sanctionService.createCustomEntity(body, username);
    }

    @Post('sync/:kod')
    async syncList(@Param('kod') kod: string) {
        return this.importService.syncList(kod);
    }

    @Post('cron/run')
    async runCron() {
        return this.cronService.handleDailySanctionCron();
    }

    @Get('history')
    async getHistory() {
        return this.sanctionService.getHistory();
    }

    @Get('logs')
    async getLogs() {
        return this.sanctionService.getLogs();
    }

    @Post('logs')
    async createLog(@Body() data: any) {
        return this.sanctionService.createLog(data);
    }

    @Get('masak/scan')
    async scanMasak() {
        return this.masakService.scanForSuspiciousTransactions();
    }

    // ============================================================
    // İTİBAR RİSKİ VE EDD (GENİŞLETİLMİŞ DURUM TESPİTİ) ENDPOINTLERİ
    // ============================================================

    @Post('reputation/evaluate/:id')
    async evaluateReputation(@Param('id') id: string) {
        return this.signalService.evaluateSignalsForCustomer(id);
    }

    @Get('reputation/signals')
    async getSignals(@Query('musteriId') musteriId?: string) {
        return this.signalService.getSignals(musteriId);
    }

    @Post('edd')
    async createEDDRecord(@Body() body: any, @Req() req: any) {
        const username = req.user?.displayName || req.user?.username || 'Uyum Görevlisi';
        return this.signalService.createEDDRecord({ ...body, user: username });
    }

    @Get('edd')
    async getEDDRecords() {
        return this.signalService.getEDDRecords();
    }
}
