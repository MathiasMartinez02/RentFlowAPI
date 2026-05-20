import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PaymentMethod, PaymentStatus } from '../../../common/enums/payment.enum';

export enum SortByPayment {
  FECHA_VENCIMIENTO = 'fechaVencimiento',
  FECHA_PAGO = 'fechaPago',
  MONTO = 'monto',
  CREATED_AT = 'createdAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class QueryPaymentsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: PaymentStatus, description: 'Filtrar por estado del pago' })
  @IsOptional()
  @IsEnum(PaymentStatus)
  estado?: PaymentStatus;

  @ApiPropertyOptional({ enum: PaymentMethod, description: 'Filtrar por método de pago' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  metodoPago?: PaymentMethod;

  @ApiPropertyOptional({ example: 'clxyz_contract_id', description: 'Filtrar por contrato' })
  @IsOptional()
  @IsString()
  contractId?: string;

  @ApiPropertyOptional({ example: 'clxyz_tenant_id', description: 'Filtrar por inquilino' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ example: 'clxyz_property_id', description: 'Filtrar por propiedad' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({
    example: '2024-01',
    description: 'Buscar por período, referencia, nombre de inquilino o propiedad',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Transform(({ value }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({
    enum: SortByPayment,
    default: SortByPayment.FECHA_VENCIMIENTO,
    description: 'Campo por el cual ordenar',
  })
  @IsOptional()
  @IsEnum(SortByPayment)
  sortBy?: SortByPayment;

  @ApiPropertyOptional({
    enum: SortOrder,
    default: SortOrder.DESC,
    description: 'Dirección del ordenamiento',
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}
