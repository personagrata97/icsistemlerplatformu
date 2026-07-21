import { FinancialLiabilityCalculator } from './financial-liability.calculator';
import { TenorLimitCalculator } from './tenor-limit.calculator';
import { LotteryGroupCalculator } from './lottery-group.calculator';
import { ConcentrationCalculator } from './concentration.calculator';

describe('Regulatory Risk Calculators', () => {
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {
            sozlesme: {
                findMany: jest.fn(),
            },
        };
    });

    describe('FinancialLiabilityCalculator (%30 Bank Liability Limit)', () => {
        it('should calculate liability ratio and return GREEN when below 25%', async () => {
            mockPrisma.sozlesme.findMany.mockResolvedValue([
                { id: '1', toplam_tutar: '50000000', durum: 'AKTIF' }
            ]);

            const calculator = new FinancialLiabilityCalculator(mockPrisma);
            const result = await calculator.calculate();

            expect(result.kpi_kodu).toBe('MALI_YUKUMLULUK_OZKAYNAK');
            expect(result.risk_seviyesi).toBe('GREEN');
            expect(result.detay.yasal_limit_orani).toBe(30);
        });
    });

    describe('TenorLimitCalculator (Housing 120m, Vehicle 60m)', () => {
        it('should detect violation when vehicle contract exceeds 60 months', async () => {
            mockPrisma.sozlesme.findMany.mockResolvedValue([
                { id: '1', tur: 'TASIT', vade: 72, durum: 'AKTIF' },
                { id: '2', tur: 'KONUT', vade: 120, durum: 'AKTIF' }
            ]);

            const calculator = new TenorLimitCalculator(mockPrisma);
            const result = await calculator.calculate();

            expect(result.kpi_kodu).toBe('VADE_SINIRI_MEVZUAT_UYUM');
            expect(result.deger).toBe(1);
            expect(result.risk_seviyesi).toBe('RED');
            expect(result.detay.tasit_ihlal_sayisi).toBe(1);
        });
    });

    describe('LotteryGroupCalculator (%40 Group Occupancy)', () => {
        it('should return GREEN when occupancy is at or above 40%', async () => {
            mockPrisma.sozlesme.findMany.mockResolvedValue([
                { id: '1', tur: 'ÇEKİLİŞLİ KONUT', durum: 'AKTIF' }
            ]);

            const calculator = new LotteryGroupCalculator(mockPrisma);
            const result = await calculator.calculate();

            expect(result.kpi_kodu).toBe('CEKILISLI_GRUP_DOLULUK_ORANI');
            expect(result.risk_seviyesi).toBe('GREEN');
            expect(result.detay.asgari_yasal_esik_yuzde).toBe(40);
        });
    });

    describe('ConcentrationCalculator (Single Customer Limit %150)', () => {
        it('should calculate single customer concentration correctly', async () => {
            mockPrisma.sozlesme.findMany.mockResolvedValue([
                { id: '1', musteri_id: 'cust-1', toplam_tutar: '1000000', durum: 'AKTIF', musteri: { musteri_id: 'cust-1', ad_soyad: 'Ahmet Yılmaz' } },
                { id: '2', musteri_id: 'cust-2', toplam_tutar: '2000000', durum: 'AKTIF', musteri: { musteri_id: 'cust-2', ad_soyad: 'Mehmet Demir' } }
            ]);

            const calculator = new ConcentrationCalculator(mockPrisma);
            const result = await calculator.calculateSingleCustomerLimit();

            expect(result.kpi_kodu).toBe('KONSANTRASYON_TEKIL_MUSTERI');
            expect(result.detay.en_yuksek_musteri).toBe('Mehmet Demir');
            expect(result.detay.en_yuksek_tutar).toBe(2000000);
        });
    });
});
