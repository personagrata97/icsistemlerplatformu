import { Controller, Get, Post, Delete, Put, Body, Param, Request, UseGuards, Query, UnauthorizedException } from '@nestjs/common';
import { TimesheetService } from './timesheet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('audit/timesheets')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TimesheetController {
    constructor(private timesheetService: TimesheetService) { }

    private isAdmin(user: any): boolean {
        if (!user || !user.roles) return false;
        const roleCodes = user.roles.map((r: any) => typeof r === 'string' ? r : r.code || r.role?.code);
        return roleCodes.includes('ADMIN') || roleCodes.includes('AUDIT_MANAGER');
    }

    @Get()
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getMyTimesheets(@Request() req, @Query('week') week?: string) {
        return this.timesheetService.getTimesheets(req.user.userId, week);
    }

    @Get('stats')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getStats(@Request() req) {
        return this.timesheetService.getStats(req.user.userId);
    }

    // Yönetici: Onay bekleyen tüm girişler
    @Get('pending-approvals')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getPendingApprovals() {
        return this.timesheetService.getPendingApprovals();
    }

    // IIA Std 2030: Denetim bazlı efor özeti
    @Get('audit/:auditId/summary')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getAuditTimesheetSummary(@Param('auditId') auditId: string) {
        return this.timesheetService.getAuditTimesheetSummary(auditId);
    }

    // Denetim bazlı ham efor listesi
    @Get('audit/:auditId')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getAuditTimesheets(@Param('auditId') auditId: string) {
        return this.timesheetService.getAuditTimesheets(auditId);
    }

    @Post()
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async logTime(@Body() data: any, @Request() req) {
        return this.timesheetService.logTime(req.user.userId, data, req.user);
    }

    // Denetçi: Haftalık girişleri onaya gönder
    @Post('submit-for-approval')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async submitForApproval(@Body() body: { weekStart: string }, @Request() req) {
        return this.timesheetService.submitForApproval(req.user.userId, body.weekStart, req.user);
    }

    // Yönetici: Seçilen girişleri toplu onayla
    @Post('approve')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async approveTimesheets(@Body() body: { entryIds: string[] }, @Request() req) {
        if (!this.isAdmin(req.user)) throw new UnauthorizedException('Sadece yöneticiler efor onaylayabilir.');
        return this.timesheetService.approveTimesheets(body.entryIds, req.user.userId, req.user);
    }

    // Yönetici: Girişi reddet ve geri gönder
    @Post('reject/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async rejectTimesheet(@Param('id') id: string, @Body() body: { reason: string }, @Request() req) {
        if (!this.isAdmin(req.user)) throw new UnauthorizedException('Sadece yöneticiler efor reddedebilir.');
        return this.timesheetService.rejectTimesheet(id, req.user.userId, body.reason, req.user);
    }

    @Delete(':id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async deleteEntry(@Param('id') id: string, @Request() req) {
        return this.timesheetService.deleteTimeEntry(id, req.user.userId, req.user);
    }

    @Put(':id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateEntry(@Param('id') id: string, @Body() data: any, @Request() req) {
        return this.timesheetService.updateTimeEntry(id, req.user.userId, data, req.user);
    }
}
