import { Controller, Get, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@User() user: any, @Query('unreadOnly') unreadOnly?: string) {
    return this.notificationsService.findAll(user.userId, unreadOnly === 'true');
  }

  @Patch(':id/read')
  async markAsRead(@User() user: any, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.userId, id);
  }

  @Patch('read-all')
  async markAllAsRead(@User() user: any) {
    return this.notificationsService.markAllAsRead(user.userId);
  }

  @Get('test') // Changed to GET for easier browser testing if needed, or POST. keeping it simple.
  async triggerTest(@User() user: any) {
     return this.notificationsService.create(
        user.userId,
        'Test Notification',
        'This is a test notification to verify the system.',
        'SUCCESS'
     );
  }
}
