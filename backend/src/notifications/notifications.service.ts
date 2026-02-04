import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway
  ) {}

  async create(userId: string, title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO') {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });

    this.eventsGateway.emitNotification(userId, notification);
    return notification;
  }

  async findAll(userId: string, unreadOnly: boolean = false) {
    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to recent 50
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    // Verify ownership implicitly via updateMany or check first. 
    // updateMany is safer for auth checks but keys are unique anyway.
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId,
      },
      data: {
        read: true,
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOldNotifications() {
    // Delete notifications older than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = await this.prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: oneDayAgo,
        },
      },
    });
    if (result.count > 0) {
        console.log(`[Notifications] Cleaned up ${result.count} old notifications`);
    }
  }
}
