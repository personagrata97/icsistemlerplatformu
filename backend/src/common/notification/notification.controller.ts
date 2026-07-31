import { Controller, Get, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getUserNotifications(@Request() req, @Query('module') module?: string) {
    const userId = req.user.id;
    return this.notificationService.getUserNotifications(userId, module);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req, @Query('module') module?: string) {
    const userId = req.user.id;
    const count = await this.notificationService.getUnreadCount(userId, module);
    return { count };
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req, @Query('module') module?: string) {
    const userId = req.user.id;
    return this.notificationService.markAllAsRead(userId, module);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }
}
