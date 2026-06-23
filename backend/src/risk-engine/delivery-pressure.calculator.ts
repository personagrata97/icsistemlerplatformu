import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RiskCalculationResult, ScenarioParameters } from './risk-engine.types';

/**
 * Teslimat Baskısı (Delivery Pressure) Calculator
 * Hesaplama (BDDK/FKB Faz 3): Önümüzdeki 12 Ay Teslimat Taahhüdü / Mevcut Fon Havuzu Büyüklüğü
 */
@Injectable()
export class DeliveryPressureCalculator {
    constructor(private prisma: PrismaService) { }

    async calculate(params?: ScenarioParameters): Promise<RiskCalculationResult> {
        const bugun = new Date();
        const onIkiAySonra = new Date();
        onIkiAySonra.setMonth(bugun.getMonth() + 12);

        // 1. Önümüzdeki 12 Ay Teslimat Taahhüdü (12-Month Delivery Pipeline)
        const teslimatlar = await this.prisma.sozlesme.findMany({
            where: {
                teslim_tarihi_planlanan: {
                    gte: bugun,
                    lte: onIkiAySonra,
                },
                durum: 'AKTIF',
            },
        });

        let teslimatTaahhudu12Ay = teslimatlar.reduce(
            (sum, s) => sum + Number(s.toplam_tutar),
            0,
        );

        // Senaryo uygula (Teslimat öne çekilmesi veya maliyet artışı şoku)
        if (params && params.teslimat_artis > 0) {
            teslimatTaahhudu12Ay = teslimatTaahhudu12Ay * (1 + params.teslimat_artis);
        }

        // 2. Mevcut Fon Havuzu Büyüklüğü (Tüm Aktif Sözleşmelerin İçerideki Birikimi)
        // MVP yaklaşımı: Nakit pozisyonu (Nakit + Likit) + Gelecek 12 Ay Taksit Beklentisi
        const pozisyon = await this.prisma.likiditePozisyonu.findFirst({
            orderBy: { tarih: 'desc' },
        });

        let mevcutNakit = pozisyon ? Number(pozisyon.nakit) + Number(pozisyon.likit_varlik) : 0;

        // Tüm aktif sözleşmelerin aylık taksitlerinin 12 aylık toplam projeksiyonu (Basitleştirilmiş)
        const aktifSozlesmeler = await this.prisma.sozlesme.findMany({
            where: { durum: 'AKTIF' }
        });
        
        let gelecek12AyTaksitHacmi = aktifSozlesmeler.reduce(
            (sum, s) => sum + (Number(s.taksit_tutari) * 12),
            0
        );

        // İptal Senaryosu Nakit Girişini Düşürür
        if (params && params.iptal_artis > 0) {
            gelecek12AyTaksitHacmi = gelecek12AyTaksitHacmi * (1 - params.iptal_artis);
        }

        const fonHavuzuBuyuklugu = mevcutNakit + gelecek12AyTaksitHacmi;

        const teslimatBaskisi = fonHavuzuBuyuklugu > 0 ? (teslimatTaahhudu12Ay / fonHavuzuBuyuklugu) : 0;
        const teslimatBaskisiYuzde = teslimatBaskisi * 100;

        // Risk seviyesi (Sektör standardı: Teslimat baskısının %80'i aşması tehlikelidir)
        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        if (teslimatBaskisiYuzde > 80) {
            riskSeviyesi = 'RED';
        } else if (teslimatBaskisiYuzde > 60) {
            riskSeviyesi = 'YELLOW';
        }

        return {
            kpi_kodu: 'TESLIMAT_BASKI',
            deger: teslimatBaskisiYuzde, // Yüzde olarak gösteriyoruz
            risk_seviyesi: riskSeviyesi,
            detay: {
                teslimat_taahhudu_12ay: teslimatTaahhudu12Ay,
                fon_havuzu_buyuklugu: fonHavuzuBuyuklugu,
                mevcut_nakit_ve_likit: mevcutNakit,
                beklenen_taksit_girisi_12ay: gelecek12AyTaksitHacmi,
                teslim_bekleyen_sozlesme: teslimatlar.length,
            },
        };
    }
}
