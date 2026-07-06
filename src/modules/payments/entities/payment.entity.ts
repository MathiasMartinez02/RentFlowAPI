import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentStatus } from '../../../common/enums/payment.enum';

class NestedContractInPayment {
  @ApiProperty({ example: 'clxyz_contract_id' }) id: string;
  @ApiProperty({ example: 'CTR-2024-K7MNP' }) codigoContrato: string;
}

class NestedTenantInPayment {
  @ApiProperty({ example: 'clxyz_tenant_id' }) id: string;
  @ApiProperty({ example: 'Juan' }) nombre: string;
  @ApiProperty({ example: 'García' }) apellido: string;
  @ApiProperty({ example: 'juan.garcia@email.com' }) email: string;
}

class NestedPropertyInPayment {
  @ApiProperty({ example: 'clxyz_property_id' }) id: string;
  @ApiProperty({ example: 'Departamento en Palermo' }) nombre: string;
  @ApiProperty({ example: 'Buenos Aires' }) ciudad: string;
}

export class PaymentEntity {
  @ApiProperty({ example: 'clxyz123abc' })
  id: string;

  @ApiProperty({ example: '2024-01', description: 'Período en formato YYYY-MM' })
  periodo: string;

  @ApiProperty({ example: '2024-01-05T00:00:00.000Z' })
  fechaVencimiento: Date;

  @ApiPropertyOptional({ example: '2024-01-03T00:00:00.000Z', nullable: true })
  fechaPago: Date | null;

  @ApiProperty({ example: 180000, description: 'Monto del alquiler en ARS' })
  monto: number;

  @ApiPropertyOptional({ example: 9000, description: 'Mora calculada en ARS', nullable: true })
  mora: number | null;

  @ApiPropertyOptional({
    example: 189000,
    description: 'Total efectivamente pagado en ARS',
    nullable: true,
  })
  totalPagado: number | null;

  @ApiPropertyOptional({ enum: PaymentMethod, nullable: true })
  metodoPago: PaymentMethod | null;

  @ApiPropertyOptional({ example: 'TRF-20240103-001', nullable: true })
  referenciaPago: string | null;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDIENTE })
  estado: PaymentStatus;

  @ApiPropertyOptional({ example: 'Pago con 2 días de anticipación.', nullable: true })
  observaciones: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 'clxyz_owner_id' })
  ownerId: string;

  @ApiProperty({ example: 'clxyz_contract_id' })
  contractId: string;

  @ApiProperty({ example: 'clxyz_tenant_id' })
  tenantId: string;

  @ApiProperty({ example: 'clxyz_property_id' })
  propertyId: string;

  @ApiPropertyOptional({ type: NestedContractInPayment })
  contract?: NestedContractInPayment;

  @ApiPropertyOptional({ type: NestedTenantInPayment })
  tenant?: NestedTenantInPayment;

  @ApiPropertyOptional({ type: NestedPropertyInPayment })
  property?: NestedPropertyInPayment;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-03T10:30:00.000Z' })
  updatedAt: Date;
}

export class PaymentStatsEntity {
  @ApiProperty({ example: 540000, description: 'Total cobrado en el mes actual en ARS' })
  totalCobradoMes: number;

  @ApiProperty({ example: 3 })
  pagosPendientes: number;

  @ApiProperty({ example: 1 })
  pagosVencidos: number;

  @ApiProperty({ example: 2160000, description: 'Ingresos totales históricos en ARS' })
  ingresosTotales: number;

  @ApiProperty({ example: 75.5, description: 'Porcentaje de pagos cobrados vs esperados' })
  porcentajeCobranza: number;

  @ApiProperty({ example: 360000, description: 'Suma de montos pendientes en ARS' })
  montoPendiente: number;

  @ApiProperty({ example: 180000, description: 'Suma de montos vencidos en ARS' })
  montoVencido: number;
}
