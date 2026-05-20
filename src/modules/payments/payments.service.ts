import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { buildPaginatedResult, getPaginationMeta } from '../../common/utils/pagination.util';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto) {
    const contract = await this.prisma.contract.findUnique({ where: { id: dto.contractId } });
    if (!contract) throw new NotFoundException('Contract not found');

    const payment = await this.prisma.payment.create({
      data: {
        ...dto,
        status: dto.paidDate ? PaymentStatus.PAID : PaymentStatus.PENDING,
      },
    });
    this.logger.log(`Payment created: ${payment.id}`);
    return { message: 'Payment created successfully', data: payment };
  }

  async findAll(pagination: PaginationDto) {
    const { skip, take, page, limit } = getPaginationMeta(pagination);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        skip,
        take,
        orderBy: { dueDate: 'desc' },
        include: {
          contract: {
            select: {
              id: true,
              property: { select: { nombre: true } },
              tenant: { select: { nombre: true, apellido: true } },
            },
          },
        },
      }),
      this.prisma.payment.count(),
    ]);

    return {
      message: 'Payments retrieved successfully',
      data: buildPaginatedResult(items, total, page, limit),
    };
  }

  async findByContract(contractId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { contractId },
      orderBy: { dueDate: 'asc' },
    });
    return { message: 'Payments retrieved successfully', data: payments };
  }

  async markAsPaid(id: string, method?: string, reference?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status: PaymentStatus.PAID,
        paidDate: new Date(),
        ...(method && { method }),
        ...(reference && { reference }),
      },
    });
    return { message: 'Payment marked as paid', data: updated };
  }

  async findOverdue() {
    const today = new Date();
    const payments = await this.prisma.payment.findMany({
      where: { status: PaymentStatus.PENDING, dueDate: { lt: today } },
      include: {
        contract: {
          select: {
            tenant: { select: { nombre: true, apellido: true, email: true, telefono: true } },
            property: { select: { nombre: true, direccion: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    await this.prisma.payment.updateMany({
      where: { status: PaymentStatus.PENDING, dueDate: { lt: today } },
      data: { status: PaymentStatus.OVERDUE },
    });

    return { message: 'Overdue payments retrieved', data: payments };
  }
}
