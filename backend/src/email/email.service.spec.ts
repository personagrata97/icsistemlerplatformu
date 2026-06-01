import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';

describe('EmailService', () => {
  let service: EmailService;
  let mailerService: MailerService;

  const mockMailerService = {
    sendMail: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: MailerService, useValue: mockMailerService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    mailerService = module.get<MailerService>(MailerService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendReplyEmail', () => {
    it('should send reply email with headers and tracking code', async () => {
      const result = await service.sendReplyEmail(
        'test@example.com',
        'Subject',
        'Content',
        'msg-id-123',
        'TC-456'
      );

      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Re: [ETİK-TC-456] Subject',
          headers: {
            'In-Reply-To': 'msg-id-123',
            'References': 'msg-id-123',
          },
        })
      );
    });

    it('should handle error and return false', async () => {
      mockMailerService.sendMail.mockRejectedValueOnce(new Error('SMTP Error'));
      const result = await service.sendReplyEmail('test@example.com', 'S', 'C');
      expect(result).toBe(false);
    });
  });

  describe('sendReceiptConfirmation', () => {
    it('should send confirmation email', async () => {
      const result = await service.sendReceiptConfirmation('user@test.com', 'TC-1');
      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: '[ETİK-TC-1] Bildiriminiz Alındı',
          to: 'user@test.com'
        })
      );
    });
  });

  describe('notifyEthicsCommittee', () => {
    it('should return false if no committee emails configured', async () => {
      delete process.env.ETHICS_COMMITTEE_EMAILS;
      const result = await service.notifyEthicsCommittee('summary', 'TC-1');
      expect(result).toBe(false);
    });

    it('should send notification if emails are configured', async () => {
      process.env.ETHICS_COMMITTEE_EMAILS = 'c1@test.com,c2@test.com';
      const result = await service.notifyEthicsCommittee('summary', 'TC-1');
      expect(result).toBe(true);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['c1@test.com', 'c2@test.com'],
          subject: '[YENİ ETİK BİLDİRİMİ] TC-1'
        })
      );
    });
  });

  describe('sendGeneralEmail', () => {
    it('should send general email with Auditron signature', async () => {
      await service.sendGeneralEmail('to@test.com', 'AI Sub', 'AI Msg');
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'AI Sub',
          html: expect.stringContaining('Auditron AI Bildirimi')
        })
      );
    });
  });

  describe('sendAuditReminderEmail', () => {
    it('should send overdue reminder with red color', async () => {
      await service.sendAuditReminderEmail('to@test.com', 'F-1', 'T-1', '2024-01-01', 'overdue', 5);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: expect.stringContaining('GECİKMİŞ BULGU'),
          html: expect.stringContaining('#dc2626') // Red
        })
      );
    });

    it('should send approaching reminder with orange color', async () => {
        await service.sendAuditReminderEmail('to@test.com', 'F-1', 'T-1', '2024-01-01', 'approaching', 3);
        expect(mockMailerService.sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: expect.stringContaining('YAKLAŞAN VADE'),
            html: expect.stringContaining('#ea580c') // Orange
          })
        );
      });
  });
});
