import { Controller, Get, Post, Delete, Body, Param, Query, HttpCode, HttpStatus, UseInterceptors, UploadedFile, UseGuards, Req, HttpException, Res, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService, CreateDocumentDto, DocumentCategory } from './documents.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
    private readonly logger = new Logger(DocumentsController.name);
    constructor(private readonly documentsService: DocumentsService) { }

    @Get()
    findAll(@Query('category') category?: DocumentCategory) {
        return this.documentsService.findAll(category);
    }

    @Get('stats')
    getStats() {
        return this.documentsService.getStats();
    }

    @Get('categories')
    getCategories() {
        return [
            { id: 'TEFTIS_KURULU', label: 'Teftiş Kurulu Dokümanları' },
            { id: 'DIGER_BIRIMLER', label: 'Diğer Birim Dokümanları' },
            { id: 'MEVZUAT', label: 'Mevzuat Dokümanları' },
            { id: 'TEMPLATES', label: 'Denetim Şablonları' },
            { id: 'AUDITRON', label: 'Auditron AI Dokümanları' },
        ];
    }

    @Get('search')
    search(@Query('q') query: string, @Query('category') category?: DocumentCategory) {
        return this.documentsService.search(query, category);
    }

    @Get('ai-search')
    aiSearch(@Query('q') query: string) {
        return this.documentsService.aiSearch(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.documentsService.findOne(id);
    }

    @Get('download/:id')
    async downloadFile(@Param('id') id: string, @Req() req: any, @Res() res: any) {
        const fileInfo = await this.documentsService.serveFile(id, 'download', req.user);
        res.set({
            'Content-Type': fileInfo.mimeType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(fileInfo.fileName)}"`,
        });
        fileInfo.stream.pipe(res);
    }

    @Get('view/:id')
    async viewFile(@Param('id') id: string, @Req() req: any, @Res() res: any) {
        const fileInfo = await this.documentsService.serveFile(id, 'view', req.user);
        res.set({
            'Content-Type': fileInfo.mimeType,
            'Content-Disposition': `inline; filename="${encodeURIComponent(fileInfo.fileName)}"`,
        });
        fileInfo.stream.pipe(res);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        limits: { fileSize: 50 * 1024 * 1024 },
        fileFilter: (req: any, file: any, callback: any) => {
            const allowed = /\.(pdf|docx|doc|xlsx|xls|png|jpg|jpeg|txt|csv|zip)$/i;
            if (!file.originalname.match(allowed)) {
                return callback(new HttpException('Güvenlik İhlali: İzin verilmeyen dosya uzantısı!', HttpStatus.BAD_REQUEST), false);
            }
            callback(null, true);
        }
    }))
    @HttpCode(HttpStatus.CREATED)
    async uploadFile(@UploadedFile('file') file: any, @Body() body: { category: string; title: string }, @Req() req: any) {
        if (!file) {
            this.logger.error('Dosya yüklenmedi!');
            throw new HttpException('Dosya yüklenmedi! Lütfen bir dosya seçin.', HttpStatus.BAD_REQUEST);
        }
        this.logger.log(`Dosya yükleniyor: ${file.originalname}, Kategori: ${body.category}`);
        try {
            return await this.documentsService.upload(file, body.category, body.title, req.user);
        } catch (error) {
            this.logger.error('Dosya yükleme hatası:', error);
            throw new HttpException({
                status: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Dosya yükleme sırasında sunucu hatası oluştu.',
                error: error instanceof Error ? error.message : String(error)
            }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateDocumentDto) {
        return this.documentsService.create(dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Req() req: any) {
        return this.documentsService.remove(id, req.user);
    }

    @Post(':id/update')
    @UseInterceptors(FileInterceptor('file', {
        limits: { fileSize: 50 * 1024 * 1024 },
        fileFilter: (req: any, file: any, callback: any) => {
            const allowed = /\.(pdf|docx|doc|xlsx|xls|png|jpg|jpeg|txt|csv|zip)$/i;
            if (!file.originalname.match(allowed)) {
                return callback(new HttpException('Güvenlik İhlali: İzin verilmeyen dosya uzantısı!', HttpStatus.BAD_REQUEST), false);
            }
            callback(null, true);
        }
    }))
    updateDocument(
        @Param('id') id: string,
        @UploadedFile() file: any,
        @Body() body: { category: DocumentCategory; title: string },
        @Req() req: any
    ) {
        return this.documentsService.updateDocument(id, file, body.category, body.title, req.user);
    }

    @Get(':id/history')
    getDocumentHistory(@Param('id') id: string) {
        return this.documentsService.getDocumentHistory(id);
    }

    @Post(':id/restore/:versionId')
    restoreVersion(@Param('id') id: string, @Param('versionId') versionId: string, @Req() req: any) {
        return this.documentsService.restoreVersion(id, versionId, req.user);
    }
}
