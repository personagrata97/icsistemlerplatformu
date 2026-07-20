import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../common/prisma.service';
import { AuditronService } from '../auditron/auditron.service';
import { AuditLogService } from './audit-log.service';
import { AuditRiskService } from './audit-risk.service';
import { FindingService } from './finding.service';
import { AuditTrashService } from './audit-trash.service';
import { NotificationService } from '../common/notification/notification.service';
import { ForbiddenException } from '@nestjs/common';
import * as fs from 'fs';

jest.mock('fs');

describe('AuditService', () => {
    let service: AuditService;
    let prisma: PrismaService;

    const mockPrisma = {
        audit: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        auditableUnit: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
        document: {
            create: jest.fn(),
            findMany: jest.fn(),
        }
    };

    const mockAuditron = { processDocument: jest.fn().mockResolvedValue('ok') };
    const mockAuditLog = { createLog: jest.fn() };
    const mockAuditRisk = { updateRiskMetrics: jest.fn() };
    const mockFinding = {};
    const mockTrash = {};
    const mockNotification = {};

    const mockUser = {
        id: 'u1',
        username: 'auditor1',
        roles: ['AUDITOR'],
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuditService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: AuditronService, useValue: mockAuditron },
                { provide: AuditLogService, useValue: mockAuditLog },
                { provide: AuditRiskService, useValue: mockAuditRisk },
                { provide: FindingService, useValue: mockFinding },
                { provide: AuditTrashService, useValue: mockTrash },
                { provide: NotificationService, useValue: mockNotification },
            ],
        }).compile();

        service = module.get<AuditService>(AuditService);
        prisma = module.get<PrismaService>(PrismaService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getAllAudits', () => {
        it('should return audits list', async () => {
            mockPrisma.audit.findMany.mockResolvedValue([{ id: 'a1', title: 'Birim Denetimi' }]);
            const result = await service.getAllAudits(mockUser);
            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Birim Denetimi');
        });
    });

    describe('uploadWorkpaper', () => {
        it('should block dangerous file extensions', async () => {
            const file = { originalname: 'malware.exe', buffer: Buffer.from('data') };
            await expect(service.uploadWorkpaper('a1', file, 'Çalışma Kağıdı', mockUser))
                .rejects.toThrow(ForbiddenException);
        });

        it('should block executable payload magic bytes even with pdf extension', async () => {
            const file = { originalname: 'fake.pdf', buffer: Buffer.from([0x4D, 0x5A, 0x90, 0x00]) }; // MZ executable header
            await expect(service.uploadWorkpaper('a1', file, 'Çalışma Kağıdı', mockUser))
                .rejects.toThrow(ForbiddenException);
        });
    });
});
