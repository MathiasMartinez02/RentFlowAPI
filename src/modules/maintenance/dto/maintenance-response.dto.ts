import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaintenanceEntity } from '../entities/maintenance.entity';

export class MaintenanceResponseDto {
  @ApiProperty() message: string;
  @ApiProperty({ type: MaintenanceEntity }) data: MaintenanceEntity;
}

export class PaginatedMaintenanceResponseDto {
  @ApiProperty() message: string;
  @ApiProperty({
    type: 'object',
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/MaintenanceEntity' } },
      total: { type: 'number' },
      page: { type: 'number' },
      limit: { type: 'number' },
      totalPages: { type: 'number' },
    },
  })
  data: unknown;
}

export class MaintenanceStatsResponseDto {
  @ApiProperty() message: string;
  @ApiProperty({
    type: 'object',
    properties: {
      ticketsAbiertos: { type: 'number' },
      ticketsUrgentes: { type: 'number' },
      ticketsResueltos: { type: 'number' },
      tiempoPromedioResolucion: { type: 'number', nullable: true },
      costosTotales: { type: 'number' },
    },
  })
  data: unknown;
}

export class MaintenanceStatsDto {
  @ApiProperty() ticketsAbiertos: number;
  @ApiProperty() ticketsUrgentes: number;
  @ApiProperty() ticketsResueltos: number;
  @ApiPropertyOptional({ nullable: true }) tiempoPromedioResolucion: number | null;
  @ApiProperty() costosTotales: number;
}
