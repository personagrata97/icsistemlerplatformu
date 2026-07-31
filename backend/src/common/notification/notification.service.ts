import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface NotificationPayload {
  title: string;
  description: string;
  type?: 'success' | 'warning' | 'info' | 'error';
  category?: string;
  link?: string;
  module?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private prisma: PrismaService) {}

  async create(data: NotificationPayload & { userId: string }) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        description: data.description,
        type: data.type || 'info',
        category: data.category || 'SİSTEM',
        link: data.link,
        module: data.module || 'audit',
      },
    });
  }

  async notifyByRole(roleName: string, data: NotificationPayload) {
    const users = await this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: {
                contains: roleName
              }
            }
          }
        },
        isActive: true,
        isDeleted: false
      }
    });

    if (users.length === 0) {
      this.logger.warn(`No active users found for role: ${roleName}. Notification not sent.`);
      return;
    }

    const creates = users.map(user => this.create({ ...data, userId: user.id }));
    await Promise.allSettled(creates);
    this.logger.log(`Sent notification to ${users.length} users with role ${roleName}`);
  }

  async notifyByDepartment(departmentName: string, data: NotificationPayload) {
    const users = await this.prisma.user.findMany({
      where: {
        department: departmentName,
        isActive: true,
        isDeleted: false
      }
    });

    if (users.length === 0) {
      this.logger.warn(`No active users found in department: ${departmentName}. Notification not sent.`);
      return;
    }

    const creates = users.map(user => this.create({ ...data, userId: user.id }));
    await Promise.allSettled(creates);
    this.logger.log(`Sent notification to ${users.length} users in department ${departmentName}`);
  }

  async getUserNotifications(userId: string, module?: string) {
    const whereClause: any = { userId };
    if (module) {
      whereClause.module = module;
    }
    
    return this.prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getUnreadCount(userId: string, module?: string) {
    const whereClause: any = { userId, isRead: false };
    if (module) {
      whereClause.module = module;
    }
    
    return this.prisma.notification.count({
      where: whereClause,
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string, module?: string) {
    const whereClause: any = { userId, isRead: false };
    if (module) {
      whereClause.module = module;
    }
    
    return this.prisma.notification.updateMany({
      where: whereClause,
      data: { isRead: true },
    });
  }
}
