import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ControlService } from './control.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('control')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ControlController {
    constructor(private readonly controlService: ControlService) {}

    // İstatistikler
    @Get('stats')
    @RequirePermissions({ module: 'CONTROL', action: 'VIEW' })
    async getStats() {
        return this.controlService.getControlStats();
    }

    // Kontrol Envanteri Listeleme
    @Get('inventory')
    @RequirePermissions({ module: 'CONTROL', action: 'VIEW' })
    async getInventory(
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortDir') sortDir?: 'asc' | 'desc',
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('department') department?: string,
    ) {
        return this.controlService.getControlInventory({
            page: page ? parseInt(page) : undefined,
            pageSize: pageSize ? parseInt(pageSize) : (limit ? parseInt(limit) : undefined),
            sortBy,
            sortDir,
            search,
            status,
            department,
        });
    }

    // Yeni Kontrol Tanımı Oluştur
    @Post('inventory')
    @RequirePermissions({ module: 'CONTROL', action: 'MANAGE' })
    async createControlItem(@Body() body: any, @Request() req: any) {
        const userId = req.user?.id || req.user?.sub;
        return this.controlService.createControlItem(body, userId);
    }

    // Kontrol Testleri Listeleme
    @Get('tests')
    @RequirePermissions({ module: 'CONTROL', action: 'VIEW' })
    async getControlTests(
        @Query('controlId') controlId?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortDir') sortDir?: 'asc' | 'desc',
    ) {
        return this.controlService.getControlTests(controlId, {
            page: page ? parseInt(page) : undefined,
            pageSize: pageSize ? parseInt(pageSize) : undefined,
            sortBy,
            sortDir,
        });
    }

    // Kontrol Testi Kaydetme (Sonuç Etkin Değilse Otomatik Eksiklik Oluşur)
    @Post('tests')
    @RequirePermissions({ module: 'CONTROL', action: 'MANAGE' })
    async createControlTest(@Body() body: any, @Request() req: any) {
        const userId = req.user?.id || req.user?.sub;
        return this.controlService.createControlTest(body, userId);
    }

    // Kontrol Eksiklikleri Listeleme
    @Get('deficiencies')
    @RequirePermissions({ module: 'CONTROL', action: 'VIEW' })
    async getControlDeficiencies(
        @Query('status') status?: string,
        @Query('severity') severity?: string,
        @Query('department') department?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortDir') sortDir?: 'asc' | 'desc',
        @Request() req?: any,
    ) {
        let dept = department;
        if (req?.user?.role === 'BIRIM_KULLANICISI' && req?.user?.department) {
            dept = req.user.department;
        }
        return this.controlService.getControlDeficiencies(
            { status, severity, department: dept },
            {
                page: page ? parseInt(page) : undefined,
                pageSize: pageSize ? parseInt(pageSize) : undefined,
                sortBy,
                sortDir,
            }
        );
    }

    // Kontrol Eksikliği Durum Güncelleme
    @Put('deficiencies/:id/status')
    @RequirePermissions({ module: 'CONTROL', action: 'MANAGE' })
    async updateDeficiencyStatus(
        @Param('id') id: string,
        @Body('status') status: string,
        @Body('actionPlan') actionPlan?: string,
        @Request() req?: any,
    ) {
        const userId = req.user?.id || req.user?.sub;
        return this.controlService.updateDeficiencyStatus(id, status, userId, actionPlan);
    }

    // Mutabakata Gönder
    @Post('deficiencies/:id/send-to-conciliation')
    @RequirePermissions({ module: 'CONTROL', action: 'MANAGE' })
    async sendToConciliation(@Param('id') id: string, @Request() req: any) {
        const userId = req.user?.id || req.user?.sub;
        return this.controlService.sendToConciliation(id, userId);
    }

    // Birim Mutabakat Yanıtı Gir
    @Post('deficiencies/:id/unit-response')
    @RequirePermissions({ module: 'CONTROL', action: 'VIEW' })
    async submitUnitResponse(
        @Param('id') id: string,
        @Body('response') response: 'KATILIYOR' | 'KISMEN_KATILIYOR' | 'KATILMIYOR',
        @Body('reason') reason: string,
        @Request() req: any,
    ) {
        const userId = req.user?.id || req.user?.sub;
        return this.controlService.submitUnitResponse(id, response, reason, userId);
    }

    // Mutabakat Değerlendirme Kararı (İç Kontrol Yöneticisi)
    @Post('deficiencies/:id/decide-conciliation')
    @RequirePermissions({ module: 'CONTROL', action: 'MANAGE' })
    async decideConciliation(
        @Param('id') id: string,
        @Body('decision') decision: 'UZLASILDI' | 'UST_YONETIM',
        @Body('reason') reason: string,
        @Request() req: any,
    ) {
        const userId = req.user?.id || req.user?.sub;
        return this.controlService.decideConciliation(id, decision, reason, userId);
    }

    // Resmi Tebliğ Et
    @Post('deficiencies/:id/notify')
    @RequirePermissions({ module: 'CONTROL', action: 'MANAGE' })
    async officiallyNotify(@Param('id') id: string, @Request() req: any) {
        const userId = req.user?.id || req.user?.sub;
        return this.controlService.officiallyNotify(id, userId);
    }

    // Kanıt Yükle
    @Post('deficiencies/:id/evidences')
    @RequirePermissions({ module: 'CONTROL', action: 'VIEW' })
    async uploadEvidence(
        @Param('id') id: string,
        @Body('fileName') fileName: string,
        @Body('description') description: string,
        @Body('filePath') filePath: string,
        @Request() req: any,
    ) {
        const userId = req.user?.id || req.user?.sub;
        return this.controlService.uploadEvidence(id, fileName, description, userId, filePath);
    }

    // Kanıt Değerlendir (Onayla / Reddet)
    @Put('evidences/:id/approval')
    @RequirePermissions({ module: 'CONTROL', action: 'MANAGE' })
    async approveEvidence(
        @Param('id') id: string,
        @Body('approvalStatus') approvalStatus: 'ONAYLANDI' | 'REDDEDILDI',
        @Body('rejectionReason') rejectionReason: string,
        @Request() req: any,
    ) {
        const userId = req.user?.id || req.user?.sub;
        return this.controlService.approveEvidence(id, approvalStatus, rejectionReason, userId);
    }

    // Birim Öz Değerlendirme Listeleme
    @Get('self-assessment')
    @RequirePermissions({ module: 'CONTROL', action: 'VIEW' })
    async getSelfAssessments(
        @Query('department') department?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortDir') sortDir?: 'asc' | 'desc',
    ) {
        return this.controlService.getSelfAssessments(department, {
            page: page ? parseInt(page) : undefined,
            pageSize: pageSize ? parseInt(pageSize) : undefined,
            sortBy,
            sortDir,
        });
    }

    // Birim Öz Değerlendirme Girişi
    @Post('self-assessment')
    @RequirePermissions({ module: 'CONTROL', action: 'VIEW' })
    async createSelfAssessment(@Body() body: any, @Request() req: any) {
        const userId = req.user?.id || req.user?.sub;
        return this.controlService.createSelfAssessment(body, userId);
    }

    // Birim Öz Değerlendirme Doğrulama (Kontrol Yöneticisi)
    @Put('self-assessment/:id/verify')
    @RequirePermissions({ module: 'CONTROL', action: 'MANAGE' })
    async verifySelfAssessment(
        @Param('id') id: string,
        @Body('result') result: 'Onaylandı' | 'Revize İste' | 'Reddedildi',
        @Request() req: any,
    ) {
        const userId = req.user?.id || req.user?.sub;
        const userName = req.user?.displayName || req.user?.username || 'Kontrol Yöneticisi';
        return this.controlService.verifySelfAssessment(id, result, userId, userName);
    }
}
