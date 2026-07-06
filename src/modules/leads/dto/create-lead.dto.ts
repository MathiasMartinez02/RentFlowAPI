import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { LeadOrigin } from '../../../common/enums/lead.enum';

export class CreateLeadDto {
  @ApiProperty({ example: 'Juan Pérez', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value?.trim())
  nombre: string;

  @ApiProperty({ example: 'juan.perez@email.com', maxLength: 150 })
  @IsEmail({}, { message: 'email debe ser una dirección de correo válida' })
  @MaxLength(150)
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({ example: '+54 11 9876-5432', maxLength: 30 })
  @IsString()
  @MaxLength(30)
  @Transform(({ value }: { value: string }) => value?.trim())
  telefono: string;

  @ApiPropertyOptional({ example: 'Me interesa la propiedad, ¿sigue disponible?' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: string }) => value?.trim())
  mensaje?: string;

  @ApiPropertyOptional({ example: 'clxyz_property_id', description: 'Propiedad de interés' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ enum: LeadOrigin, default: LeadOrigin.WEB })
  @IsOptional()
  @IsEnum(LeadOrigin)
  origen?: LeadOrigin;
}
