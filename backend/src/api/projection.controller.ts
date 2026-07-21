import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('projections')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProjectionController {
    constructor(private prisma: PrismaService) { }

    /**
     * GET /projections/kpi?kod=NPL
     * KPI için 6/12 aylık projeksiyon verileri
     */
    @Get('kpi')
    async getKpiProjections(@Query('kod') kpiCode: string) {
        // Son 12 aylık veriyi al
        const onikiAyOnce = new Date();
        onikiAyOnce.setMonth(onikiAyOnce.getMonth() - 12);

        const ozetler = await this.prisma.gunlukRiskOzet.findMany({
            where: {
                kpi_kodu: kpiCode,
                senaryo_kodu: 'BAZ',
                tarih: { gte: onikiAyOnce },
            },
            orderBy: { tarih: 'asc' },
        });

        // Aylık gruplama
        const aylikData = this.groupByMonth(ozetler);

        return {
            kpi_kodu: kpiCode,
            son_6_ay: aylikData.slice(-6),
            son_12_ay: aylikData,
        };
    }

    private groupByMonth(data: any[]) {
        const grouped = new Map();

        data.forEach((item) => {
            const ayKey = `${item.tarih.getFullYear()}-${String(item.tarih.getMonth() + 1).padStart(2, '0')}`;

            if (!grouped.has(ayKey)) {
                grouped.set(ayKey, {
                    ay: ayKey,
                    ortalama_deger: 0,
                    count: 0,
                });
            }

            const current = grouped.get(ayKey);
            current.ortalama_deger += Number(item.deger);
            current.count += 1;
        });

        // Ortalamaları hesapla
        const result = Array.from(grouped.values()).map((item) => ({
            ay: item.ay,
            deger: item.ortalama_deger / item.count,
        }));

        return result;
    }
}
