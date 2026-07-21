import { Test, TestingModule } from '@nestjs/testing';
import { EthicsService } from './ethics.service';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationService } from '../common/notification/notification.service';

describe('EthicsService Security & Encryption', () => {
    let service: EthicsService;

    const mockPrisma = {
        ethicsReport: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
            groupBy: jest.fn(),
        },
        auditLog: {
            create: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
    };

    const mockEmail = {
        notifyEthicsCommittee: jest.fn(),
        sendReceiptConfirmation: jest.fn(),
    };

    const mockNotification = {
        create: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EthicsService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: EmailService, useValue: mockEmail },
                { provide: NotificationService, useValue: mockNotification },
            ],
        }).compile();

        service = module.get<EthicsService>(EthicsService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should encrypt and decrypt sensitive reporter data securely', () => {
        const plainText = 'Gizli İhbarcı Ahmet Yılmaz';
        const encrypted = (service as any).encrypt(plainText);

        expect(encrypted).not.toBe(plainText);
        expect(encrypted).toContain(':');

        const decrypted = (service as any).decrypt(encrypted);
        expect(decrypted).toBe(plainText);
    });

    it('should mask reporter email for public queries (KVKK Compliance)', () => {
        const masked = (service as any).maskEmail('ahmet.yilmaz@emlakkatilim.com.tr');
        expect(masked).toContain('@emlakkatilim.com.tr');
        expect(masked).not.toBe('ahmet.yilmaz@emlakkatilim.com.tr');
        expect(masked).toContain('*');
    });

    it('should create ethics report with encrypted fields and tracking code', async () => {
        mockPrisma.ethicsReport.findUnique.mockResolvedValue(null);
        mockPrisma.ethicsReport.create.mockResolvedValue({
            id: 'eth-1',
            trackingCode: 'ABCD-1234-EFGH-5678',
            type: 'Yolsuzluk',
            status: 'Yeni',
        });

        const reportData = {
            type: 'Yolsuzluk',
            name: 'Ali Can',
            email: 'ali@test.com',
            description: 'İlişkili taraf işlemi ihlali',
            priority: 'Yüksek',
            anonymous: true,
        };

        const result = await service.createReport(reportData, null, '192.168.1.100');

        expect(result.id).toBe('eth-1');
        expect(mockPrisma.ethicsReport.create).toHaveBeenCalled();
        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    action: 'ETHICS_SUBMITTED',
                })
            })
        );
    });
});
