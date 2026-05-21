import { Injectable } from '@nestjs/common';
import { ContractStatus, Prisma, PropertyStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { buildPaginatedResult, getPaginationMeta } from '../../../common/utils/pagination.util';
import { CreateContractDto } from '../dto/create-contract.dto';
import { UpdateContractDto } from '../dto/update-contract.dto';
import { QueryContractsDto, SortByContract, SortOrder } from '../dto/query-contracts.dto';

const PROPERTY_SELECT = {
  id: true,
  nombre: true,
  direccion: true,
  ciudad: true,
  estado: true,
} satisfies Prisma.PropertySelect;

const TENANT_SELECT = {
  id: true,
  nombre: true,
  apellido: true,
  email: true,
  telefono: true,
  estado: true,
} satisfies Prisma.TenantSelect;

@Injectable()
export class ContractRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateContractDto, codigoContrato: string) {
    const estado = (dto.estado ?? ContractStatus.ACTIVO) as ContractStatus;

    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          codigoContrato,
          ownerId,
          propertyId: dto.propertyId,
          tenantId: dto.tenantId,
          fechaInicio: new Date(dto.fechaInicio),
          fechaFin: new Date(dto.fechaFin),
          montoMensual: dto.montoMensual,
          deposito: dto.deposito,
          ...(dto.expensas !== undefined && { expensas: dto.expensas }),
          renovacionAutomatica: dto.renovacionAutomatica ?? false,
          estado,
          ...(dto.observaciones && { observaciones: dto.observaciones }),
        },
        include: {
          property: { select: PROPERTY_SELECT },
          tenant: { select: TENANT_SELECT },
          _count: { select: { payments: true } },
        },
      });

      if (estado === ContractStatus.ACTIVO) {
        await tx.property.update({
          where: { id: dto.propertyId },
          data: { estado: PropertyStatus.OCUPADA },
        });
      }

      return contract;
    });
  }

  async findMany(ownerId: string | undefined, query: QueryContractsDto) {
    const { skip, take, page, limit } = getPaginationMeta(query);
    const where = this.buildWhere(ownerId, query);
    const orderBy = this.buildOrderBy(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contract.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          property: { select: { id: true, nombre: true, ciudad: true } },
          tenant: { select: { id: true, nombre: true, apellido: true, email: true } },
        },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  async findById(id: string, ownerId: string | undefined) {
    return this.prisma.contract.findFirst({
      where: { id, ...(ownerId && { ownerId }), isActive: true },
      include: {
        owner: { select: { id: true, nombre: true, apellido: true, email: true } },
        property: { select: PROPERTY_SELECT },
        tenant: { select: TENANT_SELECT },
        _count: { select: { payments: true } },
      },
    });
  }

  async update(id: string, dto: UpdateContractDto) {
    const data: Prisma.ContractUpdateInput = {};

    if (dto.fechaInicio !== undefined) data.fechaInicio = new Date(dto.fechaInicio);
    if (dto.fechaFin !== undefined) data.fechaFin = new Date(dto.fechaFin);
    if (dto.montoMensual !== undefined) data.montoMensual = dto.montoMensual;
    if (dto.deposito !== undefined) data.deposito = dto.deposito;
    if (dto.expensas !== undefined) data.expensas = dto.expensas;
    if (dto.renovacionAutomatica !== undefined) data.renovacionAutomatica = dto.renovacionAutomatica;
    if (dto.estado !== undefined) data.estado = dto.estado as ContractStatus;
    if (dto.observaciones !== undefined) data.observaciones = dto.observaciones;

    return this.prisma.contract.update({
      where: { id },
      data,
      include: {
        property: { select: PROPERTY_SELECT },
        tenant: { select: TENANT_SELECT },
      },
    });
  }

  async cancel(id: string, propertyId: string) {
    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.update({
        where: { id },
        data: { estado: ContractStatus.CANCELADO, isActive: false },
      });

      const property = await tx.property.findUnique({
        where: { id: propertyId },
        select: { estado: true },
      });

      if (property?.estado === PropertyStatus.OCUPADA) {
        await tx.property.update({
          where: { id: propertyId },
          data: { estado: PropertyStatus.DISPONIBLE },
        });
      }

      return contract;
    });
  }

  async countActiveByProperty(propertyId: string): Promise<number> {
    return this.prisma.contract.count({
      where: {
        propertyId,
        isActive: true,
        estado: { in: [ContractStatus.ACTIVO, ContractStatus.PROXIMO_A_VENCER] },
      },
    });
  }

  async codeExists(codigoContrato: string): Promise<boolean> {
    const count = await this.prisma.contract.count({ where: { codigoContrato } });
    return count > 0;
  }

  async findPropertyByOwner(propertyId: string, ownerId: string) {
    return this.prisma.property.findFirst({
      where: { id: propertyId, ownerId, isActive: true },
      select: { id: true, estado: true },
    });
  }

  async findTenantByOwner(tenantId: string, ownerId: string) {
    return this.prisma.tenant.findFirst({
      where: { id: tenantId, ownerId, isActive: true },
      select: { id: true },
    });
  }

  private buildWhere(ownerId: string | undefined, query: QueryContractsDto): Prisma.ContractWhereInput {
    const where: Prisma.ContractWhereInput = { ...(ownerId && { ownerId }), isActive: true };

    if (query.estado) where.estado = query.estado as ContractStatus;
    if (query.propertyId) where.propertyId = query.propertyId;
    if (query.tenantId) where.tenantId = query.tenantId;

    if (query.search) {
      where.OR = [
        { codigoContrato: { contains: query.search } },
        { property: { nombre: { contains: query.search } } },
        { tenant: { nombre: { contains: query.search } } },
        { tenant: { apellido: { contains: query.search } } },
      ];
    }

    return where;
  }

  private buildOrderBy(query: QueryContractsDto): Prisma.ContractOrderByWithRelationInput {
    const field = query.sortBy ?? SortByContract.CREATED_AT;
    const direction = query.sortOrder ?? SortOrder.DESC;
    return { [field]: direction };
  }
}
