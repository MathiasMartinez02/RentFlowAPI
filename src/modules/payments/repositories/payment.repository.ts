import { Injectable } from '@nestjs/common';
import { PaymentMethod, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { buildPaginatedResult, getPaginationMeta } from '../../../common/utils/pagination.util';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { UpdatePaymentDto } from '../dto/update-payment.dto';
import { QueryPaymentsDto, SortByPayment, SortOrder } from '../dto/query-payments.dto';
import { IPaymentStats } from '../interfaces/payment.interface';

const PAYMENT_INCLUDE = {
  contract: { select: { id: true, codigoContrato: true } },
  tenant: { select: { id: true, nombre: true, apellido: true, email: true } },
  property: { select: { id: true, nombre: true, ciudad: true } },
} satisfies Prisma.PaymentInclude;

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    ownerId: string,
    tenantId: string,
    propertyId: string,
    dto: CreatePaymentDto,
  ) {
    return this.prisma.payment.create({
      data: {
        ownerId,
        contractId: dto.contractId,
        tenantId,
        propertyId,
        periodo: dto.periodo,
        fechaVencimiento: new Date(dto.fechaVencimiento),
        ...(dto.fechaPago && { fechaPago: new Date(dto.fechaPago) }),
        monto: dto.monto,
        ...(dto.mora !== undefined && { mora: dto.mora }),
        ...(dto.totalPagado !== undefined && { totalPagado: dto.totalPagado }),
        ...(dto.metodoPago && { metodoPago: dto.metodoPago as PaymentMethod }),
        ...(dto.referenciaPago && { referenciaPago: dto.referenciaPago }),
        estado: (dto.estado ?? PaymentStatus.PENDIENTE) as PaymentStatus,
        ...(dto.observaciones && { observaciones: dto.observaciones }),
      },
      include: PAYMENT_INCLUDE,
    });
  }

  async findMany(ownerId: string, query: QueryPaymentsDto) {
    const { skip, take, page, limit } = getPaginationMeta(query);
    const where = this.buildWhere(ownerId, query);
    const orderBy = this.buildOrderBy(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({ where, skip, take, orderBy, include: PAYMENT_INCLUDE }),
      this.prisma.payment.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  async findById(id: string, ownerId: string) {
    return this.prisma.payment.findFirst({
      where: { id, ownerId, isActive: true },
      include: PAYMENT_INCLUDE,
    });
  }

  async update(id: string, data: Prisma.PaymentUpdateInput) {
    return this.prisma.payment.update({
      where: { id },
      data,
      include: PAYMENT_INCLUDE,
    });
  }

  async softDelete(id: string) {
    return this.prisma.payment.update({
      where: { id },
      data: { isActive: false, estado: PaymentStatus.CANCELADO },
    });
  }

  async existsByContractAndPeriodo(
    contractId: string,
    periodo: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await this.prisma.payment.count({
      where: { contractId, periodo, ...(excludeId && { id: { not: excludeId } }) },
    });
    return count > 0;
  }

  async findContractByOwner(contractId: string, ownerId: string) {
    return this.prisma.contract.findFirst({
      where: { id: contractId, ownerId, isActive: true },
      select: { id: true, tenantId: true, propertyId: true, estado: true },
    });
  }

  async getOverviewStats(ownerId: string): Promise<IPaymentStats> {
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const baseWhere = { ownerId, isActive: true };

    const [cobradoMes, pendientes, vencidos, pagados, ingresosTotales, montoPendiente, montoVencido] =
      await this.prisma.$transaction([
        this.prisma.payment.aggregate({
          _sum: { monto: true },
          where: { ...baseWhere, estado: PaymentStatus.PAGADO, fechaPago: { gte: firstDayOfMonth } },
        }),
        this.prisma.payment.count({
          where: { ...baseWhere, estado: PaymentStatus.PENDIENTE },
        }),
        this.prisma.payment.count({
          where: { ...baseWhere, estado: PaymentStatus.VENCIDO },
        }),
        this.prisma.payment.count({
          where: { ...baseWhere, estado: PaymentStatus.PAGADO },
        }),
        this.prisma.payment.aggregate({
          _sum: { monto: true },
          where: { ...baseWhere, estado: PaymentStatus.PAGADO },
        }),
        this.prisma.payment.aggregate({
          _sum: { monto: true },
          where: { ...baseWhere, estado: PaymentStatus.PENDIENTE },
        }),
        this.prisma.payment.aggregate({
          _sum: { monto: true },
          where: { ...baseWhere, estado: PaymentStatus.VENCIDO },
        }),
      ]);

    const totalActivos = pendientes + vencidos + pagados;
    const porcentajeCobranza =
      totalActivos > 0 ? Number(((pagados / totalActivos) * 100).toFixed(2)) : 0;

    return {
      totalCobradoMes: Number(cobradoMes._sum.monto ?? 0),
      pagosPendientes: pendientes,
      pagosVencidos: vencidos,
      ingresosTotales: Number(ingresosTotales._sum.monto ?? 0),
      porcentajeCobranza,
      montoPendiente: Number(montoPendiente._sum.monto ?? 0),
      montoVencido: Number(montoVencido._sum.monto ?? 0),
    };
  }

  private buildWhere(ownerId: string, query: QueryPaymentsDto): Prisma.PaymentWhereInput {
    const where: Prisma.PaymentWhereInput = { ownerId, isActive: true };

    if (query.estado) where.estado = query.estado as PaymentStatus;
    if (query.metodoPago) where.metodoPago = query.metodoPago as PaymentMethod;
    if (query.contractId) where.contractId = query.contractId;
    if (query.tenantId) where.tenantId = query.tenantId;
    if (query.propertyId) where.propertyId = query.propertyId;

    if (query.search) {
      where.OR = [
        { periodo: { contains: query.search } },
        { referenciaPago: { contains: query.search } },
        { tenant: { nombre: { contains: query.search } } },
        { tenant: { apellido: { contains: query.search } } },
        { property: { nombre: { contains: query.search } } },
      ];
    }

    return where;
  }

  private buildOrderBy(query: QueryPaymentsDto): Prisma.PaymentOrderByWithRelationInput {
    const field = query.sortBy ?? SortByPayment.FECHA_VENCIMIENTO;
    const direction = query.sortOrder ?? SortOrder.DESC;
    return { [field]: direction };
  }
}
