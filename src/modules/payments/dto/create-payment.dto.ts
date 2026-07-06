import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../../../common/enums/payment.enum';

export class CreatePaymentDto {
  @ApiProperty({ example: 'clxyz_contract_id', description: 'ID del contrato asociado' })
  @IsString()
  @IsNotEmpty()
  contractId: string;

  @ApiProperty({
    example: '2024-01',
    description: 'Período de pago en formato YYYY-MM',
    pattern: '^\\d{4}-(0[1-9]|1[0-2])$',
  })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'periodo debe tener formato YYYY-MM (ej: 2024-01)',
  })
  periodo: string;

  @ApiProperty({ example: '2024-01-05', description: 'Fecha límite de pago' })
  @IsDateString({}, { message: 'fechaVencimiento debe ser una fecha válida' })
  fechaVencimiento: string;

  @ApiPropertyOptional({ example: '2024-01-03', description: 'Fecha en que se realizó el pago' })
  @IsOptional()
  @IsDateString({}, { message: 'fechaPago debe ser una fecha válida' })
  fechaPago?: string;

  @ApiProperty({ example: 180000, description: 'Monto del alquiler en ARS', minimum: 1 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  monto: number;

  @ApiPropertyOptional({ example: 9000, description: 'Mora por pago tardío en ARS', minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  mora?: number;

  @ApiPropertyOptional({
    example: 189000,
    description: 'Monto total efectivamente pagado en ARS',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  totalPagado?: number;

  @ApiPropertyOptional({ enum: PaymentMethod, description: 'Método de pago utilizado' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  metodoPago?: PaymentMethod;

  @ApiPropertyOptional({
    example: 'TRF-20240103-001',
    description: 'Número de referencia o comprobante',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  referenciaPago?: string;

  @ApiPropertyOptional({
    enum: PaymentStatus,
    default: PaymentStatus.PENDIENTE,
    description: 'Estado inicial del pago',
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  estado?: PaymentStatus;

  @ApiPropertyOptional({ example: 'Pago realizado con anticipación.', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }) => value?.trim())
  observaciones?: string;
}
