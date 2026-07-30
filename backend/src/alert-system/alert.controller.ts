import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AlertService } from './alert.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('alerts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AlertController {
    constructor(private alertService: AlertService) { }

    @Get()
    async getAlerts(
        @Query('durum') durum?: string,
        @Query('risk_seviyesi') riskSeviyesi?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortDir') sortDir?: 'asc' | 'desc',
    ) {
        return this.alertService.getAllAlerts(
            { durum, risk_seviyesi: riskSeviyesi },
            { page: page ? parseInt(page) : undefined, pageSize: pageSize ? parseInt(pageSize) : undefined, sortBy, sortDir }
        );
    }

    @Get('open')
    async getOpenAlerts(
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortDir') sortDir?: 'asc' | 'desc',
    ) {
        return this.alertService.getOpenAlerts({
            page: page ? parseInt(page) : undefined,
            pageSize: pageSize ? parseInt(pageSize) : undefined,
            sortBy,
            sortDir,
        });
    }

    @Post(':id/close')
    async closeAlert(@Param('id') id: string) {
        return this.alertService.closeAlert(id);
    }
}
