import { Controller, Post, Body, Res, UseGuards, Req } from '@nestjs/common';
import { BilgiNotuService } from './bilgi-notu.service';
import { Response, Request } from 'express';
import * as path from 'path';

@Controller('api/audit/bilgi-notu')
export class BilgiNotuController {
    constructor(private bilgiNotuService: BilgiNotuService) {}

    @Post('generate')
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
