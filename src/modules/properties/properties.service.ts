import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PropertyStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { buildPaginatedResult, getPaginationMeta } from '../../common/utils/pagination.util';
import { CreatePropertyDto } from './dto/create-property.dto';
import { FilterPropertyDto } from './dto/filter-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreatePropertyDto) {
    const property = await this.prisma.property.create({
      data: { ...dto, ownerId },
    });
    this.logger.log(`Property created: ${property.id} by user ${ownerId}`);
    return { message: 'Property created successfully', data: property };
  }

  async findAll(ownerId: string, filters: FilterPropertyDto) {
    const { skip, take, page, limit } = getPaginationMeta(filters);

    const where = {
      ownerId,
      isActive: true,
      ...(filters.status && { status: filters.status }),
      ...(filters.type && { type: filters.type }),
      ...(filters.city && { city: { contains: filters.city, mode: 'insensitive' as const } }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.property.count({ where }),
    ]);

    return {
      message: 'Properties retrieved successfully',
      data: buildPaginatedResult(items, total, page, limit),
    };
  }

  async findOne(id: string, ownerId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, ownerId, isActive: true },
      include: {
        contracts: { where: { status: { in: ['ACTIVE', 'PENDING'] } }, take: 1 },
        _count: { select: { maintenanceTickets: true } },
      },
    });
    if (!property) throw new NotFoundException(`Property ${id} not found`);
    return { message: 'Property retrieved successfully', data: property };
  }

  async update(id: string, ownerId: string, dto: UpdatePropertyDto) {
    await this.findOne(id, ownerId);
    const property = await this.prisma.property.update({ where: { id }, data: dto });
    return { message: 'Property updated successfully', data: property };
  }

  async remove(id: string, ownerId: string) {
    await this.findOne(id, ownerId);
    await this.prisma.property.update({
      where: { id },
      data: { isActive: false, status: PropertyStatus.INACTIVE },
    });
    return { message: 'Property deleted successfully', data: null };
  }
}
