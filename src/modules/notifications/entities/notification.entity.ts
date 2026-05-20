import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationEntity {
  @ApiProperty() id: string;
  @ApiProperty() titulo: string;
  @ApiProperty() mensaje: string;
  @ApiProperty() tipo: string;
  @ApiProperty() prioridad: string;
  @ApiProperty() leida: boolean;
  @ApiPropertyOptional() metadata: unknown;
  @ApiProperty() userId: string;
  @ApiProperty() createdAt: Date;
}
