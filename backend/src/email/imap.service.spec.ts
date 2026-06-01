import { Test, TestingModule } from '@nestjs/testing';
import { ImapService } from './imap.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as Imap from 'imap';
import { simpleParser } from 'mailparser';

jest.mock('imap');
jest.mock('mailparser');
jest.mock('fs');

describe('ImapService', () => {
  let service: ImapService;
  let configService: ConfigService;
  let eventEmitter: EventEmitter2;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'ETHICS_EMAIL_HOST': 'host',
        'ETHICS_EMAIL_USER': 'user',
        'ETHICS_EMAIL_PASSWORD': 'pass',
        'ETHICS_IMAP_PORT': '993',
      };
      return config[key];
    }),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImapService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<ImapService>(ImapService);
    configService = module.get<ConfigService>(ConfigService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize imap if credentials are provided', async () => {
      const initSpy = jest.spyOn(service as any, 'initializeImap').mockImplementation();
      await service.onModuleInit();
      expect(initSpy).toHaveBeenCalled();
    });

    it('should not initialize if credentials missing', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      const initSpy = jest.spyOn(service as any, 'initializeImap').mockImplementation();
      await service.onModuleInit();
      expect(initSpy).not.toHaveBeenCalled();
    });
  });

  describe('IMAP Events', () => {
    it('should handle ready event', () => {
        const mockImapInstance = {
            once: jest.fn(),
            connect: jest.fn(),
            openBox: jest.fn(),
            on: jest.fn(),
        };
        (Imap as unknown as jest.Mock).mockReturnValue(mockImapInstance);
        
        (service as any).initializeImap();
        
        // Find 'ready' listener
        const readyHandler = mockImapInstance.once.mock.calls.find(call => call[0] === 'ready')[1];
        
        const startListeningSpy = jest.spyOn(service as any, 'startListening').mockImplementation();
        readyHandler();
        
        expect(service.isListening()).toBe(true);
        expect(startListeningSpy).toHaveBeenCalled();
    });

    it('should handle error event and schedule reconnect', () => {
        const mockImapInstance = { once: jest.fn(), connect: jest.fn() };
        (Imap as unknown as jest.Mock).mockReturnValue(mockImapInstance);
        jest.useFakeTimers();
        
        (service as any).initializeImap();
        const errorHandler = mockImapInstance.once.mock.calls.find(call => call[0] === 'error')[1];
        
        const scheduleSpy = jest.spyOn(service as any, 'scheduleReconnect');
        errorHandler(new Error('connection failed'));
        
        expect(scheduleSpy).toHaveBeenCalled();
        jest.useRealTimers();
    });
  });

  describe('parseEmail', () => {
    it('should parse email and save attachments', async () => {
      const mockParsedMail = {
        messageId: 'mid-1',
        from: { value: [{ address: 'from@test.com', name: 'From Name' }] },
        subject: 'Sub',
        text: 'Text body',
        html: 'Html body',
        date: new Date(),
        attachments: [
            { filename: 'file.txt', contentType: 'text/plain', size: 10, content: Buffer.from('data') }
        ]
      };

      const result = await (service as any).parseEmail(mockParsedMail);

      expect(result.messageId).toBe('mid-1');
      expect(result.from).toBe('from@test.com');
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(result.attachments).toHaveLength(1);
      expect(result.attachments[0].filename).toBe('file.txt');
    });
  });
});
