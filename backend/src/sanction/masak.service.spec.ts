import { Test, TestingModule } from '@nestjs/testing';
import { MasakService } from './masak.service';
import { PrismaService } from '../common/prisma.service';

describe('MasakService Suspicious Transactions', () => {
    let service: MasakService;

    const mockPrisma = {
        odemeHareketi: {
            findMany: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MasakService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<MasakService>(MasakService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should detect suspicious transactions exceeding 500k TL threshold', async () => {
        mockPrisma.odemeHareketi.findMany.mockResolvedValue([
            {
                hareket_id: 'mov-1',
                tarih: new Date(),
                tutar: 600000,
                tip: 'PESINAT',
                sozlesme: {
                    musteri: { ad_soyad: 'Şüpheli Müşteri' }
                }
            }
        ]);

        const result = await service.scanForSuspiciousTransactions();

        expect(result.tespit_edilen_supheli_islem_sayisi).toBe(1);
        expect(result.islemler[0].musteri).toBe('Şüpheli Müşteri');
        expect(result.islemler[0].risk_skoru).toBe('YUKSEK');
    });
});
