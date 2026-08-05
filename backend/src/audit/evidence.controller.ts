import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EvidenceService } from './evidence.service';

@Controller('audit/evidence')
@UseGuards(JwtAuthGuard)
export class EvidenceController {
    constructor(private readonly evidenceService: EvidenceService) {}

    @Post()
    async attachEvidence(@Body() body: any, @Request() req: any) {
        return this.evidenceService.attachEvidence(body, req.user.id);
    }

    @Post(':id/verify')
    async verifyEvidence(@Param('id') id: string, @Request() req: any) {
        return this.evidenceService.verifyEvidence(id, req.user.id);
    }

    @Post(':id/invalidate')
    async invalidateEvidence(
        @Param('id') id: string,
        @Body('gerekce') gerekce: string,
        @Request() req: any
    ) {
        return this.evidenceService.invalidateEvidence(id, gerekce, req.user.id);
    }

    @Get('entity')
    async getEvidenceByEntity(
        @Query('kaynakTuru') kaynakTuru: string,
        @Query('kaynakId') kaynakId: string
    ) {
        return this.evidenceService.getEvidenceByEntity(kaynakTuru, kaynakId);
    }

    @Get('chain/:bulguId')
    async getEvidenceChain(@Param('bulguId') bulguId: string) {
        return this.evidenceService.getEvidenceChain(bulguId);
    }
}
