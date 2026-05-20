import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PropertyType } from '../../../common/enums/property.enum';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Departamento en Palermo', minLength: 3, maxLength: 150 })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  @Transform(({ value }) => value?.trim())
  nombre: string;

  @ApiPropertyOptional({ example: 'Luminoso 2 ambientes con balcón y amenities.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => value?.trim())
  descripcion?: string;

  @ApiProperty({ example: 'Av. Santa Fe 3250 Piso 4 B', maxLength: 200 })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  direccion: string;

  @ApiProperty({ example: 'Buenos Aires', maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  ciudad: string;

  @ApiProperty({ example: 'CABA', maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  provincia: string;

  @ApiProperty({ example: 'C1425BHH', maxLength: 20 })
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  codigoPostal: string;

  @ApiPropertyOptional({ example: 'Argentina', default: 'Argentina', maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Transform(({ value }) => value?.trim())
  pais?: string;

  @ApiProperty({ enum: PropertyType, example: PropertyType.APARTAMENTO })
  @IsEnum(PropertyType)
  tipoPropiedad: PropertyType;

  @ApiProperty({ example: 180000, description: 'Precio mensual en ARS', minimum: 1 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  precioMensual: number;

  @ApiPropertyOptional({ example: 15000, description: 'Expensas mensuales en ARS', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  expensas?: number;

  @ApiProperty({ example: 2, minimum: 0, maximum: 50 })
  @IsInt()
  @Min(0)
  habitaciones: number;

  @ApiProperty({ example: 1, minimum: 0, maximum: 20 })
  @IsInt()
  @Min(0)
  banos: number;

  @ApiProperty({ example: 65.5, description: 'Superficie en m²', minimum: 1 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  metrosCuadrados: number;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/prop-1.jpg' })
  @IsOptional()
  @IsUrl({}, { message: 'imagenPrincipal debe ser una URL válida' })
  @MaxLength(500)
  imagenPrincipal?: string;
}
