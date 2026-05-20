import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { buildPaginatedResult, getPaginationMeta } from '../../../common/utils/pagination.util';
import { CreateActivityInput } from '../interfaces/notification.interface';
import { QueryActivityDto, SortOrder } from '../dto/query-activity.dto';

@Injectable()
export class ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateActivityInput) {
    return this.prisma.activityLog.create({
      data: {
        userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        descripcion: input.descripcion,
        metadata: input.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async findMany(userId: string, query: QueryActivityDto) {
    const { skip, take, page, limit } = getPaginationMeta(query);
    const where = this.buildWhere(userId, query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: query.sortOrder ?? SortOrder.DESC },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  private buildWhere(userId: string, query: QueryActivityDto): Prisma.ActivityLogWhereInput {
    const where: Prisma.ActivityLogWhereInput = { userId };
    if (query.entityType) where.entityType = query.entityType;
    if (query.action) where.action = query.action;
    if (query.search) {
      where.OR = [
        { descripcion: { contains: query.search } },
        { action: { contains: query.search } },
        { entityType: { contains: query.search } },
      ];
    }
    return where;
  }
}
