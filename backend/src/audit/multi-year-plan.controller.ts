import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Res } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { MultiYearPlanService } from './multi-year-plan.service';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('audit/multi-year-plans')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MultiYearPlanController {
    constructor(private readonly multiYearPlanService: MultiYearPlanService) { }

    @Get()
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    findAll() {
        return this.multiYearPlanService.findAll();
    }

    @Get(':id')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    findOne(@Param('id') id: string) {
        return this.multiYearPlanService.findOne(id);
    }

    @Post()
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    create(@Body() data: any) {
        return this.multiYearPlanService.create(data);
    }

    @Put(':id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    update(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        return this.multiYearPlanService.update(id, data, req.user);
    }

    @Delete(':id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    remove(@Param('id') id: string) {
        return this.multiYearPlanService.delete(id);
    }

    @Post(':id/items')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    addItem(@Param('id') id: string, @Body() data: any) {
        return this.multiYearPlanService.addItem(id, data);
    }

    @Put('items/:itemId')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    updateItem(@Param('itemId') itemId: string, @Body() data: any) {
        return this.multiYearPlanService.updateItem(itemId, data);
    }

    @Delete('items/:itemId')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    removeItem(@Param('itemId') itemId: string) {
        return this.multiYearPlanService.deleteItem(itemId);
    }

    @Post(':id/approve')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    approve(@Param('id') id: string, @Request() req: any) {
        return this.multiYearPlanService.approve(id, req.user);
    }

    @Post(':id/export')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async export(@Param('id') id: string) {
        const filename = await this.multiYearPlanService.exportToExcel(id);
        return { filename };
    }

    @Get('download/:filename')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    download(@Param('filename') filename: string, @Res() res: Response) {
        const filePath = path.join(process.cwd(), 'uploads', 'plans', filename);
        if (!fs.existsSync(filePath)) return res.status(404).send('Dosya bulunamadı');
        res.download(filePath);
    }
}
