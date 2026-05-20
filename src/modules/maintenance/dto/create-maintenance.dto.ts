import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { MaintenancePriority } from '../../../common/enums/maintenance.enum';

export class CreateMaintenanceDto {
  @ApiProperty({ example: 'property-id-here' })
  @IsString()
  propertyId: string;

  @ApiProperty({ example: 'Broken water heater' })
  @IsString()
  @MinLength(5)
  title: string;

  @ApiProperty({ example: 'The water heater stopped working. No hot water available.' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ enum: MaintenancePriority, default: MaintenancePriority.MEDIUM })
  @IsEnum(MaintenancePriority)
  priority: MaintenancePriority;

  @ApiPropertyOptional({ example: 'plumbing', enum: ['plumbing', 'electrical', 'hvac', 'structural', 'appliances', 'other'] })
  @IsOptional()
  @IsString()
  category?: string;
}
