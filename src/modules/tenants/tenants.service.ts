import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { buildPaginatedResult, getPaginationMeta } from '../../common/utils/pagination.util';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    const exists = await this.prisma.tenant.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Tenant with this email already exists');

    const dniExists = await this.prisma.tenant.findUnique({ where: { dni: dto.dni } });
    if (dniExists) throw new ConflictException('Tenant with this DNI already exists');

    const tenant = await this.prisma.tenant.create({ data: dto });
    this.logger.log(`Tenant created: ${tenant.id}`);
    return { message: 'Tenant created successfully', data: tenant };
  }

  async findAll(pagination: PaginationDto) {
    const { skip, take, page, limit } = getPaginationMeta(pagination);
    const where = { isActive: true };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      message: 'Tenants retrieved successfully',
      data: buildPaginatedResult(items, total, page, limit),
    };
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { contracts: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });
    if (!tenant || !tenant.isActive) throw new NotFoundException(`Tenant ${id} not found`);
    return { message: 'Tenant retrieved successfully', data: tenant };
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);
    const tenant = await this.prisma.tenant.update({ where: { id }, data: dto });
    return { message: 'Tenant updated successfully', data: tenant };
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.tenant.update({ where: { id }, data: { isActive: false } });
    return { message: 'Tenant deleted successfully', data: null };
  }
}
