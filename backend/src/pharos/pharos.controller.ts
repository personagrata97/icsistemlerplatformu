import { Controller, Post, Body, Get, UseInterceptors, UploadedFile, HttpException, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PharosService } from './pharos.service';

@UseGuards(JwtAuthGuard)
@Controller('pharos')
export class PharosController {
    constructor(private readonly pharosService: PharosService) { }

    @Get('status')
    getStatus() {
        return this.pharosService.getStatus();
    }

    @Post('upload-document')
    @UseInterceptors(FileInterceptor('file', {
        limits: { fileSize: 50 * 1024 * 1024 },
        fileFilter: (req: any, file: any, callback: any) => {
            const allowed = /\.(pdf|docx|doc|txt|md|csv|xlsx)$/i;
            if (!file.originalname.match(allowed)) {
                return callback(new HttpException('Pharos AI yalnızca PDF, Word, Excel, CSV ve Metin dosyalarını indeksleyebilir.', HttpStatus.BAD_REQUEST), false);
            }
            callback(null, true);
        }
    }))
    async uploadDocument(@UploadedFile() file: any, @Req() req: any) {
        if (!file) {
            throw new HttpException('Dosya bulunamadi', HttpStatus.BAD_REQUEST);
        }

        try {
            const result = await this.pharosService.processDocument(file.buffer, file.originalname, file.mimetype, req.user);
            return { success: true, message: result };
        } catch (error) {
            throw new HttpException({ success: false, error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('enhance')
    async enhanceFinding(@Body('findingData') findingData: any, @Req() req: any) {
        if (!findingData) {
            return { success: false, error: 'Bulgu verisi gerekli' };
        }

        try {
            const result = await this.pharosService.enhanceFinding(findingData, req.user);
            return { success: true, original: findingData, enhanced: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    @Post('rag-context')
    async getRagContext(@Body('text') text: string) {
        if (!text) {
            return { success: false, error: 'Metin gerekli' };
        }

        try {
            const contextMatches = await this.pharosService.getRagContext(text);
            return { success: true, context: contextMatches };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    @Post('chat')
    async chat(@Body() body: { message: string, history?: { role: string, content: string }[] }, @Req() req: any) {
        if (!body.message) {
            return { success: false, error: 'Mesaj gerekli' };
        }

        try {
            const response = await this.pharosService.chat(body.message, body.history || [], req.user);
            return { success: true, response };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    @Get('knowledge-base/stats')
    async getKnowledgeBaseStats() {
        try {
            const stats = await this.pharosService.getKnowledgeBaseStats();
            return { success: true, ...stats };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    @Post('knowledge-base/refresh')
    async refreshKnowledgeBase() {
        try {
            const result = await this.pharosService.refreshVectorCache();
            return { success: true, message: `Bilgi bankasi onbellegi yenilendi. ${result.count} parca yuklendi.` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    @Post('knowledge-base/delete')
    async deleteDocument(@Body('source') source: string) {
        if (!source) {
            throw new HttpException('Kaynak dosya adi gerekli', HttpStatus.BAD_REQUEST);
        }
        try {
            const result = await this.pharosService.deleteDocumentChunks(source);
            return { success: true, message: `${result.source} dosyasindan ${result.deleted} parca silindi.` };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}
