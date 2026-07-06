import { Injectable, Logger } from '@nestjs/common';
import {
  ContractStatus,
  MaintenancePriority,
  MaintenanceStatus,
  PaymentMethod,
  PaymentStatus,
  PropertyStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  IDashboardOverview,
  IMaintenanceAnalytics,
  IOccupancyAnalytics,
  IPaymentsAnalytics,
  IRecentActivity,
  IRevenueAnalytics,
} from './interfaces/dashboard.interface';

const MESES_ES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Overview ───────────────────────────────────────────────

  async getOverview(ownerId: string | undefined): Promise<IDashboardOverview> {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const firstDayThisMonth30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const openStates: MaintenanceStatus[] = [
      MaintenanceStatus.PENDIENTE,
      MaintenanceStatus.EN_PROGRESO,
      MaintenanceStatus.ESPERANDO_REPUESTOS,
    ];

    const [
      totalProps,
      ocupadasProps,
      disponiblesProps,
      mantenimientoProps,
      activosContratos,
      porVencerContratos,
      vencidosContratos,
      [pendientesPagos, vencidosPagos, pagadosPagos],
      ingresosMesAgg,
      ingresosTotalesAgg,
      montoPendienteAgg,
      montoVencidoAgg,
      moraVencidaAgg,
      ticketsAbiertos,
      ticketsUrgentes,
      ticketsResueltosMes,
      costosMaintAgg,
    ] = await Promise.all([
      this.prisma.property.count({ where: { ...(ownerId && { ownerId }), isActive: true } }),
      this.prisma.property.count({
        where: { ownerId, isActive: true, estado: PropertyStatus.OCUPADA },
      }),
      this.prisma.property.count({
        where: { ownerId, isActive: true, estado: PropertyStatus.DISPONIBLE },
      }),
      this.prisma.property.count({
        where: { ownerId, isActive: true, estado: PropertyStatus.MANTENIMIENTO },
      }),
      this.prisma.contract.count({
        where: { ownerId, isActive: true, estado: ContractStatus.ACTIVO },
      }),
      this.prisma.contract.count({
        where: {
          ownerId,
          isActive: true,
          estado: ContractStatus.ACTIVO,
          fechaFin: { lte: thirtyDaysLater },
        },
      }),
      this.prisma.contract.count({
        where: { ownerId, isActive: true, estado: ContractStatus.VENCIDO },
      }),
      this.prisma.$transaction([
        this.prisma.payment.count({
          where: { ownerId, isActive: true, estado: PaymentStatus.PENDIENTE },
        }),
        this.prisma.payment.count({
          where: { ownerId, isActive: true, estado: PaymentStatus.VENCIDO },
        }),
        this.prisma.payment.count({
          where: { ownerId, isActive: true, estado: PaymentStatus.PAGADO },
        }),
      ]),
      this.prisma.payment.aggregate({
        _sum: { monto: true },
        where: {
          ownerId,
          isActive: true,
          estado: PaymentStatus.PAGADO,
          fechaPago: { gte: firstDayThisMonth },
        },
      }),
      this.prisma.payment.aggregate({
        _sum: { monto: true },
        where: { ownerId, isActive: true, estado: PaymentStatus.PAGADO },
      }),
      this.prisma.payment.aggregate({
        _sum: { monto: true },
        where: { ownerId, isActive: true, estado: PaymentStatus.PENDIENTE },
      }),
      this.prisma.payment.aggregate({
        _sum: { monto: true },
        where: { ownerId, isActive: true, estado: PaymentStatus.VENCIDO },
      }),
      this.prisma.payment.aggregate({
        _sum: { mora: true },
        where: { ownerId, isActive: true, estado: PaymentStatus.VENCIDO },
      }),
      this.prisma.maintenanceTicket.count({
        where: { ownerId, isActive: true, estado: { in: openStates } },
      }),
      this.prisma.maintenanceTicket.count({
        where: { ownerId, isActive: true, prioridad: MaintenancePriority.URGENTE },
      }),
      this.prisma.maintenanceTicket.count({
        where: {
          ownerId,
          isActive: true,
          estado: { in: [MaintenanceStatus.RESUELTO, MaintenanceStatus.CERRADO] },
          fechaResolucion: { gte: firstDayThisMonth30 },
        },
      }),
      this.prisma.maintenanceTicket.aggregate({
        _sum: { costoFinal: true },
        where: {
          ownerId,
          isActive: true,
          estado: { in: [MaintenanceStatus.RESUELTO, MaintenanceStatus.CERRADO] },
        },
      }),
    ]);

    const totalActivosPayments = pendientesPagos + vencidosPagos + pagadosPagos;
    const collectionRate =
      totalActivosPayments > 0
        ? Number(((pagadosPagos / totalActivosPayments) * 100).toFixed(2))
        : 0;
    const occupancyRate =
      totalProps > 0 ? Number(((ocupadasProps / totalProps) * 100).toFixed(2)) : 0;

    return {
      propiedades: {
        total: totalProps,
        ocupadas: ocupadasProps,
        disponibles: disponiblesProps,
        enMantenimiento: mantenimientoProps,
        occupancyRate,
      },
      contratos: {
        activos: activosContratos,
        porVencer: porVencerContratos,
        vencidos: vencidosContratos,
      },
      pagos: {
        pendientes: pendientesPagos,
        vencidos: vencidosPagos,
        pagados: pagadosPagos,
        montoPendiente: Number(montoPendienteAgg._sum.monto ?? 0),
        montoVencido: Number(montoVencidoAgg._sum.monto ?? 0),
        moraTotalVencida: Number(moraVencidaAgg._sum.mora ?? 0),
        ingresosMesActual: Number(ingresosMesAgg._sum.monto ?? 0),
        ingresosTotales: Number(ingresosTotalesAgg._sum.monto ?? 0),
        collectionRate,
      },
      mantenimiento: {
        abiertos: ticketsAbiertos,
        urgentes: ticketsUrgentes,
        resueltosMes: ticketsResueltosMes,
        costosTotales: Number(costosMaintAgg._sum.costoFinal ?? 0),
      },
    };
  }

  // ─── Revenue Analytics ──────────────────────────────────────

  async getRevenueAnalytics(ownerId: string | undefined): Promise<IRevenueAnalytics> {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const thisYearStart = new Date(now.getFullYear(), 0, 1);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear(), 0, 0);

    const [pagosPeriodo, ingresoAnioActualAgg, ingresoAnioAnteriorAgg] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          ownerId,
          isActive: true,
          estado: PaymentStatus.PAGADO,
          fechaPago: { gte: twelveMonthsAgo },
        },
        select: { fechaPago: true, monto: true },
      }),
      this.prisma.payment.aggregate({
        _sum: { monto: true },
        where: {
          ownerId,
          isActive: true,
          estado: PaymentStatus.PAGADO,
          fechaPago: { gte: thisYearStart },
        },
      }),
      this.prisma.payment.aggregate({
        _sum: { monto: true },
        where: {
          ownerId,
          isActive: true,
          estado: PaymentStatus.PAGADO,
          fechaPago: { gte: lastYearStart, lte: lastYearEnd },
        },
      }),
    ]);

    // Build 12-month slots (oldest → newest)
    const slots: Array<{ year: number; month: number; mesKey: string; mesLabel: string }> = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      slots.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        mesKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        mesLabel: `${MESES_ES[d.getMonth()]} ${d.getFullYear()}`,
      });
    }

    // Aggregate payments by month key
    const ingresosPorMes = new Map<string, { total: number; count: number }>();
    for (const p of pagosPeriodo) {
      if (!p.fechaPago) continue;
      const key = `${p.fechaPago.getFullYear()}-${String(p.fechaPago.getMonth() + 1).padStart(2, '0')}`;
      const current = ingresosPorMes.get(key) ?? { total: 0, count: 0 };
      ingresosPorMes.set(key, { total: current.total + Number(p.monto), count: current.count + 1 });
    }

    const ultimos12Meses = slots.map((s) => {
      const data = ingresosPorMes.get(s.mesKey);
      return {
        mes: s.mesKey,
        mesLabel: s.mesLabel,
        ingresos: Number((data?.total ?? 0).toFixed(2)),
        cantidadPagos: data?.count ?? 0,
      };
    });

    const mesesConIngresos = ultimos12Meses.filter((m) => m.ingresos > 0);
    const totalPeriodo = ultimos12Meses.reduce((sum, m) => sum + m.ingresos, 0);
    const promedioMensual =
      mesesConIngresos.length > 0 ? Number((totalPeriodo / mesesConIngresos.length).toFixed(2)) : 0;
    const mejorMes =
      mesesConIngresos.length > 0
        ? mesesConIngresos.reduce((best, m) => (m.ingresos > best.ingresos ? m : best))
        : null;

    const anioActual = Number(ingresoAnioActualAgg._sum.monto ?? 0);
    const anioAnterior = Number(ingresoAnioAnteriorAgg._sum.monto ?? 0);
    const crecimiento =
      anioAnterior > 0
        ? Number((((anioActual - anioAnterior) / anioAnterior) * 100).toFixed(2))
        : anioActual > 0
          ? 100
          : 0;

    return {
      ultimos12Meses,
      comparativaAnual: { anioActual, anioAnterior, crecimiento },
      promedioMensual,
      mejorMes,
      totalPeriodo: Number(totalPeriodo.toFixed(2)),
    };
  }

  // ─── Occupancy Analytics ────────────────────────────────────

  async getOccupancyAnalytics(ownerId: string | undefined): Promise<IOccupancyAnalytics> {
    const [totalAgg, porTipo, porTipoOcupadas] = await Promise.all([
      this.prisma.property.groupBy({
        by: ['estado'],
        where: { ...(ownerId && { ownerId }), isActive: true },
        _count: { id: true },
      }),
      this.prisma.property.groupBy({
        by: ['tipoPropiedad'],
        where: { ...(ownerId && { ownerId }), isActive: true },
        _count: { id: true },
      }),
      this.prisma.property.groupBy({
        by: ['tipoPropiedad'],
        where: { ownerId, isActive: true, estado: PropertyStatus.OCUPADA },
        _count: { id: true },
      }),
    ]);

    const estadoMap = new Map(totalAgg.map((e) => [e.estado, e._count.id]));
    const ocupadas = estadoMap.get(PropertyStatus.OCUPADA) ?? 0;
    const disponibles = estadoMap.get(PropertyStatus.DISPONIBLE) ?? 0;
    const enMantenimiento = estadoMap.get(PropertyStatus.MANTENIMIENTO) ?? 0;
    const totalPropiedades = ocupadas + disponibles + enMantenimiento;

    const ocupadasPorTipo = new Map(porTipoOcupadas.map((e) => [e.tipoPropiedad, e._count.id]));

    const distribucionPorTipo = porTipo
      .map((t) => {
        const totalTipo = t._count.id;
        const ocupadasTipo = ocupadasPorTipo.get(t.tipoPropiedad) ?? 0;
        return {
          tipo: t.tipoPropiedad as string,
          total: totalTipo,
          ocupadas: ocupadasTipo,
          disponibles: totalTipo - ocupadasTipo,
          rate: totalTipo > 0 ? Number(((ocupadasTipo / totalTipo) * 100).toFixed(2)) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);

    const occupancyRate =
      totalPropiedades > 0 ? Number(((ocupadas / totalPropiedades) * 100).toFixed(2)) : 0;

    return {
      occupancyRate,
      totalPropiedades,
      ocupadas,
      disponibles,
      enMantenimiento,
      distribucionPorTipo,
    };
  }

  // ─── Payments Analytics ─────────────────────────────────────

  async getPaymentsAnalytics(ownerId: string | undefined): Promise<IPaymentsAnalytics> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const baseWhere = { ...(ownerId && { ownerId }), isActive: true };

    const [
      porEstado,
      montoPendienteAgg,
      montoVencidoAgg,
      moraVencidaAgg,
      totalCobradoAgg,
      ultimos30DiasCobradoAgg,
      ultimos30DiasPendienteAgg,
      ultimos30DiasCount,
      porMetodoPago,
    ] = await Promise.all([
      this.prisma.payment.groupBy({
        by: ['estado'],
        where: baseWhere,
        _count: { id: true },
      }),
      this.prisma.payment.aggregate({
        _sum: { monto: true },
        where: { ...baseWhere, estado: PaymentStatus.PENDIENTE },
      }),
      this.prisma.payment.aggregate({
        _sum: { monto: true },
        where: { ...baseWhere, estado: PaymentStatus.VENCIDO },
      }),
      this.prisma.payment.aggregate({
        _sum: { mora: true },
        where: { ...baseWhere, estado: PaymentStatus.VENCIDO },
      }),
      this.prisma.payment.aggregate({
        _sum: { monto: true },
        where: { ...baseWhere, estado: PaymentStatus.PAGADO },
      }),
      this.prisma.payment.aggregate({
        _sum: { monto: true },
        where: { ...baseWhere, estado: PaymentStatus.PAGADO, fechaPago: { gte: thirtyDaysAgo } },
      }),
      this.prisma.payment.aggregate({
        _sum: { monto: true },
        where: { ...baseWhere, estado: PaymentStatus.PENDIENTE, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.payment.count({
        where: { ...baseWhere, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.payment.groupBy({
        by: ['metodoPago'],
        where: { ...baseWhere, estado: PaymentStatus.PAGADO, metodoPago: { not: null } },
        _count: { id: true },
        _sum: { monto: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    const estadoMap = new Map(porEstado.map((e) => [e.estado, e._count.id]));
    const pendientes = estadoMap.get(PaymentStatus.PENDIENTE) ?? 0;
    const vencidos = estadoMap.get(PaymentStatus.VENCIDO) ?? 0;
    const pagados = estadoMap.get(PaymentStatus.PAGADO) ?? 0;
    const parciales = estadoMap.get(PaymentStatus.PARCIAL) ?? 0;
    const cancelados = estadoMap.get(PaymentStatus.CANCELADO) ?? 0;
    const totalActivos = pendientes + vencidos + pagados + parciales;
    const collectionRate =
      totalActivos > 0 ? Number(((pagados / totalActivos) * 100).toFixed(2)) : 0;

    return {
      conteos: { pendientes, vencidos, pagados, parciales, cancelados },
      montos: {
        montoPendiente: Number(montoPendienteAgg._sum.monto ?? 0),
        montoVencido: Number(montoVencidoAgg._sum.monto ?? 0),
        moraTotalVencida: Number(moraVencidaAgg._sum.mora ?? 0),
        totalCobrado: Number(totalCobradoAgg._sum.monto ?? 0),
      },
      collectionRate,
      ultimos30Dias: {
        cobrado: Number(ultimos30DiasCobradoAgg._sum.monto ?? 0),
        pendiente: Number(ultimos30DiasPendienteAgg._sum.monto ?? 0),
        cantidadPagos: ultimos30DiasCount,
      },
      porMetodoPago: porMetodoPago.map((m) => ({
        metodo: (m.metodoPago ?? PaymentMethod.EFECTIVO) as string,
        cantidad: m._count.id,
        total: Number(m._sum.monto ?? 0),
      })),
    };
  }

  // ─── Maintenance Analytics ──────────────────────────────────

  async getMaintenanceAnalytics(ownerId: string | undefined): Promise<IMaintenanceAnalytics> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const baseWhere = { ...(ownerId && { ownerId }), isActive: true };
    const openStates: MaintenanceStatus[] = [
      MaintenanceStatus.PENDIENTE,
      MaintenanceStatus.EN_PROGRESO,
      MaintenanceStatus.ESPERANDO_REPUESTOS,
    ];

    const [
      porEstado,
      urgentes,
      costosTotalesAgg,
      costoEstimadoAbiertosAgg,
      costoUltimos30Agg,
      tiemposResolucion,
      porCategoria,
      porPrioridad,
    ] = await Promise.all([
      this.prisma.maintenanceTicket.groupBy({
        by: ['estado'],
        where: baseWhere,
        _count: { id: true },
      }),
      this.prisma.maintenanceTicket.count({
        where: { ...baseWhere, prioridad: MaintenancePriority.URGENTE },
      }),
      this.prisma.maintenanceTicket.aggregate({
        _sum: { costoFinal: true },
        where: {
          ...baseWhere,
          estado: { in: [MaintenanceStatus.RESUELTO, MaintenanceStatus.CERRADO] },
        },
      }),
      this.prisma.maintenanceTicket.aggregate({
        _sum: { costoEstimado: true },
        where: { ...baseWhere, estado: { in: openStates } },
      }),
      this.prisma.maintenanceTicket.aggregate({
        _sum: { costoFinal: true },
        where: {
          ...baseWhere,
          estado: { in: [MaintenanceStatus.RESUELTO, MaintenanceStatus.CERRADO] },
          fechaResolucion: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.maintenanceTicket.findMany({
        where: {
          ...baseWhere,
          estado: { in: [MaintenanceStatus.RESUELTO, MaintenanceStatus.CERRADO] },
          fechaResolucion: { not: null },
        },
        select: { createdAt: true, fechaResolucion: true },
      }),
      this.prisma.maintenanceTicket.groupBy({
        by: ['categoria'],
        where: baseWhere,
        _count: { id: true },
        _sum: { costoFinal: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      this.prisma.maintenanceTicket.groupBy({
        by: ['prioridad'],
        where: baseWhere,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    const estadoMap = new Map(porEstado.map((e) => [e.estado, e._count.id]));
    const abiertos = openStates.reduce((sum, s) => sum + (estadoMap.get(s) ?? 0), 0);
    const resueltos = estadoMap.get(MaintenanceStatus.RESUELTO) ?? 0;
    const cerrados = estadoMap.get(MaintenanceStatus.CERRADO) ?? 0;
    const total = Array.from(estadoMap.values()).reduce((a, b) => a + b, 0);

    let promedioResolucionDias: number | null = null;
    if (tiemposResolucion.length > 0) {
      const totalMs = tiemposResolucion.reduce((acc, t) => {
        const diff = (t.fechaResolucion as Date).getTime() - t.createdAt.getTime();
        return acc + diff;
      }, 0);
      promedioResolucionDias = Number(
        (totalMs / tiemposResolucion.length / (1000 * 60 * 60 * 24)).toFixed(1),
      );
    }

    return {
      tickets: { abiertos, urgentes, resueltos, cerrados, total },
      costos: {
        costosTotales: Number(costosTotalesAgg._sum.costoFinal ?? 0),
        costoEstimadoAbiertos: Number(costoEstimadoAbiertosAgg._sum.costoEstimado ?? 0),
        costosUltimos30Dias: Number(costoUltimos30Agg._sum.costoFinal ?? 0),
      },
      promedioResolucionDias,
      porCategoria: porCategoria.map((c) => ({
        categoria: c.categoria as string,
        cantidad: c._count.id,
        costoTotal: Number(c._sum.costoFinal ?? 0),
      })),
      porPrioridad: porPrioridad.map((p) => ({
        prioridad: p.prioridad as string,
        cantidad: p._count.id,
      })),
    };
  }

  // ─── Recent Activity ────────────────────────────────────────

  async getRecentActivity(ownerId: string | undefined): Promise<IRecentActivity> {
    const [pagosRecientes, contratosRecientes, ticketsRecientes, actividadesRecientes] =
      await Promise.all([
        this.prisma.payment.findMany({
          where: { ...(ownerId && { ownerId }), isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            periodo: true,
            monto: true,
            estado: true,
            fechaVencimiento: true,
            fechaPago: true,
            createdAt: true,
            tenant: { select: { nombre: true, apellido: true } },
            property: { select: { nombre: true } },
          },
        }),
        this.prisma.contract.findMany({
          where: { ...(ownerId && { ownerId }), isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            codigoContrato: true,
            estado: true,
            fechaInicio: true,
            fechaFin: true,
            montoMensual: true,
            createdAt: true,
            tenant: { select: { nombre: true, apellido: true } },
            property: { select: { nombre: true } },
          },
        }),
        this.prisma.maintenanceTicket.findMany({
          where: { ...(ownerId && { ownerId }), isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            titulo: true,
            estado: true,
            prioridad: true,
            categoria: true,
            createdAt: true,
            property: { select: { nombre: true } },
          },
        }),
        this.prisma.activityLog.findMany({
          where: { userId: ownerId },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            descripcion: true,
            createdAt: true,
          },
        }),
      ]);

    return { pagosRecientes, contratosRecientes, ticketsRecientes, actividadesRecientes };
  }
}
