import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateContractDto {
  @ApiProperty({ example: 'property-id-here' })
  @IsString()
  propertyId: string;

  @ApiProperty({ example: 'tenant-id-here' })
  @IsString()
  tenantId: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ example: '2025-01-01' })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiProperty({ example: 150000, description: 'Monthly rent in ARS' })
  @IsNumber()
  @IsPositive()
  monthlyRent: number;

  @ApiProperty({ example: 300000, description: 'Security deposit in ARS' })
  @IsNumber()
  @IsPositive()
  deposit: number;

  @ApiPropertyOptional({ example: 'Standard rental agreement terms...' })
  @IsOptional()
  @IsString()
  terms?: string;
}
