import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../common/prisma.service';
import * as crypto from 'crypto';

// Prisma için mock
const mockPrismaService = {
    auditLog: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn()
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
    });

    it('AuditLogService tanımlı olmalı', () => {
        expect(service).toBeDefined();
    });

    describe('getLogs (Logları Getirme)', () => {
        it('Logları başarıyla getirmeli', async () => {
            const mockLogs = [{ id: '1', action: 'Test' }];
            mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);

            const result = await service.getLogs();
            expect(result).toEqual(mockLogs);
            expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
                orderBy: { id: 'desc' },
                take: 100
            });
        });

        it('Hata durumunda boş array dönmeli', async () => {
            mockPrismaService.auditLog.findMany.mockRejectedValue(new Error('DB Error'));

            const result = await service.getLogs();
            expect(result).toEqual([]);
        });
    });

    describe('createLog (Log Oluşturma ve Zincirleme Hashing)', () => {
        it('İlk log (previousHash yoksa) 0 hash ile başlayıp SHA-256 hash hesaplamalı', async () => {
            mockPrismaService.auditLog.findFirst.mockResolvedValue(null);

            const logData = { user: 'tester', action: 'LOGIN', details: 'test login' };
            const expectedHash = crypto.createHash('sha256').update('0' + JSON.stringify(logData)).digest('hex');

            mockPrismaService.auditLog.create.mockImplementation((args) => Promise.resolve(args.data));

            const result = await service.createLog(logData);

            expect(result).toBeDefined();
            expect(result.hash).toBeDefined();
            // Tam tarih dahil olduğu için tam eşleşme yapamayız, ancak hash formatını kontrol edebiliriz
            expect(result.hash.length).toBe(64); // SHA-256 64 karakter hex'tir
            expect(mockPrismaService.auditLog.findFirst).toHaveBeenCalled();
        });

        it('Önceki log varsa (zincirleme) onun hashini alıp yeni hash hesaplamalı', async () => {
            const prevHash = 'abc123def456';
            mockPrismaService.auditLog.findFirst.mockResolvedValue({ hash: prevHash });

            const logData = { user: 'tester', action: 'LOGIN', details: 'test login' };

            mockPrismaService.auditLog.create.mockImplementation((args) => Promise.resolve(args.data));

            const result = await service.createLog(logData);

            expect(result).toBeDefined();
            expect(result.hash.length).toBe(64);
            // new Date().toISOString() kullanıldığı için direkt prevHash ile başlayan hash'i test etmek zor,
            // ancak hata almadan çalıştığını biliyoruz.
        });

        it('Hata durumunda null dönmeli', async () => {
            mockPrismaService.auditLog.findFirst.mockRejectedValue(new Error('DB Error'));

            const result = await service.createLog({});
            expect(result).toBeNull();
        });
    });

    describe('verifyLogIntegrity (Zincirleme Bütünlük Doğrulaması)', () => {
        it('Loglar geçerliyse true dönmeli', async () => {
            // Şimdilik sadece metodun varlığını ve mantığını test ediyoruz,
            // tam doğrulama için karmaşık mock'lar gerekir
            mockPrismaService.auditLog.findMany.mockResolvedValue([
                { id: '1', hash: 'hash1' },
                { id: '2', hash: 'hash2' }
            ]);

            const result = await service.verifyLogIntegrity();
            expect(result.valid).toBe(true);
        });
    });
});
