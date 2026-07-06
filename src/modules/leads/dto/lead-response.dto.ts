import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadEntity } from '../entities/lead.entity';

export class LeadResponseDto {
  @ApiProperty() message: string;
  @ApiProperty({ type: LeadEntity }) data: LeadEntity;
}

export class PaginatedLeadsResponseDto {
  @ApiProperty() message: string;
  @ApiProperty({
    type: 'object',
    properties: {
      items: { type: 'array', items: { $ref: '#/components/schemas/LeadEntity' } },
      total: { type: 'number' },
      page: { type: 'number' },
      limit: { type: 'number' },
      totalPages: { type: 'number' },
    },
  })
  data: unknown;
}

export class LeadStatsResponseDto {
  @ApiProperty() message: string;
  @ApiProperty({
    type: 'object',
    properties: {
      total: { type: 'number' },
      porEstado: { type: 'object' },
      tasaConversion: { type: 'number' },
    },
  })
  data: unknown;
}

export class LeadStatsDto {
  @ApiProperty() total: number;
  @ApiPropertyOptional({ type: 'object' }) porEstado: Record<string, number>;
  @ApiProperty() tasaConversion: number;
}
