import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { MaintenanceStatus } from '../../../common/enums/maintenance.enum';
import { CreateMaintenanceDto } from './create-maintenance.dto';

export class UpdateMaintenanceDto extends PartialType(
  OmitType(CreateMaintenanceDto, ['propertyId', 'tenantId'] as const),
) {
  @ApiPropertyOptional({ enum: MaintenanceStatus })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  estado?: MaintenanceStatus;

  @ApiPropertyOptional({ example: 1800.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  costoFinal?: number;

  @ApiPropertyOptional({ example: '2024-03-15T10:00:00Z' })
  @IsOptional()
  @IsString()
  fechaResolucion?: string;

  @ApiPropertyOptional({ example: 'Se reemplazó la cañería dañada.' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  observaciones?: string;
}
