import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../common/prisma.service';
import { PharosService } from '../pharos/pharos.service';
import { AuditLogService } from './audit-log.service';
import { AuditRiskService } from './audit-risk.service';
import { FindingService } from './finding.service';
import { AuditTrashService } from './audit-trash.service';
import { NotificationService } from '../common/notification/notification.service';
import { ForbiddenException, ConflictException } from '@nestjs/common';
import * as fs from 'fs';

jest.mock('fs');

describe('AuditService Core Logic & Controls', () => {
    let service: AuditService;

    const mockPrisma = {
        audit: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        userPromotion: {
            findMany: jest.fn(),
        },
        independenceDeclaration: {
            findFirst: jest.fn(),
        },
        finding: {
            count: jest.fn(),
        },
        auditWorkpaper: {
            count: jest.fn(),
        },
    };

    const mockAuditron = {};
    const mockAuditLog = { createLog: jest.fn() };
    const mockAuditRisk = { updateOpenFindingsCount: jest.fn() };
    const mockFinding = {};
    const mockTrash = {};
    const mockNotification = { create: jest.fn() };

    const mockUser = {
        id: 'user-admin-1',
        displayName: 'Selim Admin',
        roles: ['ADMIN'],
        department: 'Teftiş Kurulu',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuditService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: PharosService, useValue: mockAuditron },
                { provide: AuditLogService, useValue: mockAuditLog },
                { provide: AuditRiskService, useValue: mockAuditRisk },
                { provide: FindingService, useValue: mockFinding },
                { provide: AuditTrashService, useValue: mockTrash },
                { provide: NotificationService, useValue: mockNotification },
            ],
        }).compile();

        service = module.get<AuditService>(AuditService);
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('Auditor Independence Validation', () => {
        it('should throw ForbiddenException if auditor served in department within 1 year', async () => {
            mockPrisma.userPromotion.findMany.mockResolvedValue([
                { id: 'p1', userId: 'auditor-1', department: 'Krediler', type: 'Atama', endDate: new Date() }
            ]);

            const auditData = {
                title: 'Krediler Birimi Denetimi',
                department: 'Krediler',
                supervisorId: 'auditor-1',
                startDate: '2026-01-01',
            };

            await expect(service.createAudit(auditData, mockUser)).rejects.toThrow(ForbiddenException);
        });
    });

    describe('Parallel Audit Conflict Control', () => {
        it('should throw ConflictException if active audit exists for same unit', async () => {
            mockPrisma.userPromotion.findMany.mockResolvedValue([]);
            mockPrisma.audit.findFirst.mockResolvedValue({
                id: 'active-audit-1',
                auditCode: 'DEN-2026-001',
                title: 'Mevcut Aktif Denetim',
                status: 'Devam Ediyor',
            });

            const auditData = {
                title: 'Yeni Denetim',
                unitId: 'unit-100',
                department: 'Şubeler',
            };

            await expect(service.createAudit(auditData, mockUser)).rejects.toThrow(ConflictException);
        });

        it('should allow parallel audit when allowParallel is true', async () => {
            mockPrisma.userPromotion.findMany.mockResolvedValue([]);
            mockPrisma.audit.findFirst.mockResolvedValue({
                id: 'active-audit-1',
                status: 'Devam Ediyor',
            });
            mockPrisma.audit.create.mockResolvedValue({ id: 'new-audit-2', title: 'Paralel Denetim' });

            const auditData = {
                title: 'Paralel Denetim',
                unitId: 'unit-100',
                department: 'Şubeler',
                allowParallel: true,
            };

            const result = await service.createAudit(auditData, mockUser);
            expect(result.id).toBe('new-audit-2');
        });
    });

    describe('Audit Reporting Verification', () => {
        it('should block transition to Raporlandı if no approved findings exist', async () => {
            mockPrisma.audit.findUnique.mockResolvedValue({ id: 'a1', status: 'Devam Ediyor' });
            mockPrisma.finding.count.mockResolvedValue(0);

            await expect(service.updateAudit('a1', { status: 'Raporlandı', statusJustification: 'Test' }, mockUser))
                .rejects.toThrow('en az bir onaylanmış bulgu gereklidir');
        });
    });
});
