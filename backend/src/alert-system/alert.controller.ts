import { Controller, Get, Post, Put, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
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
        @Query('birimId') birimId?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortDir') sortDir?: 'asc' | 'desc',
        @Request() req?: any
    ) {
        let dept = birimId;
        if (req?.user?.role === 'BIRIM_KULLANICISI' && req?.user?.department) {
            dept = req.user.department;
        }

        return this.alertService.getAllAlerts(
            { durum, risk_seviyesi: riskSeviyesi, birimId: dept },
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

    @Post(':id/assign')
    async assignAlert(
        @Param('id') id: string,
        @Body() body: { birimId: string; atananId?: string },
        @Request() req?: any
    ) {
        return this.alertService.assignAlert(id, body.birimId, body.atananId, req?.user?.id);
    }

    @Post(':id/unit-response')
    async submitUnitResponse(
        @Param('id') id: string,
        @Body() body: { birimYaniti: string; yanitGerekcesi?: string },
        @Request() req?: any
    ) {
        return this.alertService.submitUnitResponse(id, body.birimYaniti, body.yanitGerekcesi, req?.user?.id);
    }

    @Post(':id/actions')
    async createAction(
        @Param('id') alertId: string,
        @Body() body: { aksiyonTanimi: string; sorumluId?: string; sorumluBirimId?: string; terminTarihi?: string },
        @Request() req?: any
    ) {
        const termin = body.terminTarihi ? new Date(body.terminTarihi) : undefined;
        return this.alertService.createAction(alertId, body.aksiyonTanimi, body.sorumluId, body.sorumluBirimId, termin, req?.user?.id);
    }

    @Get('actions')
    async getActions(
        @Query('alertId') alertId?: string,
        @Query('durum') durum?: string,
        @Query('sorumluBirimId') sorumluBirimId?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Request() req?: any
    ) {
        let dept = sorumluBirimId;
        if (req?.user?.role === 'BIRIM_KULLANICISI' && req?.user?.department) {
            dept = req.user.department;
        }
        return this.alertService.getActions(
            { alertId, durum, sorumluBirimId: dept },
            { page: page ? parseInt(page) : undefined, pageSize: pageSize ? parseInt(pageSize) : undefined }
        );
    }

    @Put('actions/:id/status')
    async updateActionStatus(
        @Param('id') actionId: string,
        @Body() body: { durum: string; tamamlanmaTarihi?: string },
        @Request() req?: any
    ) {
        const tDate = body.tamamlanmaTarihi ? new Date(body.tamamlanmaTarihi) : undefined;
        return this.alertService.updateActionStatus(actionId, body.durum, tDate, req?.user?.id);
    }

    @Post('actions/:id/evidence')
    async uploadActionEvidence(
        @Param('id') actionId: string,
        @Body() body: { dosyaId: string; aciklama: string },
        @Request() req?: any
    ) {
        return this.alertService.uploadActionEvidence(actionId, body.dosyaId, body.aciklama, req?.user?.id || 'SYSTEM');
    }

    @Put('evidences/:id/approval')
    async approveActionEvidence(
        @Param('id') evidenceId: string,
        @Body() body: { onayDurumu: 'ONAYLANDI' | 'REDDEDILDI'; rejectionReason?: string },
        @Request() req?: any
    ) {
        return this.alertService.approveActionEvidence(evidenceId, body.onayDurumu, body.rejectionReason, req?.user?.id);
    }

    @Post(':id/close-with-evidence')
    async closeAlertWithEvidence(
        @Param('id') alertId: string,
        @Body() body: { kapanisGerekcesi: string },
        @Request() req?: any
    ) {
        return this.alertService.closeAlertWithEvidence(alertId, body.kapanisGerekcesi, req?.user?.id);
    }

    @Post(':id/close')
    async closeAlert(@Param('id') id: string) {
        return this.alertService.closeAlert(id);
    }
}
