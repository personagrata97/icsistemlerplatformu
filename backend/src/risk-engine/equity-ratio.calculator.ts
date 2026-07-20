import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RiskCalculationResult } from './risk-engine.types';

/**
 * Özkaynak Yeterlilik Oranı Hesaplama Modülü
 * 
 * Mevzuat Dayanağı: Tasarruf Finansman Şirketlerinin Kuruluş ve Faaliyet
 * Esasları Hakkında Yönetmelik
 * 
 * Kural: Bir önceki çeyrek dönem itibarıyla hesaplanan özkaynağın,
 * toplam sözleşme tutarına oranı asgari %3 olmalıdır.
 * 
 * Hesaplama:
 *   Özkaynak Yeterlilik Oranı = Özkaynak / Toplam Sözleşme Tutarı * 100
 *   Asgari Sınır: %3
 */
@Injectable()
export class EquityRatioCalculator {
    constructor(private prisma: PrismaService) { }

    async calculate(): Promise<RiskCalculationResult> {
        // 1. Toplam Sözleşme Tutarı (İptal edilmemiş tüm sözleşmeler)
        const tumSozlesmeler = await this.prisma.sozlesme.findMany({
            where: { durum: { not: 'IPTAL' } },
            select: { toplam_tutar: true },
        });

        const toplamSozlesmeTutari = tumSozlesmeler.reduce(
            (sum, s) => sum + Number(s.toplam_tutar), 0
        );

        // 2. Özkaynak = Son likidite pozisyonundaki nakit + likit varlıklar
        const pozisyon = await this.prisma.likiditePozisyonu.findFirst({
            orderBy: { tarih: 'desc' },
        });

        const ozkaynak = pozisyon
            ? Number(pozisyon.nakit) + Number(pozisyon.likit_varlik)
            : 0;

        // 3. Hesaplama
        const ozkaynakOrani = toplamSozlesmeTutari > 0
            ? (ozkaynak / toplamSozlesmeTutari) * 100
            : (ozkaynak > 0 ? 100 : 0);

        // 4. Risk Seviyesi — Asgari %3
        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        let mesaj = '✅ Özkaynak yeterlilik oranı mevzuat sınırları içinde.';

        if (ozkaynakOrani < 3) {
            riskSeviyesi = 'RED';
            mesaj = '🚨 YASAL İHLAL: Özkaynak oranı %3 asgari sınırının altında! Sermaye artırımı gereklidir.';
        } else if (ozkaynakOrani < 5) {
            riskSeviyesi = 'YELLOW';
            mesaj = '⚠️ ERKEN UYARI: Özkaynak oranı %5\'in altında. %3 yasal sınırına yaklaşılıyor.';
        }

        return {
            kpi_kodu: 'OZKAYNAK_YETERLILIK',
            deger: ozkaynakOrani,
            risk_seviyesi: riskSeviyesi,
            detay: {
                ozkaynak: ozkaynak,
                toplam_sozlesme_tutari: toplamSozlesmeTutari,
                asgari_sinir_yuzde: 3,
                bddk_mesaji: mesaj,
                mevzuat_dayanak: 'TFŞ Kuruluş ve Faaliyet Yönetmeliği — Özkaynak, toplam sözleşme tutarının asgari %3\'ü olmalıdır.'
            },
        };
    }
}
