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
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('department') department?: string,
    ) {
        return this.controlService.getControlInventory({
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : undefined,
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
    async getControlTests(@Query('controlId') controlId?: string) {
        return this.controlService.getControlTests(controlId);
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
    ) {
        return this.controlService.getControlDeficiencies({ status, severity, department });
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

    // Birim Öz Değerlendirme Listeleme
    @Get('self-assessment')
    @RequirePermissions({ module: 'CONTROL', action: 'VIEW' })
    async getSelfAssessments(@Query('department') department?: string) {
        return this.controlService.getSelfAssessments(department);
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
