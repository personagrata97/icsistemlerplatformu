import { Test, TestingModule } from '@nestjs/testing';
import { DataIngestionService } from './data-ingestion.service';
import { PrismaService } from '../common/prisma.service';

describe('DataIngestionService - Akıllı Sütun Eşleştirme', () => {
    let service: DataIngestionService;

    const mockPrisma = {
        musteri: {
            findFirst: jest.fn(),
            create: jest.fn(),
        },
        sozlesme: {
            create: jest.fn(),
        },
        odemeHareketi: {
            create: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DataIngestionService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<DataIngestionService>(DataIngestionService);
        jest.clearAllMocks();
    });

    describe('detectColumnMapping', () => {
        it('should correctly map fields using loose name-matching', () => {
            const rawData = [
                {
                    'Müşteri Adı Soyadı': 'Ahmet Yılmaz',
                    'Sözleşme No': 'SZ-1001',
                    'Sözleşme Tutarı': 250000,
                    'Vade': 120,
                    'Gecikme Günü': 15,
                },
            ];

            const mapping = (service as any).detectColumnMapping(rawData);

            expect(mapping['Müşteri Adı Soyadı']).toBe('ad_soyad');
            expect(mapping['Sözleşme No']).toBe('sozlesme_no');
            expect(mapping['Sözleşme Tutarı']).toBe('sozlesme_tutari');
            expect(mapping['Vade']).toBe('vade');
            expect(mapping['Gecikme Günü']).toBe('gecikme_gunu');
        });

        it('should fallback to heuristics when headers are arbitrary', () => {
            const rawData = [
                {
                    'Sutun_1': 'Ali Veli',
                    'Sutun_2': 'SZ-9002',
                    'Sutun_3': 150000,
                    'Sutun_4': 60,
                    'Sutun_5': 90,
                },
                {
                    'Sutun_1': 'Fatma Kaya',
                    'Sutun_2': 'SZ-9003',
                    'Sutun_3': 300000,
                    'Sutun_4': 120,
                    'Sutun_5': 0,
                },
            ];

            const mapping = (service as any).detectColumnMapping(rawData);

            expect(mapping['Sutun_1']).toBe('ad_soyad');
            expect(mapping['Sutun_2']).toBe('sozlesme_no');
            expect(mapping['Sutun_3']).toBe('sozlesme_tutari');
            expect(mapping['Sutun_4']).toBe('vade');
            expect(mapping['Sutun_5']).toBe('gecikme_gunu');
        });
    });

    describe('mapColumns', () => {
        it('should map raw row values using detected mapping dictionary', () => {
            const mapping = {
                'Kişi': 'ad_soyad',
                'Ref': 'sozlesme_no',
                'Meblağ': 'sozlesme_tutari',
                'Taksit Sayısı': 'vade',
            };

            const rawRow = {
                'Kişi': 'Zeynep Şen',
                'Ref': 'SZ-777',
                'Meblağ': '500000',
                'Taksit Sayısı': '120',
            };

            const result = (service as any).mapColumns(rawRow, mapping);

            expect(result.ad_soyad).toBe('Zeynep Şen');
            expect(result.sozlesme_no).toBe('SZ-777');
            expect(result.sozlesme_tutari).toBe(500000);
            expect(result.vade).toBe(120);
        });
    });
});
