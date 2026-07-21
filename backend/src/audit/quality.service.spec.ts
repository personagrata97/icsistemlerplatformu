import { Test, TestingModule } from '@nestjs/testing';
import { QualityService } from './quality.service';
import { PrismaService } from '../common/prisma.service';
import { AuditLogService } from './audit-log.service';

describe('QualityService IIA QAIP', () => {
    let service: QualityService;

    const mockPrisma = {
        qualityMetric: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        qualityAssessment: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        qualityAction: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        audit: {
            findMany: jest.fn(),
        },
        finding: {
            findMany: jest.fn(),
        },
        auditPlan: {
            findMany: jest.fn(),
        },
    };

    const mockAuditLog = {
        createLog: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QualityService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: AuditLogService, useValue: mockAuditLog },
            ],
        }).compile();

        service = module.get<QualityService>(QualityService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should calculate auto metrics for IIA quality dashboard', async () => {
        mockPrisma.audit.findMany.mockResolvedValue([
            { id: 'a1', status: 'Tamamlandı', startDate: new Date('2026-01-01'), endDate: new Date('2026-01-20'), isDeleted: false }
        ]);
        mockPrisma.finding.findMany.mockResolvedValue([
            { id: 'f1', status: 'Tamamlandı', risk: 'Orta', isDeleted: false }
        ]);
        mockPrisma.auditPlan.findMany.mockResolvedValue([
            { id: 'p1', status: 'Onaylandı' }
        ]);

        const metrics = await service.calculateAutoMetrics();
        expect(metrics).toHaveLength(6);
        expect(metrics[0].id).toBe('auto-completion-rate');
        expect(metrics[0].actual).toBe(100);
    });
});
