import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../common/prisma.service';
import * as crypto from 'crypto';

// Prisma için mock
const mockPrismaService = {
    auditLog: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn().mockImplementation((args) => Promise.resolve({ ...args.data, hash: 'a'.repeat(64), previousHash: '0' })),
    },
    user: {
        findMany: jest.fn().mockResolvedValue([]),
    }
};

describe('AuditLogService', () => {
    let service: AuditLogService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuditLogService,
                { provide: PrismaService, useValue: mockPrismaService }
            ],
        }).compile();

        service = module.get<AuditLogService>(AuditLogService);
        jest.clearAllMocks();
        mockPrismaService.user.findMany.mockResolvedValue([]);
    });

    it('AuditLogService tanımlı olmalı', () => {
        expect(service).toBeDefined();
    });

    describe('getLogs (Logları Getirme)', () => {
        it('Logları başarıyla getirmeli', async () => {
            const dateObj = new Date('2026-01-01T00:00:00.000Z');
            const mockLogs = [{ id: '1', action: 'Test', date: dateObj, user: 'u1' }];
            mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);

            const result = await service.getLogs();
            expect(result).toHaveLength(1);
            expect(result[0].action).toBe('Test');
            expect(result[0].date).toBe(dateObj.toISOString());
        });
    });

    describe('createLog (Log Oluşturma ve Zincirleme Hashing)', () => {
        it('Log verisini hazırlayıp prisma.auditLog.create metodu ile kaydetmeli', async () => {
            mockPrismaService.auditLog.create.mockResolvedValue({
                id: 'log1',
                user: 'tester',
                action: 'LOGIN',
                hash: 'a'.repeat(64),
                previousHash: '0'
            });

            const logData = { user: 'tester', action: 'LOGIN', details: 'test login' };
            const result = await service.createLog(logData);

            expect(result).toBeDefined();
            expect(result.hash).toHaveLength(64);
            expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
        });

        it('Hata durumunda null dönmeli', async () => {
            mockPrismaService.auditLog.create.mockRejectedValueOnce(new Error('DB Error'));

            const result = await service.createLog({});
            expect(result).toBeNull();
        });
    });

    describe('verifyLogIntegrity (Zincirleme Bütünlük Doğrulaması)', () => {
        it('Loglar boşsa veya geçerliyse true dönmeli', async () => {
            mockPrismaService.auditLog.findMany.mockResolvedValue([]);

            const result = await service.verifyLogIntegrity();
            expect(result.valid).toBe(true);
        });
    });
});
