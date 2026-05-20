import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { buildPaginatedResult, getPaginationMeta } from '../../../common/utils/pagination.util';
import { CreatePropertyDto } from '../dto/create-property.dto';
import { UpdatePropertyDto } from '../dto/update-property.dto';
import { QueryPropertiesDto, SortByProperty, SortOrder } from '../dto/query-properties.dto';

@Injectable()
export class PropertyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreatePropertyDto) {
    return this.prisma.property.create({ data: { ...dto, ownerId } as Prisma.PropertyUncheckedCreateInput });
  }

  async findMany(ownerId: string, query: QueryPropertiesDto) {
    const { skip, take, page, limit } = getPaginationMeta(query);
    const where = this.buildWhere(ownerId, query);
    const orderBy = this.buildOrderBy(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({ where, skip, take, orderBy }),
      this.prisma.property.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  async findById(id: string, ownerId: string) {
    return this.prisma.property.findFirst({
      where: { id, ownerId, isActive: true },
      include: {
        owner: { select: { id: true, nombre: true, apellido: true, email: true } },
        _count: { select: { contracts: true, maintenanceTickets: true } },
      },
    });
  }

  async update(id: string, dto: UpdatePropertyDto) {
    return this.prisma.property.update({
      where: { id },
      data: dto as Prisma.PropertyUpdateInput,
    });
  }

  async softDelete(id: string) {
    return this.prisma.property.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private buildWhere(ownerId: string, query: QueryPropertiesDto): Prisma.PropertyWhereInput {
    const where: Prisma.PropertyWhereInput = { ownerId, isActive: true };

    if (query.estado) where.estado = query.estado;
    if (query.tipoPropiedad) where.tipoPropiedad = query.tipoPropiedad;
    if (query.ciudad) where.ciudad = { contains: query.ciudad };

    if (query.precioMin !== undefined || query.precioMax !== undefined) {
      where.precioMensual = {
        ...(query.precioMin !== undefined && { gte: query.precioMin }),
        ...(query.precioMax !== undefined && { lte: query.precioMax }),
      };
    }

    if (query.search) {
      where.OR = [
        { nombre: { contains: query.search } },
        { direccion: { contains: query.search } },
        { ciudad: { contains: query.search } },
        { provincia: { contains: query.search } },
      ];
    }

    return where;
  }

  private buildOrderBy(query: QueryPropertiesDto): Prisma.PropertyOrderByWithRelationInput {
    const field = query.sortBy ?? SortByProperty.CREATED_AT;
    const direction = query.sortOrder ?? SortOrder.DESC;
    return { [field]: direction };
  }
}
