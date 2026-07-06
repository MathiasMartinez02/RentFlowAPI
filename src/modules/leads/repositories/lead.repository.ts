import { Injectable } from '@nestjs/common';
import { LeadOrigin, LeadStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { buildPaginatedResult, getPaginationMeta } from '../../../common/utils/pagination.util';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { QueryLeadsDto, SortByLead, SortOrder } from '../dto/query-leads.dto';
import { ILeadStats } from '../interfaces/lead.interface';

const LEAD_INCLUDE = {
  property: { select: { id: true, nombre: true, ciudad: true } },
  vendedor: { select: { id: true, nombre: true, apellido: true } },
} satisfies Prisma.LeadInclude;

@Injectable()
export class LeadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: {
        ownerId,
        nombre: dto.nombre,
        email: dto.email,
        telefono: dto.telefono,
        ...(dto.mensaje && { mensaje: dto.mensaje }),
        ...(dto.propertyId && { propertyId: dto.propertyId }),
        origen: (dto.origen as LeadOrigin) ?? LeadOrigin.WEB,
      },
      include: LEAD_INCLUDE,
    });
  }

  async findMany(ownerId: string | undefined, query: QueryLeadsDto) {
    const { skip, take, page, limit } = getPaginationMeta(query);
    const where = this.buildWhere(ownerId, query);
    const orderBy = this.buildOrderBy(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({ where, skip, take, orderBy, include: LEAD_INCLUDE }),
      this.prisma.lead.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  async findById(id: string, ownerId: string | undefined) {
    return this.prisma.lead.findFirst({
      where: { id, ...(ownerId && { ownerId }), isActive: true },
      include: LEAD_INCLUDE,
    });
  }

  async update(id: string, data: Prisma.LeadUpdateInput) {
    return this.prisma.lead.update({ where: { id }, data, include: LEAD_INCLUDE });
  }

  async softDelete(id: string) {
    return this.prisma.lead.update({ where: { id }, data: { isActive: false } });
  }

  async findPropertyByOwner(propertyId: string, ownerId: string) {
    return this.prisma.property.findFirst({
      where: { id: propertyId, ownerId, isActive: true },
      select: { id: true },
    });
  }

  async getOverviewStats(ownerId: string | undefined): Promise<ILeadStats> {
    const baseWhere = { ...(ownerId && { ownerId }), isActive: true };

    const [total, porEstadoRaw, ganados] = await this.prisma.$transaction([
      this.prisma.lead.count({ where: baseWhere }),
      this.prisma.lead.groupBy({
        by: ['estado'],
        where: baseWhere,
        orderBy: { estado: 'asc' },
        _count: true,
      }),
      this.prisma.lead.count({ where: { ...baseWhere, estado: LeadStatus.GANADO } }),
    ]);

    const porEstado: Record<string, number> = {};
    for (const row of porEstadoRaw) {
      porEstado[row.estado] = row._count as number;
    }

    return {
      total,
      porEstado,
      tasaConversion: total > 0 ? Number(((ganados / total) * 100).toFixed(1)) : 0,
    };
  }

  private buildWhere(ownerId: string | undefined, query: QueryLeadsDto): Prisma.LeadWhereInput {
    const where: Prisma.LeadWhereInput = { ...(ownerId && { ownerId }), isActive: true };

    if (query.estado) where.estado = query.estado as LeadStatus;
    if (query.origen) where.origen = query.origen as LeadOrigin;
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.vendedorId) where.vendedorId = query.vendedorId;

    if (query.search) {
      where.OR = [
        { nombre: { contains: query.search } },
        { email: { contains: query.search } },
        { telefono: { contains: query.search } },
      ];
    }

    return where;
  }

  private buildOrderBy(query: QueryLeadsDto): Prisma.LeadOrderByWithRelationInput {
    const field = query.sortBy ?? SortByLead.CREATED_AT;
    const direction = query.sortOrder ?? SortOrder.DESC;
    return { [field]: direction };
  }
}
