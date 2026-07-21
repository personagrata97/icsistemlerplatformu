import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: PrismaService;

  const mockPrisma = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create notification with defaults', async () => {
      const input = {
        userId: 'user-123',
        title: 'Test Title',
        description: 'Test Desc',
      };
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1', ...input });

      const result = await service.create(input);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          title: 'Test Title',
          description: 'Test Desc',
          type: 'info',
          category: 'SİSTEM',
          link: undefined,
        },
      });
      expect(result.id).toBe('notif-1');
    });

    it('should create notification with custom values', async () => {
      const input = {
        userId: 'user-123',
        title: 'Test Title',
        description: 'Test Desc',
        type: 'success' as const,
        category: 'UYARI',
        link: '/alerts/1',
      };
      mockPrisma.notification.create.mockResolvedValue({ id: 'notif-1', ...input });

      const result = await service.create(input);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          title: 'Test Title',
          description: 'Test Desc',
          type: 'success',
          category: 'UYARI',
          link: '/alerts/1',
        },
      });
    });
  });

  describe('getUserNotifications', () => {
    it('should query notifications for user, ordered by createdAt desc', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);

      const result = await service.getUserNotifications('user-123');

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      expect(result).toEqual([]);
    });
  });

  describe('getUnreadCount', () => {
    it('should call count with isRead false', async () => {
      mockPrisma.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-123');

      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-123', isRead: false },
      });
      expect(result).toBe(5);
    });
  });

  describe('markAsRead', () => {
    it('should call update to set isRead true', async () => {
      mockPrisma.notification.update.mockResolvedValue({ id: 'notif-1', isRead: true });

      const result = await service.markAsRead('notif-1');

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { isRead: true },
      });
      expect(result.isRead).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should call updateMany to set isRead true for all unread', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.markAllAsRead('user-123');

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', isRead: false },
        data: { isRead: true },
      });
      expect(result.count).toBe(3);
    });
  });
});
