import { Test, TestingModule } from '@nestjs/testing';
import { SamplingService } from './sampling.service';
import { PrismaService } from '../common/prisma.service';
import { WorkpaperService } from './workpaper.service';
import { NotificationService } from '../common/notification/notification.service';
import { AuditLogService } from './audit-log.service';

describe('SamplingService', () => {
    let service: SamplingService;

    const mockPrisma = {
        auditSample: {
            findMany: jest.fn().mockResolvedValue([]),
            findUnique: jest.fn().mockResolvedValue({ id: 's1', name: 'Örneklem 1' }),
            create: jest.fn().mockResolvedValue({ id: 's1', name: 'Örneklem 1' }),
        },
        sozlesme: {
            findMany: jest.fn().mockResolvedValue([]),
            count: jest.fn().mockResolvedValue(100),
        }
    };

    const mockWorkpaper = {};
    const mockNotification = {};
    const mockAuditLog = { createLog: jest.fn() };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SamplingService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: WorkpaperService, useValue: mockWorkpaper },
                { provide: NotificationService, useValue: mockNotification },
                { provide: AuditLogService, useValue: mockAuditLog },
            ],
        }).compile();

        service = module.get<SamplingService>(SamplingService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getAll', () => {
        it('should return list of samples', async () => {
            const list = await service.getAll();
            expect(list).toEqual([]);
        });
    });
});
