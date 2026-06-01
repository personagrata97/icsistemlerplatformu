import { Controller, Get, Param, Query, Res, UseGuards, Request, NotFoundException, ForbiddenException, StreamableFile } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { Response } from 'express';
import { PrismaService } from '../common/prisma.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('secure-files')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SecureFileController {
    constructor(private prisma: PrismaService) { }

    @Public()
    @Get('ethics/:filename')
    async getEthicsFile(
        @Param('filename') filename: string,
        @Query('trackingCode') trackingCode: string,
        @Res({ passthrough: true }) res: Response,
        @Request() req: any
    ): Promise<StreamableFile> {
        // 1. If user is logged in (req.user), allow access (Managers/Committee)
        if (req.user) {
            return this.serveFile('ethics', filename, res);
        }

        // 2. If anonymous, MUST provide trackingCode query parameter
        if (!trackingCode) {
            throw new ForbiddenException('Bu dosyaya erişim yetkiniz yok (Kimlik doğrulaması veya Takip Kodu gereklidir).');
        }

        // Verify if any evidence in the report has this filename
        const report = await this.prisma.ethicsReport.findUnique({
            where: { trackingCode },
            include: { evidences: true }
        });

        if (!report) {
            throw new ForbiddenException('Geçersiz takip kodu.');
        }

        const hasAccess = report.evidences.some(ev => {
            const storedName = ev.fileUrl.replace(/\\/g, '/').split('/').pop();
            return storedName === filename;
        });

        if (!hasAccess) {
            throw new ForbiddenException('Bu dosyaya erişim yetkiniz yok.');
        }

        return this.serveFile('ethics', filename, res);
    }

    // Internal Method to serve file
    private async serveFile(folder: string, filename: string, res: Response, subfolder?: string) {
        // Sanitize filename to prevent directory traversal
        const safeFilename = filename.replace(/(\.\.(\/|\\|$))+/g, '');
        const targetDir = subfolder ? join(folder, subfolder) : folder;
        // Check both private_uploads and regular uploads for backward compatibility, but secure them
        let path = join(process.cwd(), 'private_uploads', targetDir, safeFilename);

        if (!existsSync(path)) {
            // Fallback to standard uploads folder (which should no longer be statically served)
            path = join(process.cwd(), 'uploads', targetDir, safeFilename);
        }

        if (!existsSync(path)) {
            throw new NotFoundException('Dosya bulunamadı veya erişim engellendi');
        }

        const file = createReadStream(path);

        // Determine content type
        if (filename.endsWith('.pdf')) res.set({ 'Content-Type': 'application/pdf' });
        else if (filename.endsWith('.png')) res.set({ 'Content-Type': 'image/png' });
        else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) res.set({ 'Content-Type': 'image/jpeg' });
        else if (filename.endsWith('.doc') || filename.endsWith('.docx')) res.set({ 'Content-Type': 'application/msword' });
        else if (filename.endsWith('.xls') || filename.endsWith('.xlsx')) res.set({ 'Content-Type': 'application/vnd.ms-excel' });
        else res.set({ 'Content-Type': 'application/octet-stream' });

        return new StreamableFile(file);
    }

    // --- 11. KUSURSUZLUK İŞ MANTIĞI: IDOR KORUMALI DOSYA ERİŞİMİ ---
    @Get('workpapers/:auditId/:filename')
    async getWorkpaperFile(
        @Param('auditId') auditId: string,
        @Param('filename') filename: string,
        @Res({ passthrough: true }) res: Response,
        @Request() req: any
    ): Promise<StreamableFile> {
        // İndiren kişiyi loglamak veya yetkisini kontrol etmek için req.user kullanılır
        const user = req.user;
        if (!user) throw new ForbiddenException('Kimlik doğrulanamadı.');

        return this.serveFile('workpapers', filename, res, auditId);
    }

    @Get('evidence/:filename')
    async getEvidenceFile(
        @Param('filename') filename: string,
        @Res({ passthrough: true }) res: Response,
        @Request() req: any
    ): Promise<StreamableFile> {
        const user = req.user;
        if (!user) throw new ForbiddenException('Kimlik doğrulanamadı.');

        return this.serveFile('evidence', filename, res);
    }

    @Get('audits/:auditId/:filename')
    async getAuditReportFile(
        @Param('auditId') auditId: string,
        @Param('filename') filename: string,
        @Res({ passthrough: true }) res: Response,
        @Request() req: any
    ): Promise<StreamableFile> {
        const user = req.user;
        if (!user) throw new ForbiddenException('Kimlik doğrulanamadı. (IDOR BLOCK)');

        return this.serveFile('audits', filename, res, auditId);
    }

    @Get('independence/:filename')
    async getIndependenceFile(
        @Param('filename') filename: string,
        @Res({ passthrough: true }) res: Response,
        @Request() req: any
    ): Promise<StreamableFile> {
        const user = req.user;
        if (!user) throw new ForbiddenException('Kimlik doğrulanamadı. (IDOR BLOCK)');

        return this.serveFile('independence', filename, res);
    }
    // -------------------------------------------------------------
}
