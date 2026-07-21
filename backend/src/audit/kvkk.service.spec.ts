import { Test, TestingModule } from '@nestjs/testing';
import { KvkkService } from './kvkk.service';
import { PrismaService } from '../common/prisma.service';
import { AuditLogService } from './audit-log.service';

describe('KvkkService', () => {
    let service: KvkkService;

    const mockPrismaService = {
        dataRetentionPolicy: {
            findMany: jest.fn().mockResolvedValue([
                { id: '1', dataCategory: 'Kişisel Veri', dataDescription: 'Personel TC No', retentionPeriod: 120, status: 'Aktif' },
            ]),
            create: jest.fn().mockResolvedValue({ id: '2', dataCategory: 'Denetim Verisi', retentionPeriod: 60 }),
            findUnique: jest.fn().mockResolvedValue({ id: '1', status: 'Aktif' }),
            update: jest.fn().mockResolvedValue({ id: '1', status: 'Güncellendi' }),
        },
        dataSubjectRequest: {
            findMany: jest.fn().mockResolvedValue([]),
            create: jest.fn().mockResolvedValue({ id: 'req-1', requestCode: 'KVKK-2026-123456' }),
            findUnique: jest.fn().mockResolvedValue({ id: 'req-1', requestCode: 'KVKK-2026-123456' }),
            update: jest.fn().mockResolvedValue({ id: 'req-1', status: 'Yanıtlandı' }),
            count: jest.fn().mockResolvedValue(5),
        },
    };

    const mockAuditLogService = {
        createLog: jest.fn().mockResolvedValue({ id: 1 }),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                KvkkService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: AuditLogService, useValue: mockAuditLogService },
            ],
        }).compile();

        service = module.get<KvkkService>(KvkkService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getRetentionPolicies', () => {
        it('should return list of retention policies', async () => {
            const policies = await service.getRetentionPolicies();
            expect(policies).toBeDefined();
            expect(Array.isArray(policies)).toBe(true);
            expect(mockPrismaService.dataRetentionPolicy.findMany).toHaveBeenCalled();
        });
    });

    describe('createRetentionPolicy', () => {
        it('should create retention policy and log action', async () => {
            const dto = {
                dataCategory: 'Denetim Verisi',
                dataDescription: 'Çalışma kağıtları',
                legalBasis: '5411 s.K.',
                retentionPeriod: 120,
                destructionMethod: 'Anonimleştirme',
                responsibleUnit: 'İç Denetim',
            };

            const result = await service.createRetentionPolicy(dto, { username: 'testuser' });
            expect(result).toBeDefined();
            expect(mockAuditLogService.createLog).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'KVKK_POLITIKA_OLUSTURULDU',
                }),
            );
        });
    });

    describe('getDataSubjectRequestStats', () => {
        it('should return correct request stats', async () => {
            const stats = await service.getDataSubjectRequestStats();
            expect(stats).toEqual({
                total: 5,
                pending: 5,
                overdue: 5,
                responded: 5,
            });
        });
    });
});
