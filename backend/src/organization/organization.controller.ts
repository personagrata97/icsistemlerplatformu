import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('organization')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
    constructor(private readonly organizationService: OrganizationService) { }

    @Get('tree')
    getTree() {
        return this.organizationService.getTree();
    }

    @Get('units')
    getUnits() {
        return this.organizationService.getUnits();
    }

    @Post()
    createNode(@Body() data: any) {
        return this.organizationService.createNode(data);
    }

    @Put(':id')
    updateNode(@Param('id') id: string, @Body() data: any) {
        return this.organizationService.updateNode(id, data);
    }

    @Delete(':id')
    deleteNode(@Param('id') id: string) {
        return this.organizationService.deleteNode(id);
    }

    // --- JobTitles API ---
    @Get('titles')
    getJobTitles(@Query('module') module?: string) {
        return this.organizationService.getJobTitles(module);
    }

    @Post('titles')
    createJobTitle(@Body() data: any) {
        return this.organizationService.createJobTitle(data);
    }

    @Put('titles/:id')
    updateJobTitle(@Param('id') id: string, @Body() data: any) {
        return this.organizationService.updateJobTitle(id, data);
    }

    @Delete('titles/:id')
    deleteJobTitle(@Param('id') id: string) {
        return this.organizationService.deleteJobTitle(id);
    }
}
