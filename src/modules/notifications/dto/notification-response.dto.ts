import { ApiProperty } from '@nestjs/swagger';
import { NotificationEntity } from '../entities/notification.entity';
import { ActivityLogEntity } from '../entities/activity-log.entity';

export class NotificationResponseDto {
  @ApiProperty() message: string;
  @ApiProperty({ type: NotificationEntity }) data: NotificationEntity;
}

export class PaginatedNotificationsResponseDto {
  @ApiProperty() message: string;
  @ApiProperty({
    type: 'object',
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/NotificationEntity' } },
      total: { type: 'number' },
      page: { type: 'number' },
      limit: { type: 'number' },
      totalPages: { type: 'number' },
    },
  })
  data: unknown;
}

export class UnreadCountResponseDto {
  @ApiProperty() message: string;
  @ApiProperty({ type: 'object', properties: { count: { type: 'number' } } })
  data: { count: number };
}

export class PaginatedActivityResponseDto {
  @ApiProperty() message: string;
  @ApiProperty({
    type: 'object',
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/ActivityLogEntity' } },
      total: { type: 'number' },
      page: { type: 'number' },
      limit: { type: 'number' },
      totalPages: { type: 'number' },
    },
  })
  data: unknown;
}
