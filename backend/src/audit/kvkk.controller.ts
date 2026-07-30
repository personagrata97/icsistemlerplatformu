import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { KvkkService } from './kvkk.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('audit/kvkk')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class KvkkController {
    constructor(private readonly kvkkService: KvkkService) {}

    // ============================================================
    // VERİ SAKLAMA POLİTİKALARI
    // ============================================================

    @Get('retention-policies')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getRetentionPolicies(
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortDir') sortDir?: 'asc' | 'desc',
    ) {
        return this.kvkkService.getRetentionPolicies({
            page: page ? parseInt(page, 10) : undefined,
            pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
            sortBy,
            sortDir,
        });
    }

    @Post('retention-policies')
    @RequirePermissions({ module: 'ADMIN', action: 'EDIT' })
    async createRetentionPolicy(@Body() body: any, @Request() req: any) {
        return this.kvkkService.createRetentionPolicy(body, req.user);
    }

    @Patch('retention-policies/:id')
    @RequirePermissions({ module: 'ADMIN', action: 'EDIT' })
    async updateRetentionPolicy(@Param('id') id: string, @Body() body: any, @Request() req: any) {
        return this.kvkkService.updateRetentionPolicy(id, body, req.user);
    }

    // ============================================================
    // VERİ SAHİBİ BAŞVURULARI
    // ============================================================

    @Get('data-subject-requests')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getDataSubjectRequests(
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortDir') sortDir?: 'asc' | 'desc',
        @Query('status') status?: string,
    ) {
        return this.kvkkService.getDataSubjectRequests({
            page: page ? parseInt(page, 10) : undefined,
            pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
            sortBy,
            sortDir,
            status,
        });
    }

    @Get('data-subject-requests/stats')
    @RequirePermissions({ module: 'AUDIT', action: 'VIEW' })
    async getDataSubjectRequestStats() {
        return this.kvkkService.getDataSubjectRequestStats();
    }

    @Post('data-subject-requests')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async createDataSubjectRequest(@Body() body: any, @Request() req: any) {
        return this.kvkkService.createDataSubjectRequest(body, req.user);
    }

    @Patch('data-subject-requests/:id')
    @RequirePermissions({ module: 'AUDIT', action: 'EDIT' })
    async updateDataSubjectRequest(@Param('id') id: string, @Body() body: any, @Request() req: any) {
        return this.kvkkService.updateDataSubjectRequest(id, body, req.user);
    }
}
