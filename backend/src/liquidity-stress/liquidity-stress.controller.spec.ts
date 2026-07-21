import { Test, TestingModule } from '@nestjs/testing';
import { LiquidityStressController } from './liquidity-stress.controller';
import { LiquidityStressService } from './liquidity-stress.service';
import { AuditLogService } from '../audit/audit-log.service';

describe('LiquidityStressController', () => {
    let controller: LiquidityStressController;
    let service: LiquidityStressService;

    const mockStressService = {
        calculateAllScenarios: jest.fn(),
    };

    const mockAuditLogService = {
        log: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [LiquidityStressController],
            providers: [
                { provide: LiquidityStressService, useValue: mockStressService },
                { provide: AuditLogService, useValue: mockAuditLogService },
            ],
        }).compile();

        controller = module.get<LiquidityStressController>(LiquidityStressController);
        service = module.get<LiquidityStressService>(LiquidityStressService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getStressResults', () => {
        it('should call calculateAllScenarios and return stress test results', async () => {
            const mockResults = [
                { senaryo_ad: 'TESLIMAT_ARTIS_25', lcr_deger: 1.2, risk_seviyesi: 'GREEN' } as any,
            ];
            mockStressService.calculateAllScenarios.mockResolvedValue(mockResults);

            const result = await controller.getStressResults();

            expect(service.calculateAllScenarios).toHaveBeenCalledTimes(1);
            expect(result).toBe(mockResults);
        });
    });
});
