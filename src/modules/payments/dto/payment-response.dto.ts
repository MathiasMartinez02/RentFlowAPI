import { ApiProperty } from '@nestjs/swagger';
import { PaymentEntity, PaymentStatsEntity } from '../entities/payment.entity';

export class PaymentResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Pago registrado correctamente' })
  message: string;

  @ApiProperty({ type: PaymentEntity })
  data: PaymentEntity;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}

class PaginatedPaymentsDataDto {
  @ApiProperty({ type: [PaymentEntity] })
  items: PaymentEntity[];

  @ApiProperty({ example: 24 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class PaginatedPaymentsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Pagos recuperados correctamente' })
  message: string;

  @ApiProperty({ type: PaginatedPaymentsDataDto })
  data: PaginatedPaymentsDataDto;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}

export class PaymentStatsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Métricas financieras recuperadas correctamente' })
  message: string;

  @ApiProperty({ type: PaymentStatsEntity })
  data: PaymentStatsEntity;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}
