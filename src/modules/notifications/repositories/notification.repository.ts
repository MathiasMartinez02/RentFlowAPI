import { Injectable } from '@nestjs/common';
import { NotificationPriority, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { buildPaginatedResult, getPaginationMeta } from '../../../common/utils/pagination.util';
import { CreateNotificationInput } from '../interfaces/notification.interface';
import { QueryNotificationsDto } from '../dto/query-notifications.dto';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        userId,
        titulo: input.titulo,
        mensaje: input.mensaje,
        tipo: input.tipo as NotificationType,
        prioridad: (input.prioridad ?? NotificationPriority.MEDIUM) as NotificationPriority,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async findMany(userId: string, query: QueryNotificationsDto) {
    const { skip, take, page, limit } = getPaginationMeta(query);
    const where = this.buildWhere(userId, query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  async findById(id: string, userId: string) {
    return this.prisma.notification.findFirst({ where: { id, userId } });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { leida: true } });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, leida: false },
      data: { leida: true },
    });
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, leida: false } });
  }

  private buildWhere(userId: string, query: QueryNotificationsDto): Prisma.NotificationWhereInput {
    const where: Prisma.NotificationWhereInput = { userId };
    if (query.tipo) where.tipo = query.tipo as NotificationType;
    if (query.prioridad) where.prioridad = query.prioridad as NotificationPriority;
    if (query.leida !== undefined) where.leida = query.leida;
    return where;
  }
}
