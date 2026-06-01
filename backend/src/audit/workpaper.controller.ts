import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorkpaperService } from './workpaper.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('audit/workpapers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkpaperController {
    constructor(private service: WorkpaperService) { }

    @Get(':auditId')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getWorkpapers(@Param('auditId') auditId: string) {
        return this.service.getWorkpapers(auditId);
    }

    @Post(':auditId')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    @UseInterceptors(FileInterceptor('file'))
    async create(@Param('auditId') auditId: string, @UploadedFile() file: any, @Body() body: any, @Request() req) {
        if (file) {
            return this.service.uploadAndCreateWorkpaper(auditId, req.user.userId, file, body.category);
        }
        return this.service.createWorkpaper(auditId, req.user.userId, body);
    }

    @Get(':id/history')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getHistory(@Param('id') id: string) {
        return this.service.getWorkpaperHistory(id);
    }

    @Put(':id/file')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    @UseInterceptors(FileInterceptor('file'))
    async updateFile(@Param('id') id: string, @UploadedFile() file: any, @Request() req) {
        return this.service.updateWorkpaperFile(id, req.user.userId, file);
    }

    @Post(':auditId/from-template/:templateId')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async createFromTemplate(
        @Param('auditId') auditId: string,
        @Param('templateId') templateId: string,
        @Request() req
    ) {
        return this.service.createFromTemplate(auditId, req.user.userId, templateId);
    }

    // Çalışma Kağıdı Kilitleme (Check-out)
    @Put(':id/lock')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async lock(@Param('id') id: string, @Request() req) {
        return this.service.lockWorkpaper(id, req.user.userId);
    }

    // Çalışma Kağıdı Kilit Kaldırma (Check-in)
    @Put(':id/unlock')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async unlock(@Param('id') id: string, @Request() req) {
        const isAdmin = req.user.roles?.some((r: any) => {
            const code = typeof r === 'string' ? r : r.code || r.role?.code;
            return code === 'ADMIN' || code === 'AUDIT_MANAGER';
        }) || false;
        return this.service.unlockWorkpaper(id, req.user.userId, isAdmin);
    }

    // Gözden Geçirme Onayı (Sign-off)
    @Put(':id/sign-off')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async signOff(@Param('id') id: string, @Request() req) {
        return this.service.signOffWorkpaper(id, req.user.userId, 'REVIEWER');
    }

    // Süpervizör Onayı (Supervisor Approve)
    @Put(':id/supervisor-approve')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async supervisorApprove(@Param('id') id: string, @Request() req) {
        return this.service.signOffWorkpaper(id, req.user.userId, 'SUPERVISOR');
    }

    // Revizyon Talebi (Geri Gönder)
    @Put(':id/revision')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async requestRevision(@Param('id') id: string, @Body() body: { revisionNotes: string }, @Request() req) {
        return this.service.requestRevision(id, req.user.userId, body.revisionNotes);
    }

    // Silme (Korumalı)
    @Delete(':id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async delete(@Param('id') id: string, @Request() req) {
        return this.service.deleteWorkpaper(id, req.user.userId);
    }

    // Güvenli İndirme
    @Get(':id/download')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async download(@Param('id') id: string, @Request() req: any, @Res() res: any) {
        const wp = await this.service.getWorkpaperById(id);
        if (!wp) throw new Error('Çalışma kağıdı bulunamadı');

        const filePath = await this.service.getWorkpaperAbsolutePath(wp);
        const fs = await import('fs');
        if (!fs.existsSync(filePath)) {
            throw new Error('Dosya sunucuda bulunamadı');
        }

        // Denetim loglama (Download Audit Log)
        await this.service.logDownload(wp, req.user);

        res.set('Access-Control-Expose-Headers', 'Content-Disposition');
        return res.download(filePath, wp.title);
    }
}
