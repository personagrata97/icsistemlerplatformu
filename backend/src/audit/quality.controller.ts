import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { QualityService } from './quality.service';

@Controller('audit/quality')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QualityController {
    constructor(private readonly qualityService: QualityService) { }

    // ==================== METRICS ====================

    @Get('metrics')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getMetrics(@Query('period') period?: string) {
        return this.qualityService.getMetrics(period);
    }

    @Get('metrics/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getMetric(@Param('id') id: string) {
        return this.qualityService.getMetricById(id);
    }

    @Post('metrics')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    createMetric(@Body() data: any, @Request() req: any) {
        return this.qualityService.createMetric(data, req.user);
    }

    @Put('metrics/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    updateMetric(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        return this.qualityService.updateMetric(id, data, req.user);
    }

    @Delete('metrics/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    deleteMetric(@Param('id') id: string, @Request() req: any) {
        return this.qualityService.deleteMetric(id, req.user);
    }

    // ==================== ASSESSMENTS ====================

    @Get('assessments')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getAssessments(@Query('type') type?: string) {
        return this.qualityService.getAssessments(type);
    }

    @Get('assessments/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getAssessment(@Param('id') id: string) {
        return this.qualityService.getAssessmentById(id);
    }

    @Post('assessments')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    createAssessment(@Body() data: any, @Request() req: any) {
        return this.qualityService.createAssessment(data, req.user);
    }

    @Put('assessments/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    updateAssessment(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        return this.qualityService.updateAssessment(id, data, req.user);
    }

    @Delete('assessments/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    deleteAssessment(@Param('id') id: string, @Request() req: any) {
        return this.qualityService.deleteAssessment(id, req.user);
    }

    // ==================== ACTIONS ====================

    @Get('actions')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getActions(
        @Query('assessmentId') assessmentId?: string,
        @Query('status') status?: string,
    ) {
        return this.qualityService.getActions(assessmentId, status);
    }

    @Get('actions/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getAction(@Param('id') id: string) {
        return this.qualityService.getActionById(id);
    }

    @Post('actions')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    createAction(@Body() data: any, @Request() req: any) {
        return this.qualityService.createAction(data, req.user);
    }

    @Put('actions/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    updateAction(@Param('id') id: string, @Body() data: any, @Request() req: any) {
        return this.qualityService.updateAction(id, data, req.user);
    }

    @Delete('actions/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    deleteAction(@Param('id') id: string, @Request() req: any) {
        return this.qualityService.deleteAction(id, req.user);
    }

    // ==================== STATS ====================

    @Get('stats')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getStats() {
        return this.qualityService.getStats();
    }

    @Get('auto-metrics')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    calculateAutoMetrics() {
        return this.qualityService.calculateAutoMetrics();
    }
}
