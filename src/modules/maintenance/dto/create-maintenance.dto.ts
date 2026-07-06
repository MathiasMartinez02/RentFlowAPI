import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';
import { MaintenanceCategory, MaintenancePriority } from '../../../common/enums/maintenance.enum';

export class CreateMaintenanceDto {
  @ApiProperty({ example: 'property-id-here' })
  @IsString()
  propertyId: string;

  @ApiPropertyOptional({ example: 'tenant-id-here' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({ example: 'Fuga de agua en baño principal' })
  @IsString()
  @MinLength(5)
  @Transform(({ value }: { value: string }) => value?.trim())
  titulo: string;

  @ApiProperty({ example: 'Se detectó una fuga bajo el lavamanos del baño principal.' })
  @IsString()
  @MinLength(10)
  @Transform(({ value }: { value: string }) => value?.trim())
  descripcion: string;

  @ApiProperty({ enum: MaintenanceCategory, default: MaintenanceCategory.GENERAL })
  @IsEnum(MaintenanceCategory)
  categoria: MaintenanceCategory;

  @ApiProperty({ enum: MaintenancePriority, default: MaintenancePriority.MEDIA })
  @IsEnum(MaintenancePriority)
  prioridad: MaintenancePriority;

  @ApiPropertyOptional({ example: 1500.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  costoEstimado?: number;

  @ApiPropertyOptional({ example: 'Juan Pérez - plomero' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  assignedTo?: string;

  @ApiPropertyOptional({ example: 'Revisar también la llave de paso.' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  observaciones?: string;
}
