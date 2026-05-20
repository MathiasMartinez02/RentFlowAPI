import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActivityLogEntity {
  @ApiProperty() id: string;
  @ApiProperty() action: string;
  @ApiProperty() entityType: string;
  @ApiProperty() entityId: string;
  @ApiProperty() descripcion: string;
  @ApiPropertyOptional() metadata: unknown;
  @ApiProperty() userId: string;
  @ApiProperty() createdAt: Date;
}
