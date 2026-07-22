import { Test, TestingModule } from '@nestjs/testing';
import { PharosService } from './pharos.service';
import { PrismaService } from '../common/prisma.service';
import { EmailService } from '../email/email.service';

// Mock dependencies
jest.mock('pdf-parse', () => jest.fn().mockResolvedValue({ text: 'pdf content' }));
jest.mock('mammoth', () => ({
  extractRawText: jest.fn().mockResolvedValue({ value: 'docx content' })
}));

describe('AuditronService', () => {
  let service: AuditronService;
  let prisma: PrismaService;

  const mockPrismaService = {
    finding: {
      count: jest.fn().mockResolvedValue(10),
      groupBy: jest.fn().mockResolvedValue([]),
    },
    audit: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    auditableUnit: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    documentChunk: {
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({ id: 'dc1' }),
      count: jest.fn().mockResolvedValue(0),
    }
  };

  const mockEmailService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditronService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuditronService>(AuditronService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('maskPII (KVKK Maskeleme)', () => {
    it('should mask TCKN', () => {
      const text = 'Kullanıcı TCKN: 12345678902';
      expect((service as any).maskPII(text)).toContain('[TCKN GIZLENDI]');
    });

    it('should mask IBAN', () => {
      const text = 'IBAN numaram TR12 3456 7890 1234 5678 9012 34';
      expect((service as any).maskPII(text)).toContain('[IBAN GIZLENDI]');
    });

    it('should mask Phone', () => {
      const text = 'Telefon: 0532 123 45 67';
      expect((service as any).maskPII(text)).toContain('[TELEFON GIZLENDI]');
    });
  });

  describe('cosineSimilarity', () => {
    it('should calculate similarity correctly', () => {
      const vecA = [1, 0];
      const vecB = [1, 0];
      const vecC = [0, 1];
      
      expect((service as any).cosineSimilarity(vecA, vecB)).toBe(1);
      expect((service as any).cosineSimilarity(vecA, vecC)).toBe(0);
    });
  });

  describe('chat - Fast Path', () => {
    it('should respond to greetings without AI', async () => {
      const response = await service.chat('merhaba');
      expect(response).toContain('Merhaba');
      
      const response2 = await service.chat('nasilsin');
      expect(response2).toContain('Iyiyim');
    });

    it('should block email sending requests', async () => {
        const response = await service.chat('Ahmet@test.com adresine mail gonder');
        expect(response).toContain('[GUVENLIK IHLALI GIRISIMI ENGELLENDI]');
    });
  });

  describe('getRelevantData', () => {
      it('should return finding stats', async () => {
          mockPrismaService.finding.count.mockResolvedValueOnce(20); // total
          mockPrismaService.finding.count.mockResolvedValueOnce(5);  // open
          mockPrismaService.finding.count.mockResolvedValueOnce(15); // closed
          (mockPrismaService.finding as any).groupBy.mockResolvedValue([{ risk: 'Kritik', _count: 2 }]);

          const data = await (service as any).getRelevantData('bulgu sayıları nedir');
          expect(data).toContain('Toplam: 20');
          expect(data).toContain('Acik: 5');
          expect(data).toContain('Kritik: 2');
      });

      it('should return audit list', async () => {
          mockPrismaService.audit.findMany.mockResolvedValue([{ title: 'Denetim 1', status: 'Planlandı' }]);
          const data = await (service as any).getRelevantData('denetimler neler');
          expect(data).toContain('Denetim 1');
      });
  });

  describe('processDocument', () => {
      it('should handle missing embedding model gracefully (smoke test)', async () => {
          jest.spyOn(service as any, 'ensureExtractor').mockResolvedValue(undefined);
          (service as any).extractor = jest.fn().mockResolvedValue({ data: new Float32Array([0.1, 0.2]) });
          jest.spyOn(service as any, 'getEmbedding').mockResolvedValue([0.1, 0.2]);

          const buffer = Buffer.from('test');
          const result = await service.processDocument(buffer, 'test.txt', 'text/plain');
          
          expect(result).toContain('hafizasina');
      });

      it('should reject unsupported extensions', async () => {
          const result = await service.processDocument(Buffer.from(''), 'test.exe', 'application/octet-stream');
          expect(result).toContain('Desteklenmeyen');
      });
  });
});
