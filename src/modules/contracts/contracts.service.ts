import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ContractStatus, PropertyStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { buildPaginatedResult, getPaginationMeta } from '../../common/utils/pagination.util';
import { CreateContractDto } from './dto/create-contract.dto';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContractDto) {
    const property = await this.prisma.property.findUnique({ where: { id: dto.propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.status !== PropertyStatus.AVAILABLE) {
      throw new BadRequestException('Property is not available for rent');
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: dto.tenantId } });
    if (!tenant || !tenant.isActive) throw new NotFoundException('Tenant not found');

    const [contract] = await this.prisma.$transaction([
      this.prisma.contract.create({ data: dto }),
      this.prisma.property.update({
        where: { id: dto.propertyId },
        data: { status: PropertyStatus.RENTED },
      }),
    ]);

    this.logger.log(`Contract created: ${contract.id}`);
    return { message: 'Contract created successfully', data: contract };
  }

  async findAll(pagination: PaginationDto) {
    const { skip, take, page, limit } = getPaginationMeta(pagination);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contract.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { id: true, title: true, address: true } },
          tenant: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.contract.count(),
    ]);

    return {
      message: 'Contracts retrieved successfully',
      data: buildPaginatedResult(items, total, page, limit),
    };
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        property: true,
        tenant: true,
        payments: { orderBy: { dueDate: 'asc' } },
      },
    });
    if (!contract) throw new NotFoundException(`Contract ${id} not found`);
    return { message: 'Contract retrieved successfully', data: contract };
  }

  async terminate(id: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException(`Contract ${id} not found`);
    if (contract.status === ContractStatus.TERMINATED) {
      throw new BadRequestException('Contract is already terminated');
    }

    await this.prisma.$transaction([
      this.prisma.contract.update({
        where: { id },
        data: { status: ContractStatus.TERMINATED },
      }),
      this.prisma.property.update({
        where: { id: contract.propertyId },
        data: { status: PropertyStatus.AVAILABLE },
      }),
    ]);

    return { message: 'Contract terminated successfully', data: null };
  }
}
