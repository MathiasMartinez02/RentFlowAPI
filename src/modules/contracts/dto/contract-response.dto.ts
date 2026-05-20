import { ApiProperty } from '@nestjs/swagger';
import { ContractEntity } from '../entities/contract.entity';

export class ContractResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Contrato creado correctamente' })
  message: string;

  @ApiProperty({ type: ContractEntity })
  data: ContractEntity;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}

class PaginatedContractsDataDto {
  @ApiProperty({ type: [ContractEntity] })
  items: ContractEntity[];

  @ApiProperty({ example: 8 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;
}

export class PaginatedContractsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Contratos recuperados correctamente' })
  message: string;

  @ApiProperty({ type: PaginatedContractsDataDto })
  data: PaginatedContractsDataDto;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}
