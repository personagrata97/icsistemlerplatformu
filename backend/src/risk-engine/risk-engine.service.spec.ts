import { Test, TestingModule } from '@nestjs/testing';
import { RiskEngineService } from './risk-engine.service';
import { PrismaService } from '../common/prisma.service';
import { NplCalculator } from './npl.calculator';
import { LiquidityCalculator } from './liquidity.calculator';
import { DeliveryPressureCalculator } from './delivery-pressure.calculator';
import { ConcentrationCalculator } from './concentration.calculator';
import { DpdCalculator } from './dpd.calculator';
import { DeliveryLiabilityCalculator } from './delivery-liability.calculator';
import { CancellationCalculator } from './cancellation.calculator';

import { FinancingLimitCalculator } from './financing-limit.calculator';
import { EquityRatioCalculator } from './equity-ratio.calculator';

describe('RiskEngineService', () => {
  let service: RiskEngineService;

  const createMockCalculator = () => ({
    calculate: jest.fn().mockResolvedValue({ code: 'TEST', value: 10 }),
    calculateByRegion: jest.fn().mockResolvedValue({ code: 'REGION', value: 20 }),
    calculateByMaturity: jest.fn().mockResolvedValue({ code: 'MATURITY', value: 30 }),
    calculateByCustomerType: jest.fn().mockResolvedValue({ code: 'CUST', value: 40 }),
    calculateByRiskGroup: jest.fn().mockResolvedValue({ code: 'RISK_GRP', value: 50 }),
  });

  const mockNpl = createMockCalculator();
  const mockLiq = createMockCalculator();
  const mockDeliveryP = createMockCalculator();
  const mockConc = createMockCalculator();
  const mockDpd = createMockCalculator();
  const mockDeliveryL = createMockCalculator();
  const mockCanc = createMockCalculator();
  const mockFin = createMockCalculator();
  const mockEq = createMockCalculator();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskEngineService,
        { provide: PrismaService, useValue: {} },
        { provide: NplCalculator, useValue: mockNpl },
        { provide: LiquidityCalculator, useValue: mockLiq },
        { provide: DeliveryPressureCalculator, useValue: mockDeliveryP },
        { provide: ConcentrationCalculator, useValue: mockConc },
        { provide: DpdCalculator, useValue: mockDpd },
        { provide: DeliveryLiabilityCalculator, useValue: mockDeliveryL },
        { provide: CancellationCalculator, useValue: mockCanc },
        { provide: FinancingLimitCalculator, useValue: mockFin },
        { provide: EquityRatioCalculator, useValue: mockEq },
      ],
    }).compile();

    service = module.get<RiskEngineService>(RiskEngineService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateAllKpis', () => {
    it('should call all calculators and return array of results', async () => {
      const results = await service.calculateAllKpis();
      
      expect(results).toHaveLength(12);
      expect(mockNpl.calculate).toHaveBeenCalled();
      expect(mockConc.calculateByRegion).toHaveBeenCalled();
      expect(mockConc.calculateByMaturity).toHaveBeenCalled();
    });

    it('should throw error if a calculator fails', async () => {
        mockNpl.calculate.mockRejectedValueOnce(new Error('Calc error'));
        await expect(service.calculateAllKpis()).rejects.toThrow('Calc error');
    });
  });

  describe('calculateSingleKpi', () => {
    it('should call specific calculator for NPL', async () => {
        await service.calculateSingleKpi('NPL');
        expect(mockNpl.calculate).toHaveBeenCalled();
    });

    it('should call specific calculator for LCR', async () => {
        await service.calculateSingleKpi('LCR');
        expect(mockLiq.calculate).toHaveBeenCalled();
    });

    it('should return null for unknown KPI', async () => {
        const result = await service.calculateSingleKpi('UNKNOWN');
        expect(result).toBeNull();
    });
  });
});
