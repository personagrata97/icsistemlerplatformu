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
    UseInterceptors,
    UploadedFile,
    HttpException,
    HttpStatus,
    Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { SamplingService } from './sampling.service';

@Controller('audit/sampling')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SamplingController {
    constructor(private readonly samplingService: SamplingService) { }

    // Get all samples
    @Get()
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getAll(
        @Query('auditId') auditId?: string,
        @Query('method') method?: string,
        @Query('status') status?: string,
    ) {
        return this.samplingService.getAll({ auditId, method, status });
    }

    // Get sample by ID
    @Get(':id')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getById(@Param('id') id: string) {
        return this.samplingService.getById(id);
    }

    // Create new sample plan
    @Post()
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    create(@Body() data: any, @Request() req: any) {
        return this.samplingService.create(data, req.user);
    }

    // Update sample plan
    @Put(':id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    update(@Param('id') id: string, @Body() data: any) {
        return this.samplingService.update(id, data);
    }

    // Delete sample plan
    @Delete(':id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    delete(@Param('id') id: string, @Request() req: any) {
        return this.samplingService.delete(id, req.user);
    }

    // Advanced Sampling Generator
    @Post('advanced-generate')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async generateAdvancedSample(@Body() config: any, @Request() req: any) {
        return this.samplingService.generateAdvancedSample(config, req.user);
    }

    // Direct Database Contract Sampling (Live DB Integration)
    @Post('from-database')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async generateSampleFromDatabase(
        @Body() params: { auditId: string; method?: string; sampleSize?: number; statusFilter?: string },
        @Request() req: any
    ) {
        return this.samplingService.generateSampleFromDatabase(params, req.user);
    }

    // Advanced Sampling Generator with File Upload
    @Post('advanced-generate-with-file')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    @UseInterceptors(FileInterceptor('file', {
        limits: {
            fieldSize: 50 * 1024 * 1024,
            fileSize: 50 * 1024 * 1024
        },
        fileFilter: (req: any, file: any, callback: any) => {
            const allowed = /\.(csv|xlsx|xls|json|pdf|txt|zip|docx|doc)$/i;
            if (!file.originalname.match(allowed)) {
                return callback(new HttpException('Geçersiz dosya formatı. Sadece CSV, Excel, JSON, PDF ve Word dosyalarına izin verilir.', HttpStatus.BAD_REQUEST), false);
            }
            callback(null, true);
        }
    }))
    async generateAdvancedWithFile(
        @Body() body: { config: string },
        @UploadedFile() file: any,
        @Request() req: any
    ) {
        try {
            const config = JSON.parse(body.config);
            return await this.samplingService.generateAdvancedSampleWithFile(config, file, req.user);
        } catch (error: any) {
            throw new HttpException(
                error.message || 'Örneklem oluşturulurken bir hata oluştu.',
                error.status || HttpStatus.BAD_REQUEST
            );
        }
    }

    // Calculate sample size (utility endpoint)
    @Post('calculate')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    calculateSampleSize(@Body() data: {
        populationSize: number;
        confidenceLevel: number;
        errorRate: number;
        expectedErrorRate?: number;
    }) {
        return this.samplingService.calculateSampleSize(data);
    }

    // Perform selection for a sample plan
    @Post(':id/select')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    performSelection(@Param('id') id: string, @Body() data?: { items?: string[] }) {
        return this.samplingService.performSelection(id, data);
    }

    // Systematic selection
    @Post(':id/systematic-select')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    systematicSelection(@Param('id') id: string) {
        return this.samplingService.systematicSelection(id);
    }

    // Record test results
    @Put(':id/results')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    recordResults(@Param('id') id: string, @Body() data: {
        testResult: string;
        deviationsFound: number;
        conclusions: string;
        notes?: string;
    }) {
        return this.samplingService.recordResults(id, data);
    }

    // Get stats
    @Get('stats/summary')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getStats() {
        return this.samplingService.getStats();
    }

    // Convert sample to finding
    @Post(':id/convert-to-finding')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    convertToFinding(@Param('id') id: string, @Request() req: any) {
        return this.samplingService.convertToFinding(id, req.user);
    }
}
