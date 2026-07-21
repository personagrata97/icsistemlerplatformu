import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AlertService } from './alert.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('alerts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
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
