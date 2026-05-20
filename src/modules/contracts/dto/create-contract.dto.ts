import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ContractStatus } from '../../../common/enums/contract.enum';

export class CreateContractDto {
  @ApiProperty({ example: 'clxyz_property_id', description: 'ID de la propiedad' })
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @ApiProperty({ example: 'clxyz_tenant_id', description: 'ID del inquilino' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty({ example: '2024-01-01', description: 'Fecha de inicio del contrato (YYYY-MM-DD)' })
  @IsDateString({}, { message: 'fechaInicio debe ser una fecha válida (YYYY-MM-DD)' })
  fechaInicio: string;

  @ApiProperty({ example: '2025-01-01', description: 'Fecha de fin del contrato (YYYY-MM-DD)' })
  @IsDateString({}, { message: 'fechaFin debe ser una fecha válida (YYYY-MM-DD)' })
  fechaFin: string;

  @ApiProperty({ example: 180000, description: 'Monto mensual en ARS', minimum: 1 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  montoMensual: number;

  @ApiProperty({ example: 360000, description: 'Depósito de garantía en ARS', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  deposito: number;

  @ApiPropertyOptional({ example: 15000, description: 'Expensas mensuales en ARS', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  expensas?: number;

  @ApiPropertyOptional({ example: false, description: 'Si el contrato se renueva automáticamente' })
  @IsOptional()
  @IsBoolean()
  renovacionAutomatica?: boolean;

  @ApiPropertyOptional({
    enum: ContractStatus,
    default: ContractStatus.ACTIVO,
    description: 'Estado inicial del contrato',
  })
  @IsOptional()
  @IsEnum(ContractStatus)
  estado?: ContractStatus;

  @ApiPropertyOptional({
    example: 'Contrato bajo ley 23.091. Ajuste semestral por IPC.',
    description: 'Observaciones y condiciones adicionales',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => value?.trim())
  observaciones?: string;
}
