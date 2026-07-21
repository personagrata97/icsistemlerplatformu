import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('contracts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContractController {
    constructor(private prisma: PrismaService) { }

    /**
     * GET /contracts?durum=TAKIPTE
     * Sözleşmeleri listele (drill-down için)
     */
    @Get()
    async getContracts(@Query('durum') durum?: string) {
        const where: any = {};

        if (durum) where.durum = durum;

        const sozlesmeler = await this.prisma.sozlesme.findMany({
            where,
            include: {
                musteri: true,
                odeme_hareketleri: {
                    orderBy: { tarih: 'desc' },
                    take: 5,
                },
            },
            orderBy: { created_at: 'desc' },
            take: 100,
        });

        return sozlesmeler;
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

