import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { TenantStatus } from '../../../common/enums/tenant.enum';

export enum SortByTenant {
  NOMBRE = 'nombre',
  APELLIDO = 'apellido',
  CREATED_AT = 'createdAt',
  ESTADO = 'estado',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class QueryTenantsDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: TenantStatus,
    description: 'Filtrar por estado del inquilino',
  })
  @IsOptional()
  @IsEnum(TenantStatus)
  estado?: TenantStatus;

  @ApiPropertyOptional({
    example: 'clxyz_property_id',
    description: 'Filtrar por propiedad asociada',
  })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({
    example: 'garcia',
    description: 'Buscar en nombre, apellido, email y DNI',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    enum: SortByTenant,
    default: SortByTenant.CREATED_AT,
    description: 'Campo por el cual ordenar',
  })
  @IsOptional()
  @IsEnum(SortByTenant)
  sortBy?: SortByTenant;

  @ApiPropertyOptional({
    enum: SortOrder,
    default: SortOrder.DESC,
    description: 'Dirección del ordenamiento',
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
