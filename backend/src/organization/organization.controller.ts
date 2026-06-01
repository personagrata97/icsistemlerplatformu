import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/organization')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
    constructor(private readonly organizationService: OrganizationService) { }

    @Get('tree')
    getTree() {
        return this.organizationService.getTree();
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
}
