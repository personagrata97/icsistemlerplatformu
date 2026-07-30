import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { parsePaginationParams, buildPaginatedResponse } from '../common/pagination.util';

@Controller('contracts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContractController {
    constructor(private prisma: PrismaService) { }

    /**
     * GET /contracts?durum=TAKIPTE
     * Sözleşmeleri listele (drill-down için)
     */
    @Get()
    async getContracts(
        @Query('durum') durum?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortDir') sortDir?: 'asc' | 'desc',
    ) {
        const { page: p, pageSize: ps, skip, take } = parsePaginationParams({
            page: page ? parseInt(page) : undefined,
            pageSize: pageSize ? parseInt(pageSize) : undefined,
            sortBy,
            sortDir,
        });

        const where: any = {};
        if (durum) where.durum = durum;

        const total = await this.prisma.sozlesme.count({ where });
        const items = await this.prisma.sozlesme.findMany({
            where,
            include: {
                musteri: true,
                odeme_hareketleri: {
                    orderBy: { tarih: 'desc' },
                    take: 5,
                },
            },
            orderBy: sortBy ? { [sortBy]: sortDir || 'desc' } : { created_at: 'desc' },
            skip,
            take,
        });

        return buildPaginatedResponse(items, total, p, ps);
    }

    /**
     * GET /contracts/npl
     * NPL (Takipte) olan sözleşmeleri döndürür
     */
    @Get('npl')
    async getNplContracts() {
        return this.prisma.sozlesme.findMany({
            where: {
                odeme_hareketleri: {
                    some: {
                        gecikme_gun: {
                            gt: 90
                        }
                    }
                }
            },
            include: {
                musteri: true,
                odeme_hareketleri: {
                    orderBy: { tarih: 'desc' },
                    take: 3,
                },
            },
        });
    }
}

