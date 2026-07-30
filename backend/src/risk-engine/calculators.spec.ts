import { FinancingLimitCalculator } from './financing-limit.calculator';
import { EquityRatioCalculator } from './equity-ratio.calculator';
import { FinancialLiabilityCalculator } from './financial-liability.calculator';
import { LiquidityCalculator } from './liquidity.calculator';
import { NplCalculator } from './npl.calculator';
import { CancellationCalculator } from './cancellation.calculator';
import { TenorLimitCalculator } from './tenor-limit.calculator';
import { LotteryGroupCalculator } from './lottery-group.calculator';
import { DeliveryPressureCalculator } from './delivery-pressure.calculator';
import { DeliveryLiabilityCalculator } from './delivery-liability.calculator';
import { ConcentrationCalculator } from './concentration.calculator';

describe('Risk Engine Calculators - Mevzuat Sınır & Eşik Testleri (Boundary Scenarios)', () => {
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {
            sozlesme: {
                findMany: jest.fn(),
                count: jest.fn(),
            },
            likiditePozisyonu: {
                findFirst: jest.fn(),
            },
            riskLimit: {
                findMany: jest.fn(),
            },
        };
        jest.clearAllMocks();
    });

    // ─── 1. TOPLAM FİNANSMAN LİMİTİ (%200 SINIRI & %170 ERKEN UYARI) ───────────
    describe('FinancingLimitCalculator (Yasal Limit %200, Erken Uyarı %170)', () => {
        it('Sınırın altı (%169): GREEN dönmelidir', async () => {
            // Taban Tutar (Fon Havuzu 100M + Özkaynak 0) = 100M
            // Sağlanan Finansman = 169M -> Kullanım Oranı %169
            mockPrisma.sozlesme.findMany.mockImplementation(({ where }: any) => {
                if (where?.teslim_tarihi_gerceklesen) {
                    return Promise.resolve([{ toplam_tutar: '169000000' }]);
                }
                if (where?.durum === 'AKTIF') {
                    return Promise.resolve([{ toplam_tutar: '100000000' }]);
                }
                return Promise.resolve([]);
            });
            mockPrisma.likiditePozisyonu.findFirst.mockResolvedValue(null);

            const calc = new FinancingLimitCalculator(mockPrisma);
            const result = await calc.calculate();

            expect(result.deger).toBe(169);
            expect(result.risk_seviyesi).toBe('GREEN');
        });

        it('Erken uyarı eşiği üstü (%171): YELLOW dönmelidir', async () => {
            mockPrisma.sozlesme.findMany.mockImplementation(({ where }: any) => {
                if (where?.teslim_tarihi_gerceklesen) {
                    return Promise.resolve([{ toplam_tutar: '171000000' }]);
                }
                if (where?.durum === 'AKTIF') {
                    return Promise.resolve([{ toplam_tutar: '100000000' }]);
                }
                return Promise.resolve([]);
            });
            mockPrisma.likiditePozisyonu.findFirst.mockResolvedValue(null);

            const calc = new FinancingLimitCalculator(mockPrisma);
            const result = await calc.calculate();

            expect(result.deger).toBe(171);
            expect(result.risk_seviyesi).toBe('YELLOW');
        });

        it('Yasal limit hemen altı (%199): YELLOW dönmelidir', async () => {
            mockPrisma.sozlesme.findMany.mockImplementation(({ where }: any) => {
                if (where?.teslim_tarihi_gerceklesen) {
                    return Promise.resolve([{ toplam_tutar: '199000000' }]);
                }
                if (where?.durum === 'AKTIF') {
                    return Promise.resolve([{ toplam_tutar: '100000000' }]);
                }
                return Promise.resolve([]);
            });

            const calc = new FinancingLimitCalculator(mockPrisma);
            const result = await calc.calculate();

            expect(result.deger).toBe(199);
            expect(result.risk_seviyesi).toBe('YELLOW');
        });

        it('Yasal limit hemen üstü (%201): RED (YASAL İHLAL) dönmelidir', async () => {
            mockPrisma.sozlesme.findMany.mockImplementation(({ where }: any) => {
                if (where?.teslim_tarihi_gerceklesen) {
                    return Promise.resolve([{ toplam_tutar: '201000000' }]);
                }
                if (where?.durum === 'AKTIF') {
                    return Promise.resolve([{ toplam_tutar: '100000000' }]);
                }
                return Promise.resolve([]);
            });

            const calc = new FinancingLimitCalculator(mockPrisma);
            const result = await calc.calculate();

            expect(result.deger).toBeCloseTo(201, 0);
            expect(result.risk_seviyesi).toBe('RED');
            expect(result.detay.bddk_mesaji).toContain('YASAL İHLAL');
        });
    });

    // ─── 2. ÖZKAYNAK YETERLİLİK ORANI (ASGARİ %3 SINIRI & %5 ERKEN UYARI) ──────
    describe('EquityRatioCalculator (Asgari Sınır %3, Erken Uyarı %5)', () => {
        it('Yasal sınır altı (%2.9): RED (YASAL İHLAL) dönmelidir', async () => {
            // Toplam Sözleşme = 100M, Özkaynak = 2.9M -> Oran %2.9
            mockPrisma.sozlesme.findMany.mockResolvedValue([
                { toplam_tutar: '100000000' }
            ]);
            mockPrisma.likiditePozisyonu.findFirst.mockResolvedValue({
                nakit: '2900000',
                likit_varlik: '0',
            });

            const calc = new EquityRatioCalculator(mockPrisma);
            const result = await calc.calculate();

            expect(result.deger).toBeCloseTo(2.9, 1);
            expect(result.risk_seviyesi).toBe('RED');
            expect(result.detay.bddk_mesaji).toContain('YASAL İHLAL');
        });

        it('Yasal sınır üstü ancak erken uyarı altı (%3.1): YELLOW dönmelidir', async () => {
            mockPrisma.sozlesme.findMany.mockResolvedValue([
                { toplam_tutar: '100000000' }
            ]);
            mockPrisma.likiditePozisyonu.findFirst.mockResolvedValue({
                nakit: '3100000',
                likit_varlik: '0',
            });

            const calc = new EquityRatioCalculator(mockPrisma);
            const result = await calc.calculate();

            expect(result.deger).toBeCloseTo(3.1, 1);
            expect(result.risk_seviyesi).toBe('YELLOW');
        });

        it('Erken uyarı seviyesi üstü (%5.1): GREEN dönmelidir', async () => {
            mockPrisma.sozlesme.findMany.mockResolvedValue([
                { toplam_tutar: '100000000' }
            ]);
            mockPrisma.likiditePozisyonu.findFirst.mockResolvedValue({
                nakit: '5100000',
                likit_varlik: '0',
            });

            const calc = new EquityRatioCalculator(mockPrisma);
            const result = await calc.calculate();

            expect(result.deger).toBeCloseTo(5.1, 1);
            expect(result.risk_seviyesi).toBe('GREEN');
        });
    });

    // ─── 3. DIŞ MALİ YÜKÜMLÜLÜK ORANI (%30 ÜST SINIRI & %25 ERKEN UYARI) ──────
    describe('FinancialLiabilityCalculator (%30 Üst Sınır)', () => {
        it('Sınırın altı (%24.9): GREEN dönmelidir', async () => {
            // Özkaynak = 100M. Dış borçlama = toplamFinansman * 0.15.
            // Portföy = 166M -> Dış Borç = 24.9M -> Borç/Özkaynak = %24.9
            mockPrisma.sozlesme.findMany.mockResolvedValue([
                { toplam_tutar: '166000000', durum: 'AKTIF' }
            ]);

            const calc = new FinancialLiabilityCalculator(mockPrisma);
            const result = await calc.calculate();

            expect(result.deger).toBeLessThan(25);
            expect(result.risk_seviyesi).toBe('GREEN');
        });

        it('Erken uyarı bölgesi (%29.9): YELLOW dönmelidir', async () => {
            mockPrisma.sozlesme.findMany.mockResolvedValue([
                { toplam_tutar: '199000000', durum: 'AKTIF' }
            ]);

            const calc = new FinancialLiabilityCalculator(mockPrisma);
            const result = await calc.calculate();

            expect(result.deger).toBeGreaterThan(25);
            expect(result.deger).toBeLessThanOrEqual(30);
            expect(result.risk_seviyesi).toBe('YELLOW');
        });

        it('Yasal limit üstü (%30.1): RED (YASAL İHLAL) dönmelidir', async () => {
            mockPrisma.sozlesme.findMany.mockResolvedValue([
                { toplam_tutar: '201000000', durum: 'AKTIF' }
            ]);

            const calc = new FinancialLiabilityCalculator(mockPrisma);
            const result = await calc.calculate();

            expect(result.deger).toBeGreaterThan(30);
            expect(result.risk_seviyesi).toBe('RED');
            expect(result.detay.bddk_mesaji).toContain('YASAL İHLAL');
        });
    });

    // ─── 4. LYO - LİKİDİTE YETERLİLİK ORANI (%100 ASGARİ, %120 BİLDİRİM, %200 UYARI) ───
    describe('LiquidityCalculator (LYO Eşikleri: %100, %120, %200)', () => {
        let mockDeliveryCalc: any;

        beforeEach(() => {
            mockDeliveryCalc = {
                calculateTotalLiability: jest.fn().mockResolvedValue(1000000), // 1M Teslimat Çıkışı
            };
        });

        it('Asgari sınır altı (%99 LYO): RED (KRİTİK İHLAL) dönmelidir', async () => {
            // Toplam çıkış = 1M + 0 = 1M. Nakit = 990,000 -> LYO %99
            mockPrisma.likiditePozisyonu.findFirst.mockResolvedValue({
                nakit: '990000',
                likit_varlik: '0',
                kisa_vadeli_yukumluluk: '0',
            });

            const calc = new LiquidityCalculator(mockPrisma, mockDeliveryCalc);
            const result = await calc.calculate();

            expect(result.deger).toBe(99);
            expect(result.risk_seviyesi).toBe('RED');
            expect(result.detay.bddk_mesaji).toContain('KRİTİK İHLAL');
        });

        it('BDDK Bildirim eşiği altında (%101 LYO): YELLOW dönmelidir', async () => {
            mockPrisma.likiditePozisyonu.findFirst.mockResolvedValue({
                nakit: '1010000',
                likit_varlik: '0',
                kisa_vadeli_yukumluluk: '0',
            });

            const calc = new LiquidityCalculator(mockPrisma, mockDeliveryCalc);
            const result = await calc.calculate();

            expect(result.deger).toBe(101);
            expect(result.risk_seviyesi).toBe('YELLOW');
            expect(result.detay.bddk_mesaji).toContain('BDDK BİLDİRİM EŞİĞİ');
        });

        it('Sağlıklı LYO seviyesi (%201 LYO): GREEN dönmelidir', async () => {
            mockPrisma.likiditePozisyonu.findFirst.mockResolvedValue({
                nakit: '2010000',
                likit_varlik: '0',
                kisa_vadeli_yukumluluk: '0',
            });

            const calc = new LiquidityCalculator(mockPrisma, mockDeliveryCalc);
            const result = await calc.calculate();

            expect(result.deger).toBeCloseTo(201, 0);
            expect(result.risk_seviyesi).toBe('GREEN');
        });
    });

    // ─── 5. NPL ORANI (%3 ERKEN UYARI, %5 KRİTİK İHLAL) ──────────────────────
    describe('NplCalculator (NPL Eşikleri: %3 ve %5)', () => {
        it('Eşiğin altı (%2.9): GREEN dönmelidir', async () => {
            // 1 sözleşme 91 gün gecikmede (2.9M), 99 sözleşme gününde (97.1M)
            mockPrisma.sozlesme.findMany.mockResolvedValue([
                { toplam_tutar: '2900000', odeme_hareketleri: [{ gecikme_gun: 91 }] },
                { toplam_tutar: '97100000', odeme_hareketleri: [{ gecikme_gun: 0 }] }
            ]);

            const calc = new NplCalculator(mockPrisma);
            const result = await calc.calculate();

            expect(result.deger).toBeCloseTo(2.9, 1);
            expect(result.risk_seviyesi).toBe('GREEN');
        });

        it('Erken uyarı bölgesi (%3.1 - %5.0): YELLOW dönmelidir', async () => {
            mockPrisma.sozlesme.findMany.mockResolvedValue([
                { toplam_tutar: '4000000', odeme_hareketleri: [{ gecikme_gun: 95 }] },
                { toplam_tutar: '96000000', odeme_hareketleri: [{ gecikme_gun: 10 }] }
            ]);

            const calc = new NplCalculator(mockPrisma);
            const result = await calc.calculate();

            expect(result.deger).toBe(4);
            expect(result.risk_seviyesi).toBe('YELLOW');
        });

        it('Kritik NPL eşiği üstü (%5.1): RED dönmelidir', async () => {
            mockPrisma.sozlesme.findMany.mockResolvedValue([
                { toplam_tutar: '5100000', odeme_hareketleri: [{ gecikme_gun: 120 }] },
                { toplam_tutar: '94900000', odeme_hareketleri: [{ gecikme_gun: 0 }] }
            ]);

            const calc = new NplCalculator(mockPrisma);
            const result = await calc.calculate();

            expect(result.deger).toBeCloseTo(5.1, 1);
            expect(result.risk_seviyesi).toBe('RED');
        });
    });

    // ─── 6. İPTAL ORANI (%3 ERKEN UYARI, %5 KRİTİK EŞİK) ──────────────────────
    describe('CancellationCalculator (İptal Eşikleri: %3 ve %5)', () => {
        it('Aylık İptal Oranı %2.9: GREEN dönmelidir', async () => {
            mockPrisma.sozlesme.findMany.mockResolvedValue(
                Array.from({ length: 29 }, (_, i) => ({
                    toplam_tutar: '100000',
                    baslangic_tarihi: new Date('2026-01-01'),
                    iptal_tarihi: new Date('2026-07-10'),
                }))
            );
            mockPrisma.sozlesme.count.mockResolvedValue(971); // Toplam ay başı = 1000

            const calc = new CancellationCalculator(mockPrisma);
            const result = await calc.calculate();

            expect(result.deger).toBeCloseTo(2.9, 1);
            expect(result.risk_seviyesi).toBe('GREEN');
        });

        it('Aylık İptal Oranı %5.1: RED dönmelidir', async () => {
            mockPrisma.sozlesme.findMany.mockResolvedValue(
                Array.from({ length: 51 }, (_, i) => ({
                    toplam_tutar: '100000',
                    baslangic_tarihi: new Date('2026-01-01'),
                    iptal_tarihi: new Date('2026-07-10'),
                }))
            );
            mockPrisma.sozlesme.count.mockResolvedValue(949); // Toplam ay başı = 1000

            const calc = new CancellationCalculator(mockPrisma);
            const result = await calc.calculate();

            expect(result.deger).toBeCloseTo(5.1, 1);
            expect(result.risk_seviyesi).toBe('RED');
        });
    });

    // ─── 7. MEVZUAT VADE SINIRI (KONUT 120 AY, TAŞIT 60 AY) ───────────────────
    describe('TenorLimitCalculator (Vade Sınırları)', () => {
        it('Vade sınırlarına uygun sözleşmeler (Taşıt 60m, Konut 120m): GREEN dönmelidir', async () => {
            mockPrisma.sozlesme.findMany.mockResolvedValue([
                { id: '1', tur: 'TASIT', vade: 60, durum: 'AKTIF' },
                { id: '2', tur: 'KONUT', vade: 120, durum: 'AKTIF' }
            ]);

            const calc = new TenorLimitCalculator(mockPrisma);
            const result = await calc.calculate();

            expect(result.deger).toBe(0);
            expect(result.risk_seviyesi).toBe('GREEN');
            expect(result.detay.konut_ihlal_sayisi).toBe(0);
            expect(result.detay.tasit_ihlal_sayisi).toBe(0);
        });

        it('Taşıt vadesi 61 ay olduğunda mevzuat ihlali tespit etmelidir: RED', async () => {
            mockPrisma.sozlesme.findMany.mockResolvedValue([
                { id: '1', tur: 'TASIT', vade: 61, durum: 'AKTIF' },
                { id: '2', tur: 'KONUT', vade: 120, durum: 'AKTIF' }
            ]);

            const calc = new TenorLimitCalculator(mockPrisma);
            const result = await calc.calculate();

            expect(result.deger).toBe(1);
            expect(result.risk_seviyesi).toBe('RED');
            expect(result.detay.tasit_ihlal_sayisi).toBe(1);
        });

        it('Konut vadesi 121 ay olduğunda mevzuat ihlali tespit etmelidir: RED', async () => {
            mockPrisma.sozlesme.findMany.mockResolvedValue([
                { id: '1', tur: 'KONUT', vade: 121, durum: 'AKTIF' }
            ]);

            const calc = new TenorLimitCalculator(mockPrisma);
            const result = await calc.calculate();

            expect(result.deger).toBe(1);
            expect(result.risk_seviyesi).toBe('RED');
            expect(result.detay.konut_ihlal_sayisi).toBe(1);
        });
    });

    // ─── 8. ÇEKİLİŞLİ GRUP ASGARİ DOLULUK ORANI (%40 EŞİĞİ) ─────────────────
    describe('LotteryGroupCalculator (%40 Asgari Doluluk)', () => {
        it('Doluluk %40 ve üzeri ise GREEN dönmelidir', async () => {
            mockPrisma.sozlesme.findMany.mockResolvedValue([
                { id: '1', tur: 'ÇEKİLİŞLİ KONUT', durum: 'AKTIF' }
            ]);

            const calc = new LotteryGroupCalculator(mockPrisma);
            const result = await calc.calculate();

            expect(result.risk_seviyesi).toBe('GREEN');
            expect(result.detay.asgari_yasal_esik_yuzde).toBe(40);
        });
    });
});
