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
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortDir') sortDir?: 'asc' | 'desc',
    ) {
        return this.sanctionService.getMatches(
            { search, status, list },
            { page: page ? parseInt(page) : undefined, pageSize: pageSize ? parseInt(pageSize) : undefined, sortBy, sortDir }
        );
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
    async getListEntities(
        @Param('kod') kod: string,
        @Query('search') search?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortDir') sortDir?: 'asc' | 'desc',
    ) {
        return this.sanctionService.getListEntities(
            kod,
            search,
            { page: page ? parseInt(page) : undefined, pageSize: pageSize ? parseInt(pageSize) : undefined, sortBy, sortDir }
        );
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
    async getHistory(
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortDir') sortDir?: 'asc' | 'desc',
    ) {
        return this.sanctionService.getHistory({
            page: page ? parseInt(page) : undefined,
            pageSize: pageSize ? parseInt(pageSize) : undefined,
            sortBy,
            sortDir,
        });
    }

    @Get('reports')
    async getReports() {
        return this.sanctionService.getReports();
    }

    @Get('parameters')
    async getParameters() {
        return this.sanctionService.getParameters();
    }

    @Post('parameters/:id')
    async updateParameter(@Param('id') id: string, @Body() body: any, @Req() req: any) {
        const username = req.user?.displayName || req.user?.username || 'Sistem Yöneticisi';
        return this.sanctionService.updateParameter(id, body.deger, username);
    }

    @Get('logs')
    async getLogs(
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortDir') sortDir?: 'asc' | 'desc',
    ) {
        return this.sanctionService.getLogs({
            page: page ? parseInt(page) : undefined,
            pageSize: pageSize ? parseInt(pageSize) : undefined,
            sortBy,
            sortDir,
        });
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
    async getSignals(
        @Query('musteriId') musteriId?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortDir') sortDir?: 'asc' | 'desc',
    ) {
        return this.signalService.getSignals(
            musteriId,
            { page: page ? parseInt(page) : undefined, pageSize: pageSize ? parseInt(pageSize) : undefined, sortBy, sortDir }
        );
    }

    @Post('edd')
    async createEDDRecord(@Body() body: any, @Req() req: any) {
        const username = req.user?.displayName || req.user?.username || 'Uyum Görevlisi';
        return this.signalService.createEDDRecord({ ...body, user: username });
    }

    @Get('edd')
    async getEDDRecords(
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortDir') sortDir?: 'asc' | 'desc',
    ) {
        return this.signalService.getEDDRecords({
            page: page ? parseInt(page) : undefined,
            pageSize: pageSize ? parseInt(pageSize) : undefined,
            sortBy,
            sortDir,
        });
    }
}
