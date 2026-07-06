import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { buildPaginatedResult, getPaginationMeta } from '../../common/utils/pagination.util';
import { QueryPublicPropertiesDto } from './dto/query-public-properties.dto';

const PUBLIC_PROPERTY_SELECT = {
  id: true,
  nombre: true,
  descripcion: true,
  direccion: true,
  ciudad: true,
  provincia: true,
  codigoPostal: true,
  pais: true,
  tipoPropiedad: true,
  precioMensual: true,
  expensas: true,
  habitaciones: true,
  banos: true,
  metrosCuadrados: true,
  imagenPrincipal: true,
  createdAt: true,
  images: { select: { id: true, url: true }, orderBy: { createdAt: 'desc' as const } },
} satisfies Prisma.PropertySelect;

@Injectable()
export class PublicPropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: QueryPublicPropertiesDto) {
    const { skip, take, page, limit } = getPaginationMeta(query);
    const where = this.buildWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: PUBLIC_PROPERTY_SELECT,
      }),
      this.prisma.property.count({ where }),
    ]);

    return buildPaginatedResult(items, total, page, limit);
  }

  async findById(id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, publicado: true, isActive: true },
      select: PUBLIC_PROPERTY_SELECT,
    });
    if (!property) throw new NotFoundException(`Propiedad ${id} no encontrada`);
    return property;
  }

  private buildWhere(query: QueryPublicPropertiesDto): Prisma.PropertyWhereInput {
    const where: Prisma.PropertyWhereInput = { publicado: true, isActive: true };

    if (query.ciudad) where.ciudad = { contains: query.ciudad };
    if (query.tipoPropiedad) where.tipoPropiedad = query.tipoPropiedad;
    if (query.habitaciones !== undefined) where.habitaciones = { gte: query.habitaciones };

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
}
