import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { buildPaginatedResult, getPaginationMeta } from '../../common/utils/pagination.util';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.GENERAL,
    metadata?: Record<string, any>,
  ) {
    return this.prisma.notification.create({
      data: { userId, title, message, type, metadata },
    });
  }

  async findAll(userId: string, pagination: PaginationDto) {
    const { skip, take, page, limit } = getPaginationMeta(pagination);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);

    return {
      message: 'Notifications retrieved successfully',
      data: buildPaginatedResult(items, total, page, limit),
    };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw new NotFoundException('Notification not found');

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return { message: 'Notification marked as read', data: updated };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { message: 'All notifications marked as read', data: null };
  }

  async countUnread(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, isRead: false } });
    return { message: 'Unread count retrieved', data: { count } };
  }
}
