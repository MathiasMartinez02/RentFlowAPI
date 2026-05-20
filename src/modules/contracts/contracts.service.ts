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
    if (!property) throw new NotFoundException('Propiedad no encontrada');
    if (property.estado !== PropertyStatus.DISPONIBLE) {
      throw new BadRequestException('La propiedad no está disponible para alquilar');
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: dto.tenantId } });
    if (!tenant || !tenant.isActive) throw new NotFoundException('Inquilino no encontrado');

    const [contract] = await this.prisma.$transaction([
      this.prisma.contract.create({ data: dto }),
      this.prisma.property.update({
        where: { id: dto.propertyId },
        data: { estado: PropertyStatus.OCUPADA },
      }),
    ]);

    this.logger.log(`Contrato creado: ${contract.id}`);
    return { message: 'Contrato creado correctamente', data: contract };
  }

  async findAll(pagination: PaginationDto) {
    const { skip, take, page, limit } = getPaginationMeta(pagination);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contract.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { id: true, nombre: true, direccion: true } },
          tenant: { select: { id: true, nombre: true, apellido: true, email: true } },
        },
      }),
      this.prisma.contract.count(),
    ]);

    return {
      message: 'Contratos recuperados correctamente',
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
    if (!contract) throw new NotFoundException(`Contrato ${id} no encontrado`);
    return { message: 'Contrato recuperado correctamente', data: contract };
  }

  async terminate(id: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException(`Contrato ${id} no encontrado`);
    if (contract.status === ContractStatus.TERMINATED) {
      throw new BadRequestException('El contrato ya está terminado');
    }

    await this.prisma.$transaction([
      this.prisma.contract.update({
        where: { id },
        data: { status: ContractStatus.TERMINATED },
      }),
      this.prisma.property.update({
        where: { id: contract.propertyId },
        data: { estado: PropertyStatus.DISPONIBLE },
      }),
    ]);

    return { message: 'Contrato terminado correctamente', data: null };
  }
}
