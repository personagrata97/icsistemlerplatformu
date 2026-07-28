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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { FollowUpService } from './follow-up.service';

@Controller('audit/follow-up')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FollowUpController {
    constructor(private readonly followUpService: FollowUpService) {}

    // Tüm aksiyonlar (dashboard)
    @Get()
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getAllActions(
        @Query('durum') durum?: string,
        @Query('sorumluId') sorumluId?: string,
        @Query('findingId') findingId?: string,
    ) {
        return this.followUpService.getAllActions({ durum, sorumluId, findingId });
    }

    // Bir bulguya ait aksiyonlar
    @Get('finding/:findingId')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getActionsByFinding(@Param('findingId') findingId: string) {
        return this.followUpService.getActionsByFinding(findingId);
    }

    // Yeni aksiyon oluştur
    @Post()
    @RequirePermissions({ module: 'AUDIT', action: 'MANAGE' })
    createAction(@Body() body: any, @Request() req: any) {
        return this.followUpService.createAction({
            findingId: body.findingId,
            aksiyonTanimi: body.aksiyonTanimi,
            sorumluId: body.sorumluId,
            terminTarihi: body.terminTarihi,
            olusturanId: req.user?.id || req.user?.sub || body.olusturanId,
            notlar: body.notlar,
        });
    }

    // Aksiyon durumu güncelle
    @Put(':actionId/status')
    @RequirePermissions({ module: 'AUDIT', action: 'MANAGE' })
    updateActionStatus(
        @Param('actionId') actionId: string,
        @Body('durum') durum: string,
        @Request() req: any,
    ) {
        const userId = req.user?.id || req.user?.sub;
        return this.followUpService.updateActionStatus(actionId, durum, userId);
    }

    // Kanıt yükle
    @Post(':actionId/evidence')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' }) // Birim kullanıcısı da yükleyebilir
    uploadEvidence(
        @Param('actionId') actionId: string,
        @Body() body: any,
        @Request() req: any,
    ) {
        return this.followUpService.uploadEvidence({
            aksiyonId: actionId,
            dosyaAdi: body.dosyaAdi,
            dosyaYolu: body.dosyaYolu,
            aciklama: body.aciklama,
            yukleyenId: req.user?.id || req.user?.sub || body.yukleyenId,
        });
    }

    // Kanıt onayla/reddet (yalnızca gözetim sorumlusu)
    @Put('evidence/:evidenceId/approve')
    @RequirePermissions({ module: 'AUDIT', action: 'SUPERVISE' })
    approveEvidence(
        @Param('evidenceId') evidenceId: string,
        @Body() body: any,
        @Request() req: any,
    ) {
        const userId = req.user?.id || req.user?.sub;
        return this.followUpService.approveEvidence(
            evidenceId,
            userId,
            body.onayDurumu,
            body.redGerekce,
        );
    }
}
