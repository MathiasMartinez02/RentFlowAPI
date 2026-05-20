import { Injectable } from '@nestjs/common';
import { MaintenanceCategory, MaintenancePriority, MaintenanceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { buildPaginatedResult, getPaginationMeta } from '../../../common/utils/pagination.util';
import { CreateMaintenanceDto } from '../dto/create-maintenance.dto';
import { QueryMaintenanceDto, SortByMaintenance, SortOrder } from '../dto/query-maintenance.dto';
import { IMaintenanceStats } from '../interfaces/maintenance.interface';

const TICKET_INCLUDE = {
  property: { select: { id: true, nombre: true, ciudad: true } },
  tenant: { select: { id: true, nombre: true, apellido: true, email: true } },
} satisfies Prisma.MaintenanceTicketInclude;

@Injectable()
export class MaintenanceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateMaintenanceDto) {
    return this.prisma.maintenanceTicket.create({
      data: {
        ownerId,
        propertyId: dto.propertyId,
        ...(dto.tenantId && { tenantId: dto.tenantId }),
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        categoria: dto.categoria as MaintenanceCategory,
        prioridad: dto.prioridad as MaintenancePriority,
        ...(dto.costoEstimado !== undefined && { costoEstimado: dto.costoEstimado }),
        ...(dto.assignedTo && { assignedTo: dto.assignedTo }),
        ...(dto.observaciones && { observaciones: dto.observaciones }),
      },
      include: TICKET_INCLUDE,
    });
  }

  async findMany(ownerId: string, query: QueryMaintenanceDto) {
    const { skip, take, page, limit } = getPaginationMeta(query);
    const where = this.buildWhere(ownerId, query);
    const orderBy = this.buildOrderBy(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.maintenanceTicket.findMany({ where, skip, take, orderBy, include: TICKET_INCLUDE }),
      this.prisma.maintenanceTicket.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  async findById(id: string, ownerId: string) {
    return this.prisma.maintenanceTicket.findFirst({
      where: { id, ownerId, isActive: true },
      include: TICKET_INCLUDE,
    });
  }

  async update(id: string, data: Prisma.MaintenanceTicketUpdateInput) {
    return this.prisma.maintenanceTicket.update({
      where: { id },
      data,
      include: TICKET_INCLUDE,
    });
  }

  async softDelete(id: string) {
    return this.prisma.maintenanceTicket.update({
      where: { id },
      data: { isActive: false, estado: MaintenanceStatus.CERRADO },
    });
  }

  async findPropertyByOwner(propertyId: string, ownerId: string) {
    return this.prisma.property.findFirst({
      where: { id: propertyId, ownerId, isActive: true },
      select: { id: true },
    });
  }

  async findTenantByOwner(tenantId: string, ownerId: string) {
    return this.prisma.tenant.findFirst({
      where: { id: tenantId, ownerId, isActive: true },
      select: { id: true },
    });
  }

  async getOverviewStats(ownerId: string): Promise<IMaintenanceStats> {
    const baseWhere = { ownerId, isActive: true };
    const estadosAbiertos: MaintenanceStatus[] = [
      MaintenanceStatus.PENDIENTE,
      MaintenanceStatus.EN_PROGRESO,
      MaintenanceStatus.ESPERANDO_REPUESTOS,
    ];

    const [abiertos, urgentes, resueltos, costos, tiemposResolucion] =
      await this.prisma.$transaction([
        this.prisma.maintenanceTicket.count({
          where: { ...baseWhere, estado: { in: estadosAbiertos } },
        }),
        this.prisma.maintenanceTicket.count({
          where: { ...baseWhere, prioridad: MaintenancePriority.URGENTE },
        }),
        this.prisma.maintenanceTicket.count({
          where: { ...baseWhere, estado: { in: [MaintenanceStatus.RESUELTO, MaintenanceStatus.CERRADO] } },
        }),
        this.prisma.maintenanceTicket.aggregate({
          _sum: { costoFinal: true },
          where: { ...baseWhere, estado: { in: [MaintenanceStatus.RESUELTO, MaintenanceStatus.CERRADO] } },
        }),
        this.prisma.maintenanceTicket.findMany({
          where: {
            ...baseWhere,
            estado: { in: [MaintenanceStatus.RESUELTO, MaintenanceStatus.CERRADO] },
            fechaResolucion: { not: null },
          },
          select: { createdAt: true, fechaResolucion: true },
        }),
      ]);

    let tiempoPromedioResolucion: number | null = null;
    if (tiemposResolucion.length > 0) {
      const totalMs = tiemposResolucion.reduce((acc, t) => {
        const diff = (t.fechaResolucion as Date).getTime() - t.createdAt.getTime();
        return acc + diff;
      }, 0);
      tiempoPromedioResolucion = Number(
        (totalMs / tiemposResolucion.length / (1000 * 60 * 60 * 24)).toFixed(1),
      );
    }

    return {
      ticketsAbiertos: abiertos,
      ticketsUrgentes: urgentes,
      ticketsResueltos: resueltos,
      tiempoPromedioResolucion,
      costosTotales: Number(costos._sum.costoFinal ?? 0),
    };
  }

  private buildWhere(ownerId: string, query: QueryMaintenanceDto): Prisma.MaintenanceTicketWhereInput {
    const where: Prisma.MaintenanceTicketWhereInput = { ownerId, isActive: true };

    if (query.estado) where.estado = query.estado as MaintenanceStatus;
    if (query.prioridad) where.prioridad = query.prioridad as MaintenancePriority;
    if (query.categoria) where.categoria = query.categoria as MaintenanceCategory;
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.tenantId) where.tenantId = query.tenantId;

    if (query.search) {
      where.OR = [
        { titulo: { contains: query.search } },
        { descripcion: { contains: query.search } },
        { assignedTo: { contains: query.search } },
        { property: { nombre: { contains: query.search } } },
        { tenant: { nombre: { contains: query.search } } },
        { tenant: { apellido: { contains: query.search } } },
      ];
    }

    return where;
  }

  private buildOrderBy(query: QueryMaintenanceDto): Prisma.MaintenanceTicketOrderByWithRelationInput {
    const field = query.sortBy ?? SortByMaintenance.CREATED_AT;
    const direction = query.sortOrder ?? SortOrder.DESC;
    return { [field]: direction };
  }
}
