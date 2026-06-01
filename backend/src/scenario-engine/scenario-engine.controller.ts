import { Controller, Get, Post, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ScenarioEngineService } from './scenario-engine.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('scenario-engine')
@UseGuards(JwtAuthGuard)
export class ScenarioEngineController {
    private readonly logger = new Logger(ScenarioEngineController.name);

    constructor(private readonly scenarioService: ScenarioEngineService) { }

    /**
     * Tüm senaryoları çalıştır ve sonuçları kaydet.
     * POST /api/v1/scenario-engine/run
     */
    @Post('run')
    async runAllScenarios() {
        this.logger.log('Tüm senaryolar çalıştırılıyor...');
        const result = await this.scenarioService.runAllScenarios();
        this.logger.log('Senaryo çalıştırma tamamlandı.');
        return result;
    }

    /**
     * Belirli bir senaryonun parametrelerini getir.
     * GET /api/v1/scenario-engine/parameters/:code
     */
    @Get('parameters/:code')
    async getParameters(@Param('code') code: string) {
        return this.scenarioService.getScenarioParameters(code);
    }

    /**
     * Belirli bir senaryo için günlük özet sonuçlarını getir.
     * GET /api/v1/scenario-engine/summary/:code?date=2026-03-24
     */
    @Get('summary/:code')
    async getSummary(
        @Param('code') code: string,
        @Query('date') dateStr?: string
    ) {
        const date = dateStr ? new Date(dateStr) : new Date();
        return this.scenarioService.getScenarioSummary(code, date);
    }
}
