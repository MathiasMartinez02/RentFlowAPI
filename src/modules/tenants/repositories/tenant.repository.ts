import { Injectable } from '@nestjs/common';
import { Prisma, TenantStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { buildPaginatedResult, getPaginationMeta } from '../../../common/utils/pagination.util';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { QueryTenantsDto, SortByTenant, SortOrder } from '../dto/query-tenants.dto';

@Injectable()
export class TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateTenantDto) {
    return this.prisma.tenant.create({
      data: { ...dto, ownerId } as Prisma.TenantUncheckedCreateInput,
    });
  }

  async findMany(ownerId: string, query: QueryTenantsDto) {
    const { skip, take, page, limit } = getPaginationMeta(query);
    const where = this.buildWhere(ownerId, query);
    const orderBy = this.buildOrderBy(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({ where, skip, take, orderBy }),
      this.prisma.tenant.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  async findById(id: string, ownerId: string) {
    return this.prisma.tenant.findFirst({
      where: { id, ownerId, isActive: true },
      include: {
        owner: { select: { id: true, nombre: true, apellido: true, email: true } },
        property: { select: { id: true, nombre: true, direccion: true } },
        _count: { select: { contracts: true } },
      },
    });
  }

  async update(id: string, dto: UpdateTenantDto) {
    return this.prisma.tenant.update({
      where: { id },
      data: dto as Prisma.TenantUpdateInput,
    });
  }

  async softDelete(id: string) {
    return this.prisma.tenant.update({
      where: { id },
      data: { isActive: false, estado: TenantStatus.INACTIVO },
    });
  }

  async existsByEmail(email: string, ownerId: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.tenant.count({
      where: { email, ownerId, ...(excludeId && { id: { not: excludeId } }) },
    });
    return count > 0;
  }

  async existsByDni(dni: string, ownerId: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.tenant.count({
      where: { dni, ownerId, ...(excludeId && { id: { not: excludeId } }) },
    });
    return count > 0;
  }

  async findPropertyByOwner(propertyId: string, ownerId: string) {
    return this.prisma.property.findFirst({
      where: { id: propertyId, ownerId, isActive: true },
      select: { id: true },
    });
  }

  private buildWhere(ownerId: string, query: QueryTenantsDto): Prisma.TenantWhereInput {
    const where: Prisma.TenantWhereInput = { ownerId, isActive: true };

    if (query.estado) where.estado = query.estado as TenantStatus;
    if (query.propertyId) where.propertyId = query.propertyId;

    if (query.search) {
      where.OR = [
        { nombre: { contains: query.search } },
        { apellido: { contains: query.search } },
        { email: { contains: query.search } },
        { dni: { contains: query.search } },
      ];
    }

    return where;
  }

  private buildOrderBy(query: QueryTenantsDto): Prisma.TenantOrderByWithRelationInput {
    const field = query.sortBy ?? SortByTenant.CREATED_AT;
    const direction = query.sortOrder ?? SortOrder.DESC;
    return { [field]: direction };
  }
}
