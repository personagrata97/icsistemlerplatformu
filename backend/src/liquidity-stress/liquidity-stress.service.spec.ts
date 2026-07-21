import { Test, TestingModule } from '@nestjs/testing';
import { LiquidityStressService } from './liquidity-stress.service';
import { PrismaService } from '../common/prisma.service';
import { DeliveryLiabilityCalculator } from '../risk-engine/delivery-liability.calculator';

describe('LiquidityStressService', () => {
    let service: LiquidityStressService;
    let prisma: PrismaService;
    let calculator: DeliveryLiabilityCalculator;

    const mockPrisma = {
        likiditePozisyonu: {
            findFirst: jest.fn(),
        },
        likiditeStresSonucu: {
            createMany: jest.fn(),
        },
    };

    const mockCalculator = {
        calculateTotalLiability: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LiquidityStressService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: DeliveryLiabilityCalculator, useValue: mockCalculator },
            ],
        }).compile();

        service = module.get<LiquidityStressService>(LiquidityStressService);
        prisma = module.get<PrismaService>(PrismaService);
        calculator = module.get<DeliveryLiabilityCalculator>(DeliveryLiabilityCalculator);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('calculateAllScenarios', () => {
        it('should return empty array if no liquidity position is found', async () => {
            mockPrisma.likiditePozisyonu.findFirst.mockResolvedValue(null);
            const result = await service.calculateAllScenarios();
            expect(result).toEqual([]);
        });

        it('should calculate stress test scenarios under different risk levels (GREEN, YELLOW, RED)', async () => {
            // Scenario where LCR will be high (GREEN)
            mockPrisma.likiditePozisyonu.findFirst.mockResolvedValue({
                nakit: 1000000,
                likit_varlik: 2000000,
                kisa_vadeli_yukumluluk: 500000,
            });
            mockCalculator.calculateTotalLiability.mockResolvedValue(100000);
            mockPrisma.likiditeStresSonucu.createMany.mockResolvedValue({ count: 3 });

            const result = await service.calculateAllScenarios();

            expect(result).toHaveLength(3);
            expect(result[0].risk_seviyesi).toBe('GREEN');
            expect(mockPrisma.likiditeStresSonucu.createMany).toHaveBeenCalledTimes(1);
        });

        it('should classify under RED risk level if LCR is below 0.8', async () => {
            // Scenario where LCR will be very low (RED)
            mockPrisma.likiditePozisyonu.findFirst.mockResolvedValue({
                nakit: 10000,
                likit_varlik: 20000,
                kisa_vadeli_yukumluluk: 500000,
            });
            mockCalculator.calculateTotalLiability.mockResolvedValue(100000);

            const result = await service.calculateAllScenarios();

            expect(result).toHaveLength(3);
            expect(result[0].risk_seviyesi).toBe('RED');
        });

        it('should classify under YELLOW risk level if LCR is between 0.8 and 1.0', async () => {
            // Scenario where LCR will be around 0.9 (YELLOW)
            mockPrisma.likiditePozisyonu.findFirst.mockResolvedValue({
                nakit: 90000,
                likit_varlik: 90000,
                kisa_vadeli_yukumluluk: 100000,
            });
            mockCalculator.calculateTotalLiability.mockResolvedValue(80000); // Payda for scenario 1 = 100k000 + 80k000*1.25 = 200k000. LCR = 180k000/200k000 = 0.9

            const result = await service.calculateAllScenarios();

            expect(result).toHaveLength(3);
            expect(result[0].risk_seviyesi).toBe('YELLOW');
        });
    });
});
