import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TenantStatus } from '../../../common/enums/tenant.enum';

export class CreateTenantDto {
  @ApiProperty({ example: 'Juan', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  nombre: string;

  @ApiProperty({ example: 'García', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  apellido: string;

  @ApiProperty({ example: 'juan.garcia@email.com', maxLength: 150 })
  @IsEmail({}, { message: 'email debe ser una dirección de correo válida' })
  @MaxLength(150)
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({ example: '+54 11 9876-5432', maxLength: 30 })
  @IsString()
  @MaxLength(30)
  @Transform(({ value }) => value?.trim())
  telefono: string;

  @ApiProperty({ example: '30123456', description: 'Número de documento nacional', maxLength: 20 })
  @IsString()
  @Matches(/^[0-9A-Za-z\-\.]+$/, {
    message: 'dni solo puede contener números, letras, guiones y puntos',
  })
  @MaxLength(20)
  @Transform(({ value }) => value?.trim())
  dni: string;

  @ApiPropertyOptional({ example: '1990-05-15', description: 'Fecha de nacimiento (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({}, { message: 'fechaNacimiento debe ser una fecha válida (YYYY-MM-DD)' })
  fechaNacimiento?: string;

  @ApiPropertyOptional({ example: 'Av. Corrientes 1234, Buenos Aires', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  direccion?: string;

  @ApiPropertyOptional({
    enum: TenantStatus,
    default: TenantStatus.PENDIENTE,
    description: 'Estado inicial del inquilino',
  })
  @IsOptional()
  @IsEnum(TenantStatus)
  estado?: TenantStatus;

  @ApiPropertyOptional({
    example: 'Buen pagador, empleado en relación de dependencia.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => value?.trim())
  observaciones?: string;

  @ApiPropertyOptional({
    example: 'clxyz_property_id',
    description: 'ID de la propiedad a asociar',
  })
  @IsOptional()
  @IsString()
  propertyId?: string;
}
