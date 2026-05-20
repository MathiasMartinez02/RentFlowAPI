import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Overview ─────────────────────────────────────────────────

class PropertyMetricsDto {
  @ApiProperty() total: number;
  @ApiProperty() ocupadas: number;
  @ApiProperty() disponibles: number;
  @ApiProperty() enMantenimiento: number;
  @ApiProperty({ description: 'Porcentaje de ocupación (0-100)' }) occupancyRate: number;
}

class ContractMetricsDto {
  @ApiProperty() activos: number;
  @ApiProperty({ description: 'Contratos que vencen en los próximos 30 días' }) porVencer: number;
  @ApiProperty() vencidos: number;
}

class PaymentMetricsDto {
  @ApiProperty() pendientes: number;
  @ApiProperty() vencidos: number;
  @ApiProperty() pagados: number;
  @ApiProperty() montoPendiente: number;
  @ApiProperty() montoVencido: number;
  @ApiProperty() moraTotalVencida: number;
  @ApiProperty() ingresosMesActual: number;
  @ApiProperty() ingresosTotales: number;
  @ApiProperty({ description: 'Porcentaje de cobranza (0-100)' }) collectionRate: number;
}

class MaintenanceMetricsDto {
  @ApiProperty() abiertos: number;
  @ApiProperty() urgentes: number;
  @ApiProperty() resueltosMes: number;
  @ApiProperty() costosTotales: number;
}

export class DashboardOverviewDto {
  @ApiProperty({ type: PropertyMetricsDto }) propiedades: PropertyMetricsDto;
  @ApiProperty({ type: ContractMetricsDto }) contratos: ContractMetricsDto;
  @ApiProperty({ type: PaymentMetricsDto }) pagos: PaymentMetricsDto;
  @ApiProperty({ type: MaintenanceMetricsDto }) mantenimiento: MaintenanceMetricsDto;
}

// ─── Revenue ──────────────────────────────────────────────────

class MonthlyRevenueDto {
  @ApiProperty({ example: '2024-03' }) mes: string;
  @ApiProperty({ example: 'Mar 2024' }) mesLabel: string;
  @ApiProperty() ingresos: number;
  @ApiProperty() cantidadPagos: number;
}

class ComparativaAnualDto {
  @ApiProperty() anioActual: number;
  @ApiProperty() anioAnterior: number;
  @ApiProperty({ description: 'Porcentaje de crecimiento vs año anterior' }) crecimiento: number;
}

export class RevenueAnalyticsDto {
  @ApiProperty({ type: [MonthlyRevenueDto] }) ultimos12Meses: MonthlyRevenueDto[];
  @ApiProperty({ type: ComparativaAnualDto }) comparativaAnual: ComparativaAnualDto;
  @ApiProperty() promedioMensual: number;
  @ApiPropertyOptional({ type: MonthlyRevenueDto }) mejorMes: MonthlyRevenueDto | null;
  @ApiProperty() totalPeriodo: number;
}

// ─── Occupancy ────────────────────────────────────────────────

class OccupancyByTypeDto {
  @ApiProperty() tipo: string;
  @ApiProperty() total: number;
  @ApiProperty() ocupadas: number;
  @ApiProperty() disponibles: number;
  @ApiProperty() rate: number;
}

export class OccupancyAnalyticsDto {
  @ApiProperty() occupancyRate: number;
  @ApiProperty() totalPropiedades: number;
  @ApiProperty() ocupadas: number;
  @ApiProperty() disponibles: number;
  @ApiProperty() enMantenimiento: number;
  @ApiProperty({ type: [OccupancyByTypeDto] }) distribucionPorTipo: OccupancyByTypeDto[];
}

// ─── Payments ─────────────────────────────────────────────────

class PaymentConteosDto {
  @ApiProperty() pendientes: number;
  @ApiProperty() vencidos: number;
  @ApiProperty() pagados: number;
  @ApiProperty() parciales: number;
  @ApiProperty() cancelados: number;
}

class PaymentMontosDto {
  @ApiProperty() montoPendiente: number;
  @ApiProperty() montoVencido: number;
  @ApiProperty() moraTotalVencida: number;
  @ApiProperty() totalCobrado: number;
}

class PaymentUltimos30Dto {
  @ApiProperty() cobrado: number;
  @ApiProperty() pendiente: number;
  @ApiProperty() cantidadPagos: number;
}

class PaymentByMethodDto {
  @ApiProperty() metodo: string;
  @ApiProperty() cantidad: number;
  @ApiProperty() total: number;
}

export class PaymentsAnalyticsDto {
  @ApiProperty({ type: PaymentConteosDto }) conteos: PaymentConteosDto;
  @ApiProperty({ type: PaymentMontosDto }) montos: PaymentMontosDto;
  @ApiProperty({ description: 'Porcentaje de cobranza (0-100)' }) collectionRate: number;
  @ApiProperty({ type: PaymentUltimos30Dto }) ultimos30Dias: PaymentUltimos30Dto;
  @ApiProperty({ type: [PaymentByMethodDto] }) porMetodoPago: PaymentByMethodDto[];
}

// ─── Maintenance ──────────────────────────────────────────────

class MaintenanceTicketsDto {
  @ApiProperty() abiertos: number;
  @ApiProperty() urgentes: number;
  @ApiProperty() resueltos: number;
  @ApiProperty() cerrados: number;
  @ApiProperty() total: number;
}

class MaintenanceCostosDto {
  @ApiProperty() costosTotales: number;
  @ApiProperty() costoEstimadoAbiertos: number;
  @ApiProperty() costosUltimos30Dias: number;
}

class MaintenanceByCategoryDto {
  @ApiProperty() categoria: string;
  @ApiProperty() cantidad: number;
  @ApiProperty() costoTotal: number;
}

class MaintenanceByPriorityDto {
  @ApiProperty() prioridad: string;
  @ApiProperty() cantidad: number;
}

export class MaintenanceAnalyticsDto {
  @ApiProperty({ type: MaintenanceTicketsDto }) tickets: MaintenanceTicketsDto;
  @ApiProperty({ type: MaintenanceCostosDto }) costos: MaintenanceCostosDto;
  @ApiPropertyOptional({ nullable: true }) promedioResolucionDias: number | null;
  @ApiProperty({ type: [MaintenanceByCategoryDto] }) porCategoria: MaintenanceByCategoryDto[];
  @ApiProperty({ type: [MaintenanceByPriorityDto] }) porPrioridad: MaintenanceByPriorityDto[];
}
