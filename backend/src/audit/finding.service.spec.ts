import { Test, TestingModule } from '@nestjs/testing';
import { FindingService } from './finding.service';
import { PrismaService } from '../common/prisma.service';
import { PharosService } from '../pharos/pharos.service';
import { AuditLogService } from './audit-log.service';
import { AuditRiskService } from './audit-risk.service';
import { EmailService } from '../email/email.service';
import { PdfReportService } from './pdf-report.service';
import * as fs from 'fs';

jest.mock('fs');

describe('FindingService', () => {
    let service: FindingService;

    const mockPrisma = {
        finding: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        audit: {
            findUnique: jest.fn(),
        },
        auditLog: {
            findMany: jest.fn(),
        },
        auditFollowUp: {
            create: jest.fn(),
            count: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            deleteMany: jest.fn(),
        },
        auditConciliation: {
            upsert: jest.fn(),
            findUnique: jest.fn(),
        }
    };

    const mockAuditron = {};
    const mockAuditLog = { createLog: jest.fn() };
    const mockAuditRisk = { updateOpenFindingsCount: jest.fn() };
    const mockEmail = { sendGeneralEmail: jest.fn() };
    const mockPdfReport = { generatePdf: jest.fn() };

    const mockUser = {
        id: 'u1',
        displayName: 'Test User',
        roles: ['AUDITOR'],
        permissions: [{ module: 'AUDIT', action: 'VIEW', scope: 'OWN' }]
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FindingService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: AuditronService, useValue: mockAuditron },
                { provide: AuditLogService, useValue: mockAuditLog },
                { provide: AuditRiskService, useValue: mockAuditRisk },
                { provide: EmailService, useValue: mockEmail },
                { provide: PdfReportService, useValue: mockPdfReport },
            ],
        }).compile();

        service = module.get<FindingService>(FindingService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('isAdmin', () => {
        it('should return true for ADMIN role string array', () => {
            expect((service as any).isAdmin({ roles: ['ADMIN'] })).toBe(true);
        });
        it('should return false for AUDITOR role', () => {
            expect((service as any).isAdmin({ roles: ['AUDITOR'] })).toBe(false);
        });
    });

    describe('getAllFindings', () => {
        it('should return findings with history for admin', async () => {
            mockPrisma.finding.findMany.mockResolvedValue([{ id: 'f1' }]);
            mockPrisma.auditLog.findMany.mockResolvedValue([{ action: 'Test' }]);
            
            const admin = { roles: ['ADMIN'] };
            const result = await service.getAllFindings(admin);
            
            expect(result[0].history).toBeDefined();
            expect(mockPrisma.finding.findMany).toHaveBeenCalled();
        });
    });

    describe('createFinding', () => {
        it('should block creation if audit is closed (Sealing)', async () => {
            mockPrisma.audit.findUnique.mockResolvedValue({ id: 'a1', status: 'Tamamlandı' });
            await expect(service.createFinding({ auditId: 'a1' }, mockUser))
                .rejects.toThrow('Rapor Bütünlüğü Zafiyeti');
        });

        it('should create finding and actions successfully', async () => {
            mockPrisma.audit.findUnique.mockResolvedValue({ id: 'a1', status: 'Devam Ediyor', AuditableUnit: { code: 'BNK' } });
            mockPrisma.finding.findMany.mockResolvedValue([]);
            mockPrisma.finding.create.mockResolvedValue({ id: 'f1', code: 'BNK-2024-001', title: 'T' });

            const data = {
                auditId: 'a1',
                title: 'T',
                actions: [{ action: 'Act 1', dueDate: '2024-12-31' }]
            };

            const result = await service.createFinding(data, mockUser);
            
            expect(result.id).toBe('f1');
            expect(mockPrisma.auditFollowUp.create).toHaveBeenCalled();
            expect(mockAuditLog.createLog).toHaveBeenCalled();
        });
    });

    describe('updateFinding state machine', () => {
        it('should block invalid transition Taslak to Tamamlandı for non-admin', async () => {
            mockPrisma.finding.findUnique.mockResolvedValue({ id: 'f1', status: 'Taslak' });
            await expect(service.updateFinding('f1', { status: 'Tamamlandı' }, mockUser))
                .rejects.toThrow('Geçersiz bulgu durum geçişi');
        });

        it('should block closure if open actions exist', async () => {
            mockPrisma.finding.findUnique.mockResolvedValue({ id: 'f1', status: 'Açık' });
            mockPrisma.auditFollowUp.count.mockResolvedValue(1);

            await expect(service.updateFinding('f1', { status: 'Tamamlandı' }, mockUser))
                .rejects.toThrow('açık aksiyonu var');
        });

        it('should block self-approval (Segregation of Duties)', async () => {
             mockPrisma.finding.findUnique.mockResolvedValue({ id: 'f1', status: 'Onay Bekliyor', assignedUserId: mockUser.id });
             await expect(service.updateFinding('f1', { status: 'Onaylandı' }, mockUser))
                .rejects.toThrow('Kendi bulgunuzu onaylayamazsınız');
        });
    });

    describe('acceptRisk', () => {
        it('should update status and save file if provided', async () => {
            mockPrisma.finding.update.mockResolvedValue({ id: 'f1', status: 'Risk Kabul Edildi' });
            (fs.existsSync as jest.Mock).mockReturnValue(false);

            const adminUser = { ...mockUser, roles: ['ADMIN'] };
            const file = { originalname: 'risk.pdf', buffer: Buffer.from('data') };
            await service.acceptRisk('f1', 'Gerekçe', file, adminUser);

            expect(mockPrisma.finding.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ isRiskAccepted: true })
            }));
        });
    });

    describe('notifyFinding', () => {
        it('should block external emails', async () => {
            mockPrisma.finding.findUnique.mockResolvedValue({ id: 'f1' });
            await expect(service.notifyFinding('f1', 'test@gmail.com', mockUser))
                .rejects.toThrow('Sadece kurum içi');
        });

        it('should send email for internal address', async () => {
            mockPrisma.finding.findUnique.mockResolvedValue({ id: 'f1', code: 'C1' });
            await service.notifyFinding('f1', 'user@emlakkatilimtfs.com.tr', mockUser);
            expect(mockEmail.sendGeneralEmail).toHaveBeenCalled();
        });
    });

    describe('deleteFinding', () => {
        it('should soft delete finding for admin', async () => {
            const adminUser = { ...mockUser, roles: ['ADMIN'] };
            mockPrisma.finding.findUnique.mockResolvedValue({ id: 'f1', auditId: 'a1', code: 'F-1' });
            mockPrisma.finding.update.mockResolvedValue({ id: 'f1', isDeleted: true });

            await service.deleteFinding('f1', adminUser);
            expect(mockPrisma.finding.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ isDeleted: true })
            }));
        });
    });
});
