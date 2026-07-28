import { Test, TestingModule } from '@nestjs/testing';
import { SanctionController } from './sanction.controller';
import { SanctionService } from './sanction.service';
import { MasakService } from './masak.service';
import { SanctionImportService } from './sanction-import.service';
import { SanctionCronService } from './sanction-cron.service';
import { ReputationSignalService } from './reputation-signal.service';
import { AuditLogService } from '../audit/audit-log.service';

describe('SanctionController', () => {
    let controller: SanctionController;
    let sanctionService: SanctionService;
    let masakService: MasakService;

    const mockSanctionService = {
        getLogs: jest.fn(),
        createLog: jest.fn(),
        getDashboardStats: jest.fn(),
        getMatches: jest.fn(),
    };

    const mockMasakService = {
        scanForSuspiciousTransactions: jest.fn(),
    };

    const mockImportService = {
        importList: jest.fn(),
    };

    const mockCronService = {
        triggerSync: jest.fn(),
    };

    const mockSignalService = {
        getSignals: jest.fn(),
    };

    const mockAuditLogService = {
        log: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SanctionController],
            providers: [
                { provide: SanctionService, useValue: mockSanctionService },
                { provide: MasakService, useValue: mockMasakService },
                { provide: SanctionImportService, useValue: mockImportService },
                { provide: SanctionCronService, useValue: mockCronService },
                { provide: ReputationSignalService, useValue: mockSignalService },
                { provide: AuditLogService, useValue: mockAuditLogService },
            ],
        }).compile();

        controller = module.get<SanctionController>(SanctionController);
        sanctionService = module.get<SanctionService>(SanctionService);
        masakService = module.get<MasakService>(MasakService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('getLogs', () => {
        it('should call sanctionService.getLogs and return value', async () => {
            const mockLogs = [{ id: 1, user: 'admin', action: 'scan', details: 'info' }];
            mockSanctionService.getLogs.mockResolvedValue(mockLogs);

            const result = await controller.getLogs();

            expect(sanctionService.getLogs).toHaveBeenCalledTimes(1);
            expect(result).toBe(mockLogs);
        });
    });

    describe('createLog', () => {
        it('should call sanctionService.createLog with body and return value', async () => {
            const mockBody = { user: 'admin', category: 'MASAK', action: 'CREATE', details: 'desc' };
            const mockCreated = { id: 1, ...mockBody };
            mockSanctionService.createLog.mockResolvedValue(mockCreated);

            const result = await controller.createLog(mockBody);

            expect(sanctionService.createLog).toHaveBeenCalledWith(mockBody);
            expect(result).toBe(mockCreated);
        });
    });

    describe('scanMasak', () => {
        it('should call masakService.scanForSuspiciousTransactions and return value', async () => {
            const mockResult = { scanned: 100, matches: 2 };
            mockMasakService.scanForSuspiciousTransactions.mockResolvedValue(mockResult);

            const result = await controller.scanMasak();

            expect(masakService.scanForSuspiciousTransactions).toHaveBeenCalledTimes(1);
            expect(result).toBe(mockResult);
        });
    });
});
