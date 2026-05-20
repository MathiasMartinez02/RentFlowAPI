import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaymentRepository } from './repositories/payment.repository';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';
import { PaymentStatus } from '../../common/enums/payment.enum';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly paymentRepository: PaymentRepository) {}

  async create(ownerId: string, dto: CreatePaymentDto) {
    const contract = await this.paymentRepository.findContractByOwner(dto.contractId, ownerId);
    if (!contract) throw new NotFoundException('Contrato no encontrado');

    const duplicate = await this.paymentRepository.existsByContractAndPeriodo(
      dto.contractId,
      dto.periodo,
    );
    if (duplicate) {
      throw new ConflictException(
        `Ya existe un pago para el contrato ${dto.contractId} en el período ${dto.periodo}`,
      );
    }

    const estado = dto.estado ?? PaymentStatus.PENDIENTE;

    if (estado === PaymentStatus.PAGADO && !dto.fechaPago) {
      throw new BadRequestException('fechaPago es obligatoria cuando el estado es PAGADO');
    }

    const resolvedDto = { ...dto, estado };
    if (estado === PaymentStatus.PAGADO && resolvedDto.totalPagado === undefined) {
      resolvedDto.totalPagado = Number(dto.monto) + Number(dto.mora ?? 0);
    }

    const payment = await this.paymentRepository.create(
      ownerId,
      contract.tenantId,
      contract.propertyId,
      resolvedDto,
    );

    this.logger.log(`Pago creado: ${payment.id} (período ${dto.periodo}) por usuario ${ownerId}`);
    return payment;
  }

  async findAll(ownerId: string, query: QueryPaymentsDto) {
    return this.paymentRepository.findMany(ownerId, query);
  }

  async findOne(id: string, ownerId: string) {
    const payment = await this.paymentRepository.findById(id, ownerId);
    if (!payment) throw new NotFoundException(`Pago ${id} no encontrado`);
    return payment;
  }

  async update(id: string, ownerId: string, dto: UpdatePaymentDto) {
    const payment = await this.findOne(id, ownerId);

    if (payment.estado === PaymentStatus.CANCELADO) {
      throw new BadRequestException('No se puede modificar un pago cancelado');
    }

    const nuevoEstado = dto.estado ?? (payment.estado as PaymentStatus);

    if (nuevoEstado === PaymentStatus.PAGADO) {
      const tieneFechaPago = dto.fechaPago ?? payment.fechaPago;
      if (!tieneFechaPago) {
        throw new BadRequestException('fechaPago es obligatoria cuando el estado es PAGADO');
      }
    }

    const data: Prisma.PaymentUpdateInput = {};

    if (dto.fechaVencimiento !== undefined) data.fechaVencimiento = new Date(dto.fechaVencimiento);
    if (dto.fechaPago !== undefined) data.fechaPago = new Date(dto.fechaPago);
    if (dto.monto !== undefined) data.monto = dto.monto;
    if (dto.mora !== undefined) data.mora = dto.mora;
    if (dto.totalPagado !== undefined) {
      data.totalPagado = dto.totalPagado;
    } else if (nuevoEstado === PaymentStatus.PAGADO && !payment.totalPagado) {
      const monto = dto.monto ?? Number(payment.monto);
      const mora = dto.mora ?? Number(payment.mora ?? 0);
      data.totalPagado = monto + mora;
    }
    if (dto.metodoPago !== undefined) data.metodoPago = dto.metodoPago as any;
    if (dto.referenciaPago !== undefined) data.referenciaPago = dto.referenciaPago;
    if (dto.estado !== undefined) {
      data.estado = dto.estado as any;
      if (dto.estado === PaymentStatus.VENCIDO && dto.mora === undefined && !payment.mora) {
        data.mora = this.calculateMora(Number(payment.monto), payment.fechaVencimiento as Date);
      }
    }
    if (dto.observaciones !== undefined) data.observaciones = dto.observaciones;

    return this.paymentRepository.update(id, data);
  }

  async remove(id: string, ownerId: string) {
    const payment = await this.findOne(id, ownerId);

    if (payment.estado === PaymentStatus.CANCELADO) {
      throw new BadRequestException('El pago ya está cancelado');
    }

    await this.paymentRepository.softDelete(id);
    this.logger.log(`Pago cancelado: ${id} por usuario ${ownerId}`);
  }

  async getOverview(ownerId: string) {
    return this.paymentRepository.getOverviewStats(ownerId);
  }

  private calculateMora(monto: number, fechaVencimiento: Date): number {
    const daysOverdue = Math.max(
      0,
      Math.floor((Date.now() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const rate = Math.min(daysOverdue * 0.001, 0.3); // 0.1% diario, máximo 30%
    return Number((monto * rate).toFixed(2));
  }
}
