import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PropertyStatus, PropertyType } from '../../../common/enums/property.enum';

export enum SortByProperty {
  NOMBRE = 'nombre',
  PRECIO_MENSUAL = 'precioMensual',
  CREATED_AT = 'createdAt',
  CIUDAD = 'ciudad',
  METROS = 'metrosCuadrados',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class QueryPropertiesDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: PropertyStatus,
    description: 'Filtrar por estado de la propiedad',
  })
  @IsOptional()
  @IsEnum(PropertyStatus)
  estado?: PropertyStatus;

  @ApiPropertyOptional({
    enum: PropertyType,
    description: 'Filtrar por tipo de propiedad',
  })
  @IsOptional()
  @IsEnum(PropertyType)
  tipoPropiedad?: PropertyType;

  @ApiPropertyOptional({ example: 'Buenos Aires', description: 'Filtrar por ciudad' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  ciudad?: string;

  @ApiPropertyOptional({
    example: 'palermo',
    description: 'Buscar en nombre, dirección, ciudad y provincia',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    example: 100000,
    description: 'Precio mensual mínimo en ARS',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  precioMin?: number;

  @ApiPropertyOptional({
    example: 500000,
    description: 'Precio mensual máximo en ARS',
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  precioMax?: number;

  @ApiPropertyOptional({
    enum: SortByProperty,
    default: SortByProperty.CREATED_AT,
    description: 'Campo por el cual ordenar',
  })
  @IsOptional()
  @IsEnum(SortByProperty)
  sortBy?: SortByProperty;

  @ApiPropertyOptional({
    enum: SortOrder,
    default: SortOrder.DESC,
    description: 'Dirección del ordenamiento',
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
