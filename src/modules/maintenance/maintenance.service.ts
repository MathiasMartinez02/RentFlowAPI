import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MaintenanceStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { buildPaginatedResult, getPaginationMeta } from '../../common/utils/pagination.util';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMaintenanceDto) {
    const property = await this.prisma.property.findUnique({ where: { id: dto.propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    const ticket = await this.prisma.maintenanceTicket.create({ data: dto });
    this.logger.log(`Maintenance ticket created: ${ticket.id}`);
    return { message: 'Maintenance ticket created successfully', data: ticket };
  }

  async findAll(pagination: PaginationDto) {
    const { skip, take, page, limit } = getPaginationMeta(pagination);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.maintenanceTicket.findMany({
        skip,
        take,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: { property: { select: { id: true, title: true, address: true } } },
      }),
      this.prisma.maintenanceTicket.count(),
    ]);

    return {
      message: 'Maintenance tickets retrieved successfully',
      data: buildPaginatedResult(items, total, page, limit),
    };
  }

  async findOne(id: string) {
    const ticket = await this.prisma.maintenanceTicket.findUnique({
      where: { id },
      include: { property: true },
    });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return { message: 'Ticket retrieved successfully', data: ticket };
  }

  async updateStatus(id: string, status: MaintenanceStatus, notes?: string) {
    await this.findOne(id);

    const ticket = await this.prisma.maintenanceTicket.update({
      where: { id },
      data: {
        status,
        notes,
        ...(status === MaintenanceStatus.RESOLVED && { resolvedAt: new Date() }),
      },
    });
    return { message: 'Ticket status updated', data: ticket };
  }
}
