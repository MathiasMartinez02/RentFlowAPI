import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NotificationPriority, NotificationType } from '@prisma/client';
import { ContractRepository } from './repositories/contract.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { QueryContractsDto } from './dto/query-contracts.dto';
import { ContractStatus } from '../../common/enums/contract.enum';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(
    private readonly contractRepository: ContractRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(ownerId: string, dto: CreateContractDto) {
    if (new Date(dto.fechaFin) <= new Date(dto.fechaInicio)) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    const [property, tenant] = await Promise.all([
      this.contractRepository.findPropertyByOwner(dto.propertyId, ownerId),
      this.contractRepository.findTenantByOwner(dto.tenantId, ownerId),
    ]);

    if (!property) throw new NotFoundException('Propiedad no encontrada');
    if (!tenant) throw new NotFoundException('Inquilino no encontrado');

    const isActivo = !dto.estado || dto.estado === ContractStatus.ACTIVO;
    if (isActivo) {
      const activeContracts = await this.contractRepository.countActiveByProperty(dto.propertyId);
      if (activeContracts > 0) {
        throw new ConflictException('La propiedad ya tiene un contrato activo');
      }
    }

    const codigoContrato = await this.generateUniqueCode();
    const contract = await this.contractRepository.create(ownerId, dto, codigoContrato);
    this.logger.log(`Contrato creado: ${contract.id} (${codigoContrato}) por usuario ${ownerId}`);

    void this.notificationsService.notify(ownerId, {
      titulo: 'Contrato creado',
      mensaje: `Se creó el contrato ${codigoContrato}`,
      tipo: NotificationType.CONTRACT,
      prioridad: NotificationPriority.MEDIUM,
      metadata: { contractId: contract.id, codigoContrato },
    });
    void this.notificationsService.logActivity(ownerId, {
      action: 'CONTRACT_CREATED',
      entityType: 'Contract',
      entityId: contract.id,
      descripcion: `Contrato ${codigoContrato} creado`,
    });

    return contract;
  }

  async findAll(ownerId: string | undefined, query: QueryContractsDto) {
    return this.contractRepository.findMany(ownerId, query);
  }

  async findOne(id: string, ownerId: string | undefined) {
    const contract = await this.contractRepository.findById(id, ownerId);
    if (!contract) throw new NotFoundException(`Contrato ${id} no encontrado`);
    return contract;
  }

  async update(id: string, ownerId: string, dto: UpdateContractDto) {
    const contract = await this.findOne(id, ownerId);

    if (contract.estado === ContractStatus.CANCELADO) {
      throw new BadRequestException('No se puede modificar un contrato cancelado');
    }

    if (dto.fechaInicio || dto.fechaFin) {
      const inicio = dto.fechaInicio ? new Date(dto.fechaInicio) : contract.fechaInicio;
      const fin = dto.fechaFin ? new Date(dto.fechaFin) : contract.fechaFin;
      if (fin <= inicio) {
        throw new BadRequestException('La fecha de fin debe ser posterior a la fecha de inicio');
      }
    }

    if (dto.propertyId && dto.propertyId !== contract.propertyId) {
      const property = await this.contractRepository.findPropertyByOwner(dto.propertyId, ownerId);
      if (!property) throw new NotFoundException('Propiedad no encontrada');
    }

    if (dto.tenantId && dto.tenantId !== contract.tenantId) {
      const tenant = await this.contractRepository.findTenantByOwner(dto.tenantId, ownerId);
      if (!tenant) throw new NotFoundException('Inquilino no encontrado');
    }

    const updated = await this.contractRepository.update(id, dto);

    if (dto.estado === ContractStatus.PROXIMO_A_VENCER) {
      void this.notificationsService.notify(ownerId, {
        titulo: 'Contrato próximo a vencer',
        mensaje: `El contrato ${contract.codigoContrato} está próximo a vencer`,
        tipo: NotificationType.CONTRACT,
        prioridad: NotificationPriority.HIGH,
        metadata: { contractId: id, codigoContrato: contract.codigoContrato },
      });
    }

    return updated;
  }

  async remove(id: string, ownerId: string) {
    const contract = await this.findOne(id, ownerId);

    if (contract.estado === ContractStatus.CANCELADO) {
      throw new BadRequestException('El contrato ya está cancelado');
    }

    await this.contractRepository.cancel(id, contract.propertyId);
    this.logger.log(`Contrato cancelado: ${id} por usuario ${ownerId}`);

    void this.notificationsService.logActivity(ownerId, {
      action: 'CONTRACT_CANCELLED',
      entityType: 'Contract',
      entityId: id,
      descripcion: `Contrato ${contract.codigoContrato} cancelado`,
    });
  }

  private async generateUniqueCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code: string;
    let exists = true;

    while (exists) {
      const random = Array.from(
        { length: 5 },
        () => chars[Math.floor(Math.random() * chars.length)],
      ).join('');
      code = `CTR-${new Date().getFullYear()}-${random}`;
      exists = await this.contractRepository.codeExists(code);
    }

    return code!;
  }
}
