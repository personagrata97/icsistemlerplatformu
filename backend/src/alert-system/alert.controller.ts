import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { AlertService } from './alert.service';

@Controller('alerts')
export class AlertController {
    constructor(private alertService: AlertService) { }

    @Get()
    async getAlerts(@Query('durum') durum?: string, @Query('risk_seviyesi') riskSeviyesi?: string) {
        return this.alertService.getAllAlerts({ durum, risk_seviyesi: riskSeviyesi });
    }

    @Get('open')
    async getOpenAlerts() {
        return this.alertService.getOpenAlerts();
    }

    @Post(':id/close')
    async closeAlert(@Param('id') id: string) {
        return this.alertService.closeAlert(id);
    }
}
