import { ApiProperty } from '@nestjs/swagger';
import { TenantEntity } from '../entities/tenant.entity';

export class TenantResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Inquilino creado correctamente' })
  message: string;

  @ApiProperty({ type: TenantEntity })
  data: TenantEntity;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}

class PaginatedTenantsDataDto {
  @ApiProperty({ type: [TenantEntity] })
  items: TenantEntity[];

  @ApiProperty({ example: 24 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class PaginatedTenantsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Inquilinos recuperados correctamente' })
  message: string;

  @ApiProperty({ type: PaginatedTenantsDataDto })
  data: PaginatedTenantsDataDto;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}
