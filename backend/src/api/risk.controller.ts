import { Controller, Get, Post, Query } from '@nestjs/common';
import { ScenarioEngineService } from '../scenario-engine/scenario-engine.service';
import { AlertService } from '../alert-system/alert.service';

@Controller('risk')
export class RiskController {
    constructor(
        private scenarioEngine: ScenarioEngineService,
        private alertService: AlertService,
    ) { }

    /**
     * GET /risk/summary?senaryo=BAZ
     * Belirli bir senaryo için risk özetini döner
     */
    @Get('summary')
    async getRiskSummary(@Query('senaryo') senaryo: string = 'BAZ') {
        const ozet = await this.scenarioEngine.getScenarioSummary(senaryo);
        return {
            senaryo_kodu: senaryo,
            ozet,
        };
    }

    /**
     * GET /risk/run
     * Tüm senaryoları çalıştırır ve sonuçları kaydeder
     */
    @Get('run')
    async runAllScenarios() {
        const result = await this.scenarioEngine.runAllScenarios();

        // Her senaryo için uyarıları kontrol et
        const senaryolar = await this.scenarioEngine['prisma'].senaryo.findMany();

        for (const senaryo of senaryolar) {
            const ozetler = await this.scenarioEngine.getScenarioSummary(senaryo.senaryo_kodu);

            for (const ozet of ozetler) {
                await this.alertService.checkLimitsAndCreateAlerts(
                    ozet.kpi_kodu,
                    Number(ozet.deger),
                    senaryo.senaryo_kodu,
                    ozet.risk_seviyesi,
                );
            }
        }

        return result;
    }
}
