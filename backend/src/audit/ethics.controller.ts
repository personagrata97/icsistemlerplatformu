import { Controller, Get, Post, Body, Param, UseGuards, Request, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { EthicsService } from './ethics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

@Controller('audit/ethics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EthicsController {
    constructor(private readonly ethicsService: EthicsService) { }

    @Public()
    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // Max 5 reports per minute per IP
    @Post()
    async createReport(@Body() body: any, @Request() req: any) {
        const ip = req.ip || req.connection?.remoteAddress;
        return this.ethicsService.createReport(body, req.user?.id, ip);
    }

    @Get()
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getReports(@Query() query: any) {
        return this.ethicsService.getReports(query);
    }

    @Get('stats')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getStats() {
        return this.ethicsService.getReportStats();
    }

    @Post(':id/assign')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async assignReport(
        @Param('id') id: string,
        @Body('assigneeId') assigneeId: string,
        @Body('conflictDeclared') conflictDeclared: boolean,
        @Request() req: any
    ) {
        return this.ethicsService.assignReport(id, assigneeId, conflictDeclared ?? false, req.user.id);
    }

    @Post(':id/declare-conflict')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async declareConflict(@Param('id') id: string, @Request() req: any) {
        return this.ethicsService.declareConflict(id, req.user.id);
    }

    @Post(':id/status')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateStatus(@Param('id') id: string, @Body('status') status: string, @Request() req: any) {
        return this.ethicsService.updateStatus(id, status, req.user.id);
    }

    @Post(':id/notes')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateNotes(@Param('id') id: string, @Body('notes') notes: string, @Request() req: any) {
        return this.ethicsService.updateInternalNotes(id, notes, req.user.id);
    }

    @Post(':id/close')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async closeReport(
        @Param('id') id: string,
        @Body() body: {
            investigationOutcome: string;
            closingSummary: string;
            disciplinaryAction: boolean;
            disciplinaryActionDetails?: string;
            linkedAuditIds?: string[];
        },
        @Request() req: any
    ) {
        return this.ethicsService.closeReport(id, body, req.user.id);
    }

    @Post(':id/message')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async addMessage(@Param('id') id: string, @Body('content') content: string, @Request() req: any) {
        return this.ethicsService.addMessage(id, content, req.user.id, false);
    }

    @Get(':id/history')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getHistory(@Param('id') id: string, @Request() req: any) {
        return this.ethicsService.getReportWithHistory(id, req.user.id);
    }

    @Public()
    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 15, ttl: 60000 } }) // Max 15 queries per minute per IP
    @Get('query/:code')
    async queryByCode(@Param('code') code: string, @Request() req: any) {
        const ip = req.ip || req.connection?.remoteAddress || 'Unknown';
        const userAgent = req.headers['user-agent'] || 'Unknown';
        return this.ethicsService.queryReportByCode(code, ip, userAgent);
    }

    @Public()
    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 10, ttl: 60000 } }) // Max 10 messages per minute per IP
    @Post('query/:code/message')
    async reporterMessage(@Param('code') code: string, @Body('content') content: string) {
        if (!content || !content.trim()) {
            throw new BadRequestException('Mesaj içeriği boş olamaz.');
        }
        if (content.length > 2000) {
            throw new BadRequestException('Mesaj içeriği maksimum 2000 karakter olabilir.');
        }
        const report = await this.ethicsService.queryReportByCode(code);
        return this.ethicsService.addMessage(report.id, content.trim(), null, true);
    }

    @Public()
    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 10, ttl: 60000 } }) // Max 10 files per minute per IP
    @Post('query/:code/evidence')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './private_uploads/ethics', // Secure storage
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                cb(null, `${randomName}${extname(file.originalname)}`);
            }
        }),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB Maksimum
        fileFilter: (req, file, cb) => {
            const allowed = [
                'application/pdf',
                'image/jpeg',
                'image/png',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ];
            if (allowed.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new BadRequestException('Güvenlik ihlali riski: Sadece PDF, Word, Excel, JPG veya PNG dosyaları yüklenebilir.'), false);
            }
        }
    }))
    async uploadPublicEvidence(@Param('code') code: string, @UploadedFile() file: any, @Request() req: any) {
        if (!file) throw new BadRequestException('Dosya yüklenemedi');
        const report = await this.ethicsService.queryReportByCode(code);
        const ip = req.ip || req.connection?.remoteAddress;
        return this.ethicsService.addEvidence(report.id, file, ip);
    }
}
