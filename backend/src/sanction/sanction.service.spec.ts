import { Test, TestingModule } from '@nestjs/testing';
import { SanctionService } from './sanction.service';
import { PrismaService } from '../common/prisma.service';

describe('SanctionService', () => {
    let service: SanctionService;

    const mockPrisma = {
        sanctionLog: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SanctionService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<SanctionService>(SanctionService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createLog', () => {
        it('should encrypt the details and create a log entry', async () => {
            const mockData = {
                user: 'test_user',
                category: 'MASAK',
                action: 'SCAN',
                details: 'Hassas işlem detayları',
            };

            mockPrisma.sanctionLog.create.mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data }));

            const result = await service.createLog(mockData);

            expect(result.user).toBe(mockData.user);
            expect(result.category).toBe(mockData.category);
            expect(result.action).toBe(mockData.action);
            expect(result.details).not.toBe(mockData.details);
            expect(result.details).toContain(':'); // should contain iv:encryptedText
            expect(mockPrisma.sanctionLog.create).toHaveBeenCalledTimes(1);
        });

        it('should handle null details gracefully', async () => {
            const mockData = {
                user: 'test_user',
                category: 'MASAK',
                action: 'SCAN',
                details: null,
            };

            mockPrisma.sanctionLog.create.mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data }));

            const result = await service.createLog(mockData);
            expect(result.details).toBeNull();
        });

        it('should throw error when encryption fails', async () => {
            const mockData = {
                user: 'test_user',
                category: 'MASAK',
                action: 'SCAN',
                details: 'some details',
            };

            const crypto = require('crypto');
            const originalRandomBytes = crypto.randomBytes;
            jest.spyOn(crypto, 'randomBytes').mockImplementationOnce(() => {
                throw new Error('Random bytes generation failed');
            });

            await expect(service.createLog(mockData)).rejects.toThrow('Veri güvenliği ihlali: Şifreleme başarısız.');
        });
    });

    describe('getLogs', () => {
        it('should fetch logs and decrypt their details', async () => {
            // First let's encrypt a value so we can decrypt it correctly in the test
            const originalDetails = 'Gerçek Detay Verisi';
            const logData = {
                user: 'test_user',
                category: 'MASAK',
                action: 'SCAN',
                details: originalDetails,
            };

            mockPrisma.sanctionLog.create.mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data }));
            const createdLog = await service.createLog(logData);

            mockPrisma.sanctionLog.findMany.mockResolvedValue([
                {
                    id: 1,
                    user: 'test_user',
                    category: 'MASAK',
                    action: 'SCAN',
                    details: createdLog.details,
                    timestamp: new Date(),
                },
                {
                    id: 2,
                    user: 'test_user',
                    category: 'MASAK',
                    action: 'SCAN',
                    details: null,
                    timestamp: new Date(),
                },
                {
                    id: 3,
                    user: 'test_user',
                    category: 'MASAK',
                    action: 'SCAN',
                    details: 'not-encrypted-text',
                    timestamp: new Date(),
                }
            ]);

            const logs = await service.getLogs();
            expect(logs).toHaveLength(3);
            expect(logs[0].details).toBe(originalDetails);
            expect(logs[1].details).toBeNull();
            expect(logs[2].details).toBe('not-encrypted-text');
        });

        it('should return warning placeholder when decryption fails due to corrupted data', async () => {
            mockPrisma.sanctionLog.findMany.mockResolvedValue([
                {
                    id: 1,
                    user: 'test_user',
                    category: 'MASAK',
                    action: 'SCAN',
                    details: 'badiv:corrupteddata',
                    timestamp: new Date(),
                }
            ]);

            const logs = await service.getLogs();
            expect(logs[0].details).toBe('*** ŞİFRELİ VERİ (DEŞİFRE EDİLEMEDİ) ***');
        });
    });
});
