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
import { ConciliationService } from './conciliation-new.service';

@Controller('audit/conciliation')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ConciliationNewController {
    constructor(private readonly conciliationService: ConciliationService) {}

    // Tüm itirazlar (dashboard)
    @Get()
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getAllObjections(
        @Query('durum') durum?: string,
        @Query('findingId') findingId?: string,
    ) {
        return this.conciliationService.getAllObjections({ durum, findingId });
    }

    // Bir bulguya ait itirazlar
    @Get('finding/:findingId')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    getObjectionsByFinding(@Param('findingId') findingId: string) {
        return this.conciliationService.getObjectionsByFinding(findingId);
    }

    // Yeni itiraz oluştur
    @Post()
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' }) // Birim kullanıcısı da itiraz edebilir
    createObjection(@Body() body: any, @Request() req: any) {
        return this.conciliationService.createObjection({
            findingId: body.findingId,
            itirazEdenId: req.user?.id || req.user?.sub || body.itirazEdenId,
            itirazGerekce: body.itirazGerekce,
        });
    }

    // Müfettiş görüşü ekle
    @Put(':objectionId/opinion')
    @RequirePermissions({ module: 'AUDIT', action: 'MANAGE' })
    addAuditorOpinion(
        @Param('objectionId') objectionId: string,
        @Body('mufettisGorusu') mufettisGorusu: string,
        @Request() req: any,
    ) {
        const userId = req.user?.id || req.user?.sub;
        return this.conciliationService.addAuditorOpinion(objectionId, mufettisGorusu, userId);
    }

    // İtiraz kararı (yalnızca gözetim sorumlusu)
    @Put(':objectionId/decide')
    @RequirePermissions({ module: 'AUDIT', action: 'SUPERVISE' })
    decideObjection(
        @Param('objectionId') objectionId: string,
        @Body() body: any,
        @Request() req: any,
    ) {
        return this.conciliationService.decideObjection(objectionId, {
            durum: body.durum,
            kararVerenId: req.user?.id || req.user?.sub,
            kararGerekce: body.kararGerekce,
        });
    }
}
