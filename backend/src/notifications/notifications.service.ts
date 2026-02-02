import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, title: string, message: string, type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' = 'INFO') {
    return this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
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
}
