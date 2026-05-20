import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { PropertyType } from '../../../common/enums/property.enum';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Modern apartment in Palermo' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiPropertyOptional({ example: 'Spacious 2-bedroom apartment with pool access' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Av. Santa Fe 1234, Piso 3A' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Buenos Aires' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'CABA' })
  @IsString()
  state: string;

  @ApiProperty({ example: 'C1425' })
  @IsString()
  zipCode: string;

  @ApiPropertyOptional({ example: 'Argentina', default: 'Argentina' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ enum: PropertyType, example: PropertyType.APARTMENT })
  @IsEnum(PropertyType)
  type: PropertyType;

  @ApiProperty({ example: 2, minimum: 0 })
  @IsNumber()
  @Min(0)
  bedrooms: number;

  @ApiProperty({ example: 1, minimum: 0 })
  @IsNumber()
  @Min(0)
  bathrooms: number;

  @ApiProperty({ example: 65.5, description: 'Area in square meters' })
  @IsNumber()
  @IsPositive()
  area: number;

  @ApiProperty({ example: 150000, description: 'Monthly rent in ARS' })
  @IsNumber()
  @IsPositive()
  monthlyRent: number;

  @ApiPropertyOptional({ type: [String], example: ['https://...'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ type: [String], example: ['WiFi', 'Parking', 'Pool'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
}
