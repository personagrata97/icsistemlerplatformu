import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should call $connect', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue(undefined);
      const loggerSpy = jest.spyOn((service as any).logger, 'log').mockImplementation();
      
      await service.onModuleInit();
      
      expect(connectSpy).toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Veritabanı bağlantısı kuruldu'));
      
      connectSpy.mockRestore();
      loggerSpy.mockRestore();
    });
  });

  describe('onModuleDestroy', () => {
    it('should call $disconnect', async () => {
      const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue(undefined);
      
      await service.onModuleDestroy();
      
      expect(disconnectSpy).toHaveBeenCalled();
      
      disconnectSpy.mockRestore();
    });
  });
});
