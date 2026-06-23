import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

/**
 * BDDK BVTS (Bankacılık Veri Transfer Sistemi) Formatında Rapor Üretici
 */
@Injectable()
export class BddkExportService {
    constructor(private prisma: PrismaService) { }

    /**
     * Haftalık LYO (Likidite Yeterlilik Oranı) BVTS Cetveli
     */
    async generateWeeklyLiquidityReport() {
        const bugun = new Date();
        const birHaftaOnce = new Date();
        birHaftaOnce.setDate(bugun.getDate() - 7);

        const ozetler = await this.prisma.gunlukRiskOzet.findMany({
            where: {
                kpi_kodu: 'LCR',
                senaryo_kodu: 'BAZ',
                tarih: {
                    gte: birHaftaOnce,
                    lte: bugun
                }
            },
            orderBy: { tarih: 'asc' }
        });

        // BVTS formatı genellikle XML veya standardize edilmiş CSV'dir. 
        // Burada MVP olarak JSON formatında yapılandırıyoruz, frontend CSV'ye çevirebilir.
        
        let toplamDeger = 0;
        const detaySatirlari = ozetler.map(o => {
            toplamDeger += Number(o.deger);
            return {
                rapor_tarihi: o.tarih.toISOString().split('T')[0],
                kpi: 'LYO',
                deger: Number(o.deger).toFixed(2),
                durum: o.risk_seviyesi
            };
        });

        const haftalikOrtalama = ozetler.length > 0 ? (toplamDeger / ozetler.length) : 0;

        return {
            kurum_kodu: 'TS-001',
            rapor_kodu: 'BDDK_HFT_LYO_01',
            rapor_donemi: `${birHaftaOnce.toISOString().split('T')[0]} / ${bugun.toISOString().split('T')[0]}`,
            haftalik_ortalama_lyo: haftalikOrtalama.toFixed(2),
            yasal_sinir: '100.00',
            uyum_durumu: haftalikOrtalama >= 100 ? 'UYUMLU' : 'İHLAL',
            gunluk_detaylar: detaySatirlari
        };
    }

    /**
     * Aylık NPL Raporu BVTS Cetveli
     */
    async generateMonthlyNplReport() {
        // En güncel BAZ senaryo NPL özetini al
        const sonOzet = await this.prisma.gunlukRiskOzet.findFirst({
            where: { kpi_kodu: 'NPL', senaryo_kodu: 'BAZ' },
            orderBy: { tarih: 'desc' }
        });

        return {
            kurum_kodu: 'TS-001',
            rapor_kodu: 'BDDK_AYL_NPL_02',
            donem: new Date().toISOString().substring(0, 7), // YYYY-MM
            npl_orani: sonOzet ? Number(sonOzet.deger).toFixed(2) : '0.00',
            yasal_sinir: '5.00', // Sektörel takip sınırı
            durum: (sonOzet && Number(sonOzet.deger) > 5) ? 'İHLAL' : 'UYUMLU'
        };
    }
}
