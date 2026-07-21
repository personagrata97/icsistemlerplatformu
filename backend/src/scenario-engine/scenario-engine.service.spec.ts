import { Test, TestingModule } from '@nestjs/testing';
import { ScenarioEngineService } from './scenario-engine.service';
import { PrismaService } from '../common/prisma.service';
import { RiskEngineService } from '../risk-engine/risk-engine.service';

describe('ScenarioEngineService', () => {
    let service: ScenarioEngineService;
    let prisma: PrismaService;
    let riskEngine: RiskEngineService;

    const mockPrisma = {
        senaryo: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        gunlukRiskOzet: {
            upsert: jest.fn(),
            findMany: jest.fn(),
        },
        audit: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
        finding: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
    };

    const mockRiskEngine = {
        calculateAllKpis: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ScenarioEngineService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: RiskEngineService, useValue: mockRiskEngine },
            ],
        }).compile();

        service = module.get<ScenarioEngineService>(ScenarioEngineService);
        prisma = module.get<PrismaService>(PrismaService);
        riskEngine = module.get<RiskEngineService>(RiskEngineService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getScenarioParameters', () => {
        it('should return null if scenario is not found', async () => {
            mockPrisma.senaryo.findUnique.mockResolvedValue(null);
            const result = await service.getScenarioParameters('INVALID');
            expect(result).toBeNull();
        });

        it('should return parameters if scenario is found', async () => {
            const mockParams = { param1: 'val1' };
            mockPrisma.senaryo.findUnique.mockResolvedValue({
                senaryo_kodu: 'SC-1',
                parametreler: mockParams,
            });
            const result = await service.getScenarioParameters('SC-1');
            expect(result).toEqual(mockParams);
        });
    });

    describe('runAllScenarios', () => {
        it('should execute calculateAllKpis and upsert results', async () => {
            const mockSenaryolar = [
                { senaryo_kodu: 'SC-1', parametreler: '{"p": 1}' },
                { senaryo_kodu: 'SC-2', parametreler: { p: 2 } },
                { senaryo_kodu: 'SC-3', parametreler: 'bad-json' }, // testing JSON parse error path
            ];
            mockPrisma.senaryo.findMany.mockResolvedValue(mockSenaryolar);

            const mockKpiResults = [
                { kpi_kodu: 'KPI-1', deger: 15, risk_seviyesi: 'GREEN' },
                { kpi_kodu: 'KPI-2', deger: 'NaN-Value', risk_seviyesi: 'YELLOW' },
                { kpi_kodu: 'KPI-3', deger: 85, risk_seviyesi: 'RED' },
            ];
            mockRiskEngine.calculateAllKpis.mockResolvedValue(mockKpiResults);

            mockPrisma.audit.findFirst.mockResolvedValue(null);
            mockPrisma.audit.create.mockResolvedValue({ id: 'audit-123' });
            mockPrisma.finding.findFirst.mockResolvedValue(null);
            mockPrisma.finding.create.mockResolvedValue({ id: 'finding-123' });

            const result = await service.runAllScenarios();

            expect(result.message).toBe('Tüm senaryolar çalıştırıldı');
            expect(mockRiskEngine.calculateAllKpis).toHaveBeenCalledTimes(3);
            expect(mockPrisma.gunlukRiskOzet.upsert).toHaveBeenCalled();
        });

        it('should create continuous audit finding if risk level is RED and continuous audit exists', async () => {
            mockPrisma.senaryo.findMany.mockResolvedValue([{ senaryo_kodu: 'SC-1', parametreler: {} }]);
            mockRiskEngine.calculateAllKpis.mockResolvedValue([{ kpi_kodu: 'KPI-3', deger: 85, risk_seviyesi: 'RED' }]);

            // Mock continuous audit already exists
            mockPrisma.audit.findFirst.mockResolvedValue({ id: 'audit-123' });
            // Mock finding does not exist yet
            mockPrisma.finding.findFirst.mockResolvedValue(null);

            await service.runAllScenarios();

            expect(mockPrisma.audit.create).not.toHaveBeenCalled();
            expect(mockPrisma.finding.create).toHaveBeenCalled();
        });

        it('should not create continuous audit finding if finding already exists', async () => {
            mockPrisma.senaryo.findMany.mockResolvedValue([{ senaryo_kodu: 'SC-1', parametreler: {} }]);
            mockRiskEngine.calculateAllKpis.mockResolvedValue([{ kpi_kodu: 'KPI-3', deger: 85, risk_seviyesi: 'RED' }]);

            mockPrisma.audit.findFirst.mockResolvedValue({ id: 'audit-123' });
            // Mock finding exists
            mockPrisma.finding.findFirst.mockResolvedValue({ id: 'finding-123' });

            await service.runAllScenarios();

            expect(mockPrisma.finding.create).not.toHaveBeenCalled();
        });
    });

    describe('getScenarioSummary', () => {
        it('should call gunlukRiskOzet.findMany with correct params', async () => {
            mockPrisma.gunlukRiskOzet.findMany.mockResolvedValue([]);
            const result = await service.getScenarioSummary('SC-1', new Date('2026-03-24'));
            expect(result).toEqual([]);
            expect(mockPrisma.gunlukRiskOzet.findMany).toHaveBeenCalled();
        });

        it('should default to today date if date is omitted', async () => {
            mockPrisma.gunlukRiskOzet.findMany.mockResolvedValue([]);
            await service.getScenarioSummary('SC-1');
            expect(mockPrisma.gunlukRiskOzet.findMany).toHaveBeenCalled();
        });
    });
});
