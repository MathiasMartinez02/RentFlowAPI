export interface IPropertyMetrics {
  total: number;
  ocupadas: number;
  disponibles: number;
  enMantenimiento: number;
  occupancyRate: number;
}

export interface IContractMetrics {
  activos: number;
  porVencer: number;
  vencidos: number;
}

export interface IPaymentMetrics {
  pendientes: number;
  vencidos: number;
  pagados: number;
  montoPendiente: number;
  montoVencido: number;
  moraTotalVencida: number;
  ingresosMesActual: number;
  ingresosTotales: number;
  collectionRate: number;
}

export interface IMaintenanceMetrics {
  abiertos: number;
  urgentes: number;
  resueltosMes: number;
  costosTotales: number;
}

export interface IDashboardOverview {
  propiedades: IPropertyMetrics;
  contratos: IContractMetrics;
  pagos: IPaymentMetrics;
  mantenimiento: IMaintenanceMetrics;
}

export interface IMonthlyRevenue {
  mes: string;
  mesLabel: string;
  ingresos: number;
  cantidadPagos: number;
}

export interface IRevenueAnalytics {
  ultimos12Meses: IMonthlyRevenue[];
  comparativaAnual: {
    anioActual: number;
    anioAnterior: number;
    crecimiento: number;
  };
  promedioMensual: number;
  mejorMes: IMonthlyRevenue | null;
  totalPeriodo: number;
}

export interface IOccupancyByType {
  tipo: string;
  total: number;
  ocupadas: number;
  disponibles: number;
  rate: number;
}

export interface IOccupancyAnalytics {
  occupancyRate: number;
  totalPropiedades: number;
  ocupadas: number;
  disponibles: number;
  enMantenimiento: number;
  distribucionPorTipo: IOccupancyByType[];
}

export interface IPaymentsByMethod {
  metodo: string;
  cantidad: number;
  total: number;
}

export interface IPaymentsAnalytics {
  conteos: {
    pendientes: number;
    vencidos: number;
    pagados: number;
    parciales: number;
    cancelados: number;
  };
  montos: {
    montoPendiente: number;
    montoVencido: number;
    moraTotalVencida: number;
    totalCobrado: number;
  };
  collectionRate: number;
  ultimos30Dias: {
    cobrado: number;
    pendiente: number;
    cantidadPagos: number;
  };
  porMetodoPago: IPaymentsByMethod[];
}

export interface IMaintenanceByCategory {
  categoria: string;
  cantidad: number;
  costoTotal: number;
}

export interface IMaintenanceByPriority {
  prioridad: string;
  cantidad: number;
}

export interface IMaintenanceAnalytics {
  tickets: {
    abiertos: number;
    urgentes: number;
    resueltos: number;
    cerrados: number;
    total: number;
  };
  costos: {
    costosTotales: number;
    costoEstimadoAbiertos: number;
    costosUltimos30Dias: number;
  };
  promedioResolucionDias: number | null;
  porCategoria: IMaintenanceByCategory[];
  porPrioridad: IMaintenanceByPriority[];
}

export interface IRecentActivity {
  pagosRecientes: unknown[];
  contratosRecientes: unknown[];
  ticketsRecientes: unknown[];
  actividadesRecientes: unknown[];
}
