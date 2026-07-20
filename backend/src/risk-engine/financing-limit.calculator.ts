import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RiskCalculationResult } from './risk-engine.types';

/**
 * Toplam Finansman Limiti Hesaplama Modülü
 * 
 * Mevzuat Dayanağı: Tasarruf Finansman Şirketlerinin Kuruluş ve Faaliyet
 * Esasları Hakkında Yönetmelik
 * 
 * Kural: Bir şirket tarafından sağlanabilecek toplam finansman tutarı,
 * tasarruf fon havuzu ile özkaynaklarının toplamının %200'ünü aşamaz.
 * 
 * Hesaplama:
 *   Kullanım Oranı = Toplam Sağlanan Finansman / (Fon Havuzu + Özkaynak) * 100
 *   Limit: %200
 */
@Injectable()
export class FinancingLimitCalculator {
    constructor(private prisma: PrismaService) { }

    async calculate(): Promise<RiskCalculationResult> {
        // 1. Toplam Sağlanan Finansman = Teslim edilmiş sözleşmelerin toplam tutarı
        const teslimatYapilmisSozlesmeler = await this.prisma.sozlesme.findMany({
            where: {
                teslim_tarihi_gerceklesen: { not: null },
                durum: { not: 'IPTAL' },
            },
            select: { toplam_tutar: true },
        });

        const toplamSaglananFinansman = teslimatYapilmisSozlesmeler.reduce(
            (sum, s) => sum + Number(s.toplam_tutar), 0
        );

        // 2. Fon Havuzu = Tüm aktif sözleşmelerin toplam birikim tutarı
        const aktifSozlesmeler = await this.prisma.sozlesme.findMany({
            where: { durum: 'AKTIF' },
            select: { toplam_tutar: true },
        });

        const fonHavuzu = aktifSozlesmeler.reduce(
            (sum, s) => sum + Number(s.toplam_tutar), 0
        );

        // 3. Özkaynak = Likidite pozisyonundaki nakit + likit varlıklar
        const pozisyon = await this.prisma.likiditePozisyonu.findFirst({
            orderBy: { tarih: 'desc' },
        });

        const ozkaynak = pozisyon
            ? Number(pozisyon.nakit) + Number(pozisyon.likit_varlik)
            : 0;

        // 4. Hesaplama
        const tabanTutar = fonHavuzu + ozkaynak;
        const yasalLimit = tabanTutar * 2.0; // %200 sınır
        const kullanimOrani = tabanTutar > 0
            ? (toplamSaglananFinansman / tabanTutar) * 100
            : 0;

        // 5. Risk Seviyesi
        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        let mesaj = '✅ Toplam finansman limiti mevzuat sınırları içinde.';

        if (kullanimOrani > 200) {
            riskSeviyesi = 'RED';
            mesaj = '🚨 YASAL İHLAL: Toplam finansman tutarı, fon havuzu + özkaynak toplamının %200\'ünü aştı!';
        } else if (kullanimOrani > 170) {
            riskSeviyesi = 'YELLOW';
            mesaj = '⚠️ ERKEN UYARI: Kullanım oranı %170\'i geçti. %200 yasal sınırına yaklaşılıyor.';
        }

        return {
            kpi_kodu: 'FINANSMAN_LIMITI',
            deger: kullanimOrani,
            risk_seviyesi: riskSeviyesi,
            detay: {
                toplam_saglanan_finansman: toplamSaglananFinansman,
                fon_havuzu: fonHavuzu,
                ozkaynak: ozkaynak,
                taban_tutar: tabanTutar,
                yasal_limit: yasalLimit,
                bddk_mesaji: mesaj,
                mevzuat_dayanak: 'TFŞ Kuruluş ve Faaliyet Yönetmeliği — Toplam finansman, fon havuzu + özkaynak toplamının %200\'ünü aşamaz.'
            },
        };
    }
}
