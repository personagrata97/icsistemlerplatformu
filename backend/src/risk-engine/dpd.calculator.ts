import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RiskCalculationResult, ScenarioParameters } from './risk-engine.types';

/**
 * DPD (Days Past Due) ve Karşılık (Provision) Calculator
 * BDDK 5 Grup Alacak Sınıflandırması ve TFRS 9 Karşılıkları
 */
@Injectable()
export class DpdCalculator {
    constructor(private prisma: PrismaService) { }

    async calculate(params?: ScenarioParameters): Promise<RiskCalculationResult> {
        // Tüm aktif sözleşmeleri ve ödeme hareketlerini al
        const sozlesmeler = await this.prisma.sozlesme.findMany({
            where: { durum: { not: 'TAMAMLANDI' } },
            include: {
                odeme_hareketleri: {
                    select: { gecikme_gun: true },
                },
            },
        });

        // 5 Grup Sınıflandırması
        const groups = {
            grup1: { count: 0, tutar: 0, karsilikOran: 0.01, ad: '1. Grup (Standart)' },
            grup2: { count: 0, tutar: 0, karsilikOran: 0.02, ad: '2. Grup (Yakın İzleme)' },
            grup3: { count: 0, tutar: 0, karsilikOran: 0.20, ad: '3. Grup (Sınırlı Tahsil)' },
            grup4: { count: 0, tutar: 0, karsilikOran: 0.50, ad: '4. Grup (Şüpheli)' },
            grup5: { count: 0, tutar: 0, karsilikOran: 1.00, ad: '5. Grup (Zarar)' }
        };

        sozlesmeler.forEach((s) => {
            const maxGecikme = s.odeme_hareketleri.reduce(
                (max, h) => (h.gecikme_gun > max ? h.gecikme_gun : max),
                0,
            );
            const tutar = Number(s.toplam_tutar);

            if (maxGecikme > 365) {
                groups.grup5.count++; groups.grup5.tutar += tutar;
            } else if (maxGecikme > 180) {
                groups.grup4.count++; groups.grup4.tutar += tutar;
            } else if (maxGecikme > 90) {
                groups.grup3.count++; groups.grup3.tutar += tutar;
            } else if (maxGecikme > 30) {
                groups.grup2.count++; groups.grup2.tutar += tutar;
            } else {
                groups.grup1.count++; groups.grup1.tutar += tutar;
            }
        });

        // Senaryo uygulaması (Gecikme artış şoku - DPD geçişkenlik (Roll-rate) matrisi basitleştirilmiş hali)
        if (params && params.gecikme_artis !== 0) {
            const sokOran = params.gecikme_artis;
            // 1'den 2'ye geçiş
            const gecis1to2 = groups.grup1.tutar * sokOran;
            groups.grup1.tutar -= gecis1to2;
            groups.grup2.tutar += gecis1to2;
            
            // 2'den 3'e geçiş
            const gecis2to3 = groups.grup2.tutar * sokOran;
            groups.grup2.tutar -= gecis2to3;
            groups.grup3.tutar += gecis2to3;

            // 3'ten 4'e geçiş
            const gecis3to4 = groups.grup3.tutar * sokOran;
            groups.grup3.tutar -= gecis3to4;
            groups.grup4.tutar += gecis3to4;

            // 4'ten 5'e geçiş
            const gecis4to5 = groups.grup4.tutar * sokOran;
            groups.grup4.tutar -= gecis4to5;
            groups.grup5.tutar += gecis4to5;
        }

        // Karşılık (Provision) Hesaplamaları
        const genelKarsilik = (groups.grup1.tutar * groups.grup1.karsilikOran) + 
                              (groups.grup2.tutar * groups.grup2.karsilikOran);
        
        const ozelKarsilik = (groups.grup3.tutar * groups.grup3.karsilikOran) + 
                             (groups.grup4.tutar * groups.grup4.karsilikOran) + 
                             (groups.grup5.tutar * groups.grup5.karsilikOran);

        const toplamKarsilik = genelKarsilik + ozelKarsilik;
        
        const toplamSozlesmeCount = groups.grup1.count + groups.grup2.count + groups.grup3.count + groups.grup4.count + groups.grup5.count;
        const toplamSozlesmeTutar = groups.grup1.tutar + groups.grup2.tutar + groups.grup3.tutar + groups.grup4.tutar + groups.grup5.tutar;
        
        // 90+ gün (Grup 3,4,5) oranı - NPL
        const dpd90plusTutar = groups.grup3.tutar + groups.grup4.tutar + groups.grup5.tutar;
        const dpd90PlusOran = toplamSozlesmeTutar > 0 ? dpd90plusTutar / toplamSozlesmeTutar : 0;

        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        if (dpd90PlusOran > 0.05) {
            riskSeviyesi = 'RED';
        } else if (dpd90PlusOran > 0.03) {
            riskSeviyesi = 'YELLOW';
        }

        return {
            kpi_kodu: 'DPD_DAGILIM',
            deger: dpd90PlusOran * 100, // Toplam risk göstergesi olarak NPL hacim oranı
            risk_seviyesi: riskSeviyesi,
            detay: {
                toplam_tutar: toplamSozlesmeTutar,
                toplam_sozlesme: toplamSozlesmeCount,
                genel_karsilik: genelKarsilik,
                ozel_karsilik: ozelKarsilik,
                toplam_karsilik: toplamKarsilik,
                gruplar: groups
            },
        };
    }
}
