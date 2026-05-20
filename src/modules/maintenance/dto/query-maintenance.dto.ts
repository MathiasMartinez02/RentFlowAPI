import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
} from '../../../common/enums/maintenance.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export enum SortByMaintenance {
  CREATED_AT = 'createdAt',
  PRIORIDAD = 'prioridad',
  ESTADO = 'estado',
  FECHA_RESOLUCION = 'fechaResolucion',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class QueryMaintenanceDto extends PaginationDto {
  @ApiPropertyOptional({ enum: MaintenanceStatus })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  estado?: MaintenanceStatus;

  @ApiPropertyOptional({ enum: MaintenancePriority })
  @IsOptional()
  @IsEnum(MaintenancePriority)
  prioridad?: MaintenancePriority;

  @ApiPropertyOptional({ enum: MaintenanceCategory })
  @IsOptional()
  @IsEnum(MaintenanceCategory)
  categoria?: MaintenanceCategory;

  @ApiPropertyOptional({ example: 'property-id-here' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ example: 'tenant-id-here' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ example: 'fuga agua' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({ enum: SortByMaintenance, default: SortByMaintenance.CREATED_AT })
  @IsOptional()
  @IsEnum(SortByMaintenance)
  sortBy?: SortByMaintenance;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
