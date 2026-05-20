import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationRepository } from './repositories/notification.repository';
import { ActivityRepository } from './repositories/activity.repository';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { CreateNotificationInput, CreateActivityInput } from './interfaces/notification.interface';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly gateway: NotificationsGateway,
  ) {}

  async notify(userId: string, input: CreateNotificationInput): Promise<void> {
    try {
      const notification = await this.notificationRepository.create(userId, input);
      this.gateway.emitToUser(userId, 'notification:new', notification);
    } catch (err) {
      this.logger.error(`Failed to create notification for user ${userId}`, err);
    }
  }

  async logActivity(userId: string, input: CreateActivityInput): Promise<void> {
    try {
      const activity = await this.activityRepository.create(userId, input);
      this.gateway.emitToUser(userId, 'activity:new', activity);
    } catch (err) {
      this.logger.error(`Failed to log activity for user ${userId}`, err);
    }
  }

  async findAll(userId: string, query: QueryNotificationsDto) {
    return this.notificationRepository.findMany(userId, query);
  }

  async countUnread(userId: string) {
    const count = await this.notificationRepository.countUnread(userId);
    return { count };
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepository.findById(id, userId);
    if (!notification) throw new NotFoundException(`Notificación ${id} no encontrada`);

    const updated = await this.notificationRepository.markAsRead(id);
    this.gateway.emitToUser(userId, 'notification:read', { id });
    return updated;
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.markAllAsRead(userId);
    this.gateway.emitToUser(userId, 'notification:read', { all: true });
  }
}
