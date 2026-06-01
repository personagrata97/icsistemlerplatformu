import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('audit/:auditId')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CommunicationController {
    constructor(private readonly commService: CommunicationService) { }

    @Get('communications')
    getCommunications(@Param('auditId') auditId: string) {
        return this.commService.getCommunications(auditId);
    }

    @Get('communications/:id')
    getCommunicationById(@Param('id') id: string) {
        return this.commService.getCommunicationById(id);
    }

    @Post('communications')
    createCommunication(@Param('auditId') auditId: string, @Request() req, @Body() data: any) {
        return this.commService.createCommunication(auditId, req.user.id, data);
    }

    @Put('communications/:id')
    updateCommunication(@Param('id') id: string, @Request() req, @Body() data: any) {
        return this.commService.updateCommunication(id, req.user.id, data);
    }

    @Delete('communications/:id')
    deleteCommunication(@Param('id') id: string) {
        return this.commService.deleteCommunication(id);
    }

    // MEETINGS ROUTE

    @Get('meetings')
    getMeetings(@Param('auditId') auditId: string) {
        return this.commService.getMeetings(auditId);
    }

    @Post('meetings')
    createMeeting(@Param('auditId') auditId: string, @Body() data: any) {
        return this.commService.createMeeting(auditId, data);
    }

    @Put('meetings/:id')
    updateMeeting(@Param('id') id: string, @Body() data: any) {
        return this.commService.updateMeeting(id, data);
    }

    @Delete('meetings/:id')
    deleteMeeting(@Param('id') id: string) {
        return this.commService.deleteMeeting(id);
    }
}
