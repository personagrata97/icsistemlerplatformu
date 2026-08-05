import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyDocumentService } from './company-document.service';

@Controller('audit/company-documents')
@UseGuards(JwtAuthGuard)
export class CompanyDocumentController {
    constructor(private readonly documentService: CompanyDocumentService) {}

    @Post()
    async createDocument(@Body() body: any) {
        return this.documentService.createDocument(body);
    }

    @Post(':id/version')
    async updateVersion(@Param('id') id: string, @Body() body: any) {
        return this.documentService.updateVersion(id, body);
    }

    @Post('link')
    async linkToFinding(@Body() body: any) {
        return this.documentService.linkToFinding(body);
    }

    @Get('expiring')
    async getExpiringDocuments() {
        return this.documentService.getExpiringDocuments();
    }

    @Get('by-unit')
    async getDocumentsByUnit(@Query('sorumluBirimId') sorumluBirimId?: string) {
        return this.documentService.getDocumentsByUnit(sorumluBirimId);
    }

    @Get('references')
    async getReferencesByEntity(
        @Query('kaynakTuru') kaynakTuru: string,
        @Query('kaynakId') kaynakId: string
    ) {
        return this.documentService.getReferencesByEntity(kaynakTuru, kaynakId);
    }

    @Get()
    async getDocuments(
        @Query('tur') tur?: string,
        @Query('durum') durum?: string,
        @Query('search') search?: string
    ) {
        return this.documentService.getDocuments({ tur, durum, search });
    }

    @Get(':id')
    async getDocumentById(@Param('id') id: string) {
        return this.documentService.getDocumentById(id);
    }
}
