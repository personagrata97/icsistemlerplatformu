import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('audit/:auditId')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CommunicationController {
    constructor(private readonly commService: CommunicationService) { }

    @Get('communications')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getCommunications(@Param('auditId') auditId: string) {
        return this.commService.getCommunications(auditId);
    }

    @Get('communications/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getCommunicationById(@Param('id') id: string) {
        return this.commService.getCommunicationById(id);
    }

    @Post('communications')
    @RequirePermissions({ module: 'AUDIT', action: 'MANAGE' })
    createCommunication(@Param('auditId') auditId: string, @Request() req, @Body() data: any) {
        return this.commService.createCommunication(auditId, req.user?.id || req.user?.sub, data);
    }

    @Put('communications/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'MANAGE' })
    updateCommunication(@Param('id') id: string, @Request() req, @Body() data: any) {
        return this.commService.updateCommunication(id, req.user?.id || req.user?.sub, data);
    }

    @Delete('communications/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'MANAGE' })
    deleteCommunication(@Param('id') id: string) {
        return this.commService.deleteCommunication(id);
    }

    // MEETINGS ROUTE

    @Get('meetings')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getMeetings(@Param('auditId') auditId: string) {
        return this.commService.getMeetings(auditId);
    }

    @Post('meetings')
    @RequirePermissions({ module: 'AUDIT', action: 'MANAGE' })
    createMeeting(@Param('auditId') auditId: string, @Body() data: any) {
        return this.commService.createMeeting(auditId, data);
    }

    @Put('meetings/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'MANAGE' })
    updateMeeting(@Param('id') id: string, @Body() data: any) {
        return this.commService.updateMeeting(id, data);
    }

    @Delete('meetings/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'MANAGE' })
    deleteMeeting(@Param('id') id: string) {
        return this.commService.deleteMeeting(id);
    }
}
