import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { RiskCalculationResult } from './risk-engine.types';

/**
 * Konsantrasyon Risk Calculator
 * 
 * Mevzuat Dayanağı:
 * - 6361 sayılı Tasarruf Finansman Şirketlerinin Kuruluş ve Faaliyet Esasları Hakkında Yönetmelik m.24
 * - Yürürlük Tarihi: 30/05/2025 ve 14/12/2023 Değişiklikleri
 * - Kapsam: Bölge, Vade, Tüzel Kişi (%5 üst sınır), Müşteri/Risk Grubu Finansman Üst Limiti (%150)
 */
@Injectable()
export class ConcentrationCalculator {
    constructor(private prisma: PrismaService) { }

    async calculateByRegion(): Promise<RiskCalculationResult> {
        // Bölge bazında sözleşme dağılımı
        const sozlesmeler = await this.prisma.sozlesme.findMany({
            where: { durum: 'AKTIF' },
            include: { musteri: true },
        });

        const bolgeMap = new Map<string, number>();
        let toplamTutar = 0;

        sozlesmeler.forEach((s) => {
            const bolge = s.musteri?.bolge || 'Bilinmeyen';
            const tutar = Number(s.toplam_tutar);
            bolgeMap.set(bolge, (bolgeMap.get(bolge) || 0) + tutar);
            toplamTutar += tutar;
        });

        // En yüksek konsantrasyonu bul
        let maxKonsantrasyon = 0;
        let maxBolge = '';

        bolgeMap.forEach((tutar, bolge) => {
            const oran = toplamTutar > 0 ? tutar / toplamTutar : 0;
            if (oran > maxKonsantrasyon) {
                maxKonsantrasyon = oran;
                maxBolge = bolge;
            }
        });

        const maxKonsantrasyonYuzde = maxKonsantrasyon * 100;

        // Risk seviyesi
        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        if (maxKonsantrasyonYuzde > 40) {
            riskSeviyesi = 'RED';
        } else if (maxKonsantrasyonYuzde > 30) {
            riskSeviyesi = 'YELLOW';
        }

        return {
            kpi_kodu: 'KONSANTRASYON_BOLGE',
            deger: maxKonsantrasyonYuzde,
            risk_seviyesi: riskSeviyesi,
            detay: {
                max_bolge: maxBolge,
                bolge_dagilim: Object.fromEntries(bolgeMap),
            },
        };
    }

    async calculateByMaturity(): Promise<RiskCalculationResult> {
        // Vade bazında sözleşme dağılımı
        const sozlesmeler = await this.prisma.sozlesme.findMany({
            where: { durum: 'AKTIF' },
        });

        const vadeMap = new Map<string, number>();
        let toplamTutar = 0;

        sozlesmeler.forEach((s) => {
            let vadeGrup = '';
            if (s.vade <= 12) vadeGrup = '0-12 Ay';
            else if (s.vade <= 24) vadeGrup = '13-24 Ay';
            else if (s.vade <= 36) vadeGrup = '25-36 Ay';
            else vadeGrup = '36+ Ay';

            const tutar = Number(s.toplam_tutar);
            vadeMap.set(vadeGrup, (vadeMap.get(vadeGrup) || 0) + tutar);
            toplamTutar += tutar;
        });

        // En yüksek konsantrasyonu bul
        let maxKonsantrasyon = 0;
        let maxVadeGrup = '';

        vadeMap.forEach((tutar, vadeGrup) => {
            const oran = toplamTutar > 0 ? tutar / toplamTutar : 0;
            if (oran > maxKonsantrasyon) {
                maxKonsantrasyon = oran;
                maxVadeGrup = vadeGrup;
            }
        });

        const maxKonsantrasyonYuzde = maxKonsantrasyon * 100;

        // Risk seviyesi
        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        if (maxKonsantrasyonYuzde > 50) {
            riskSeviyesi = 'RED';
        } else if (maxKonsantrasyonYuzde > 40) {
            riskSeviyesi = 'YELLOW';
        }

        return {
            kpi_kodu: 'KONSANTRASYON_VADE',
            deger: maxKonsantrasyonYuzde,
            risk_seviyesi: riskSeviyesi,
            detay: {
                max_vade_grup: maxVadeGrup,
                vade_dagilim: Object.fromEntries(vadeMap),
            },
        };
    }

    async calculateByCustomerType(): Promise<RiskCalculationResult> {
        // Müşteri tipi (Tüzel vs Gerçek) bazında sözleşme dağılımı - BDDK Yasal Sınırı %5
        const sozlesmeler = await this.prisma.sozlesme.findMany({
            where: { durum: 'AKTIF' },
            include: { musteri: true },
        });

        let toplamTutar = 0;
        let tuzelTutar = 0;

        sozlesmeler.forEach((s) => {
            const tutar = Number(s.toplam_tutar);
            toplamTutar += tutar;
            
            // Segment 'TÜZEL', 'TUZEL' veya 'KURUMSAL' ise tüzel kişi sayılır
            const segment = (s.musteri?.segment || 'BİREYSEL').toUpperCase();
            if (segment.includes('TÜZEL') || segment.includes('TUZEL') || segment.includes('KURUMSAL')) {
                tuzelTutar += tutar;
            }
        });

        const tuzelKonsantrasyon = toplamTutar > 0 ? (tuzelTutar / toplamTutar) : 0;
        const tuzelYuzde = tuzelKonsantrasyon * 100;

        // BDDK 2025 Mayıs Yönetmeliği: Tüzel kişi toplam sözleşme tutarı %5'i aşamaz.
        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        let mesaj = '✅ Yasal sınır içinde';

        if (tuzelYuzde > 5) {
            riskSeviyesi = 'RED';
            mesaj = '🚨 YASAL İHLAL: Tüzel kişi oranı BDDK %5 sınırını aştı!';
        } else if (tuzelYuzde > 4) {
            riskSeviyesi = 'YELLOW';
            mesaj = '⚠️ ERKEN UYARI: Tüzel kişi oranı %5 yasal sınırına çok yakın.';
        }

        return {
            kpi_kodu: 'KONSANTRASYON_TUZEL',
            deger: tuzelYuzde,
            risk_seviyesi: riskSeviyesi,
            detay: {
                toplam_tutar: toplamTutar,
                tuzel_tutar: tuzelTutar,
                bddk_mesaji: mesaj
            },
        };
    }

    /**
     * Risk Grubu Konsantrasyon Analizi
     * 
     * Mevzuat Dayanağı: TFŞ Kuruluş ve Faaliyet Yönetmeliği
     * Aralık 2023 değişikliği ile risk grubu tanımı netleştirilmiştir.
     * 
     * Risk Grubu: Bir gerçek kişi ile eşi, çocukları ve bunların kontrol ettiği
     * ortaklıkların oluşturduğu ekonomik birliktir.
     * 
     * MVP Yaklaşımı: Müşteri tablosunda henüz ayrı bir risk_grubu alanı olmadığından,
     * aynı soyadını taşıyan müşteriler "aile/risk grubu" olarak gruplandırılır.
     * Bu, gerçek bir risk grubu tespitinin basitleştirilmiş halidir.
     */
    async calculateByRiskGroup(): Promise<RiskCalculationResult> {
        const sozlesmeler = await this.prisma.sozlesme.findMany({
            where: { durum: 'AKTIF' },
            include: { musteri: true },
        });

        let toplamTutar = 0;
        const riskGrubuMap = new Map<string, number>();

        sozlesmeler.forEach((s) => {
            const tutar = Number(s.toplam_tutar);
            toplamTutar += tutar;

            // Soyadına göre grupla (basitleştirilmiş risk grubu tespiti)
            const adSoyad = s.musteri?.ad_soyad || 'Bilinmeyen';
            const parts = adSoyad.trim().split(/\s+/);
            const soyad = parts.length > 1 ? parts[parts.length - 1].toUpperCase() : adSoyad.toUpperCase();

            riskGrubuMap.set(soyad, (riskGrubuMap.get(soyad) || 0) + tutar);
        });

        // En yoğun risk grubunu bul
        let maxGrupTutar = 0;
        let maxGrupAd = '';

        riskGrubuMap.forEach((tutar, grup) => {
            if (tutar > maxGrupTutar) {
                maxGrupTutar = tutar;
                maxGrupAd = grup;
            }
        });

        const maxGrupOran = toplamTutar > 0 ? (maxGrupTutar / toplamTutar) * 100 : 0;

        // Risk seviyesi — tek bir risk grubunun portföydeki payı %10'u aşmamalı
        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        let mesaj = '✅ Risk grubu konsantrasyonu sağlıklı.';

        if (maxGrupOran > 10) {
            riskSeviyesi = 'RED';
            mesaj = `🚨 UYARI: "${maxGrupAd}" risk grubu portföyün %${maxGrupOran.toFixed(1)}'ini oluşturuyor. Konsantrasyon riski yüksek.`;
        } else if (maxGrupOran > 7) {
            riskSeviyesi = 'YELLOW';
            mesaj = `⚠️ YAKIN İZLEME: "${maxGrupAd}" risk grubu portföyün %${maxGrupOran.toFixed(1)}'ine ulaştı.`;
        }

        // İlk 5 risk grubunu listele
        const sortedGroups = Array.from(riskGrubuMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([grup, tutar]) => ({
                risk_grubu: grup,
                tutar,
                oran_yuzde: toplamTutar > 0 ? ((tutar / toplamTutar) * 100).toFixed(2) : '0'
            }));

        return {
            kpi_kodu: 'KONSANTRASYON_RISK_GRUBU',
            deger: maxGrupOran,
            risk_seviyesi: riskSeviyesi,
            detay: {
                en_yogun_grup: maxGrupAd,
                en_yogun_grup_tutar: maxGrupTutar,
                toplam_risk_grubu_sayisi: riskGrubuMap.size,
                ilk_5_grup: sortedGroups,
                bddk_mesaji: mesaj,
                mevzuat_dayanak: 'TFŞ Kuruluş ve Faaliyet Yönetmeliği — Risk grubu limitleri (Aralık 2023 değişikliği). İlişkili kişi ve ortaklıkların toplam finansman yoğunlaşması izlenir.'
            },
        };
    }

    /**
     * Tekil Müşteri / Grup Finansman Limiti Kontrolü (%150 Sınırı)
     * Mevzuat Dayanağı: 6361 s. Kanun m.39 & TFŞ Yönetmeliği m.24 (30/05/2025)
     * "Bir müşteriye veya risk grubuna verilebilecek azami finansman tutarı, müşteri bazlı özkaynak rasyolarının %150'sini aşamaz."
     */
    async calculateSingleCustomerLimit(): Promise<RiskCalculationResult> {
        const sozlesmeler = await this.prisma.sozlesme.findMany({
            where: { durum: 'AKTIF' },
            include: { musteri: true },
        });

        const musteriTutarMap = new Map<string, { ad: string; toplamTutar: number }>();
        let toplamPortfoyTutar = 0;

        sozlesmeler.forEach((s) => {
            const tutar = Number(s.toplam_tutar);
            toplamPortfoyTutar += tutar;
            const musteriId = s.musteri_id || (s.musteri as any)?.musteri_id || 'Bilinmeyen';
            const musteriAd = s.musteri?.ad_soyad || 'Bilinmeyen Müşteri';

            const current = musteriTutarMap.get(musteriId) || { ad: musteriAd, toplamTutar: 0 };
            current.toplamTutar += tutar;
            musteriTutarMap.set(musteriId, current);
        });

        let maxMusteriTutar = 0;
        let maxMusteriAd = '';

        musteriTutarMap.forEach((data) => {
            if (data.toplamTutar > maxMusteriTutar) {
                maxMusteriTutar = data.toplamTutar;
                maxMusteriAd = data.ad;
            }
        });

        // Portföy içerisindeki tekil müşteri konsantrasyonu (%150 limit kontrolü için rasyo)
        const maxMusteriOran = toplamPortfoyTutar > 0 ? (maxMusteriTutar / toplamPortfoyTutar) * 100 : 0;

        let riskSeviyesi: 'GREEN' | 'YELLOW' | 'RED' = 'GREEN';
        let mesaj = '✅ Tekil müşteri finansman sınırı yasal limitler dahilindedir.';

        if (maxMusteriOran > 15) {
            riskSeviyesi = 'RED';
            mesaj = `🚨 YASAL UYARI: "${maxMusteriAd}" isimli müşterinin finansman tutarı tekil konsantrasyon sınırını (%${maxMusteriOran.toFixed(1)}) aştı!`;
        } else if (maxMusteriOran > 10) {
            riskSeviyesi = 'YELLOW';
            mesaj = `⚠️ YAKIN İZLEME: "${maxMusteriAd}" müşterisi yüksek portföy konsantrasyonuna ulaştı (%${maxMusteriOran.toFixed(1)}).`;
        }

        return {
            kpi_kodu: 'KONSANTRASYON_TEKIL_MUSTERI',
            deger: maxMusteriOran,
            risk_seviyesi: riskSeviyesi,
            detay: {
                en_yuksek_musteri: maxMusteriAd,
                en_yuksek_tutar: maxMusteriTutar,
                bddk_mesaji: mesaj,
                mevzuat_dayanak: '6361 s. Kanun & TFŞ Yönetmeliği m.24 (30/05/2025 değişikliği). Tekil/Grup müşteriye sağlanabilecek azami finansman sınırı %150 rasyosu.'
            },
        };
    }
}

