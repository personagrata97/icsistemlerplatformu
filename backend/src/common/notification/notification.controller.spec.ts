import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { AuditLogService } from '../../audit/audit-log.service';

describe('NotificationController', () => {
  let controller: NotificationController;
  let service: NotificationService;

  const mockNotificationService = {
    getUserNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    markAllAsRead: jest.fn(),
    markAsRead: jest.fn(),
  };

  const mockAuditLogService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    service = module.get<NotificationService>(NotificationService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserNotifications', () => {
    it('should fetch user notifications using req.user.id', async () => {
      const mockReq = { user: { id: 'user-123' } };
      const mockResult = [{ id: 'notif-1', title: 'test' }];
      mockNotificationService.getUserNotifications.mockResolvedValue(mockResult);

      const result = await controller.getUserNotifications(mockReq);

      expect(service.getUserNotifications).toHaveBeenCalledWith('user-123');
      expect(result).toBe(mockResult);
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for user in format { count }', async () => {
      const mockReq = { user: { id: 'user-123' } };
      mockNotificationService.getUnreadCount.mockResolvedValue(5);

      const result = await controller.getUnreadCount(mockReq);

      expect(service.getUnreadCount).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ count: 5 });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all as read and return result', async () => {
      const mockReq = { user: { id: 'user-123' } };
      const mockResult = { count: 5 };
      mockNotificationService.markAllAsRead.mockResolvedValue(mockResult);

      const result = await controller.markAllAsRead(mockReq);

      expect(service.markAllAsRead).toHaveBeenCalledWith('user-123');
      expect(result).toBe(mockResult);
    });
  });

  describe('markAsRead', () => {
    it('should call markAsRead with id', async () => {
      const mockResult = { id: 'notif-1', isRead: true };
      mockNotificationService.markAsRead.mockResolvedValue(mockResult);

      const result = await controller.markAsRead('notif-1');

      expect(service.markAsRead).toHaveBeenCalledWith('notif-1');
      expect(result).toBe(mockResult);
    });
  });
});
