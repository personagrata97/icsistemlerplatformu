import { Controller, Post, Body, Res, UseGuards, Req } from '@nestjs/common';
import { BilgiNotuService } from './bilgi-notu.service';
import { Response, Request } from 'express';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('api/audit/bilgi-notu')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BilgiNotuController {
    constructor(private bilgiNotuService: BilgiNotuService) {}

    @Post('generate')
    @RequirePermissions({ module: 'AUDIT', action: 'MANAGE' })
    async generate(
        @Body() body: {
            konu: string;
            ilgi?: string;
            konuAciklama: string;
            aciklamaVeDegerlendirme: string;
            sonucKanaatOneri: string;
            hazirlayanAd: string;
            hazirlayanUnvan: string;
            gozdenGecirenAd?: string;
            gozdenGecirenUnvan?: string;
            ekler?: Array<{ no: number; ad: string }>;
            tarih?: string;
        },
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const user = (req as any).user;
        const result = await this.bilgiNotuService.generateBilgiNotu(body, user);
        
        res.download(result.filePath, path.basename(result.filePath), (err) => {
            if (err) {
                res.status(500).json({ error: 'Bilgi Notu indirilemedi.' });
            }
        });
    }
}
