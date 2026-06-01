import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { WorkpaperTemplateService } from './workpaper-template.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('audit/workpaper-templates')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkpaperTemplateController {
    constructor(private readonly templateService: WorkpaperTemplateService) { }

    @Get()
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    findAll() {
        return this.templateService.findAll();
    }

    @Get(':id')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    findOne(@Param('id') id: string) {
        return this.templateService.findOne(id);
    }

    @Post()
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    create(@Body() data: any) {
        return this.templateService.create(data);
    }

    @Put(':id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    update(@Param('id') id: string, @Body() data: any) {
        return this.templateService.update(id, data);
    }

    @Delete(':id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    remove(@Param('id') id: string) {
        return this.templateService.delete(id);
    }

    @Post('seed')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    seed() {
        return this.templateService.seedTemplates();
    }
}
