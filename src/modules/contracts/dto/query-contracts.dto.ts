import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { ContractStatus } from '../../../common/enums/contract.enum';

export enum SortByContract {
  CREATED_AT = 'createdAt',
  FECHA_INICIO = 'fechaInicio',
  FECHA_FIN = 'fechaFin',
  MONTO_MENSUAL = 'montoMensual',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class QueryContractsDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: ContractStatus,
    description: 'Filtrar por estado del contrato',
  })
  @IsOptional()
  @IsEnum(ContractStatus)
  estado?: ContractStatus;

  @ApiPropertyOptional({ example: 'clxyz_property_id', description: 'Filtrar por propiedad' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ example: 'clxyz_tenant_id', description: 'Filtrar por inquilino' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({
    example: 'CTR-2024',
    description: 'Buscar por código, nombre de propiedad o nombre/apellido de inquilino',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    enum: SortByContract,
    default: SortByContract.CREATED_AT,
    description: 'Campo por el cual ordenar',
  })
  @IsOptional()
  @IsEnum(SortByContract)
  sortBy?: SortByContract;

  @ApiPropertyOptional({
    enum: SortOrder,
    default: SortOrder.DESC,
    description: 'Dirección del ordenamiento',
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
