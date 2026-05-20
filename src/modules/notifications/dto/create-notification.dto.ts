import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { NotificationPriority, NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ example: 'Pago recibido' })
  @IsString()
  @MinLength(3)
  titulo: string;

  @ApiProperty({ example: 'Se registró el pago del período 2024-03' })
  @IsString()
  @MinLength(5)
  mensaje: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  tipo: NotificationType;

  @ApiPropertyOptional({ enum: NotificationPriority, default: NotificationPriority.MEDIUM })
  @IsOptional()
  @IsEnum(NotificationPriority)
  prioridad?: NotificationPriority;

  @ApiPropertyOptional({ example: { paymentId: 'abc123' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
