import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MaintenanceRepository } from './repositories/maintenance.repository';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { QueryMaintenanceDto } from './dto/query-maintenance.dto';
import { MaintenanceStatus } from '../../common/enums/maintenance.enum';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(private readonly maintenanceRepository: MaintenanceRepository) {}

  async create(ownerId: string, dto: CreateMaintenanceDto) {
    const property = await this.maintenanceRepository.findPropertyByOwner(dto.propertyId, ownerId);
    if (!property) throw new NotFoundException('Propiedad no encontrada');

    if (dto.tenantId) {
      const tenant = await this.maintenanceRepository.findTenantByOwner(dto.tenantId, ownerId);
      if (!tenant) throw new NotFoundException('Inquilino no encontrado');
    }

    const ticket = await this.maintenanceRepository.create(ownerId, dto);
    this.logger.log(`Ticket de mantenimiento creado: ${ticket.id} por usuario ${ownerId}`);
    return ticket;
  }

  async findAll(ownerId: string, query: QueryMaintenanceDto) {
    return this.maintenanceRepository.findMany(ownerId, query);
  }

  async findOne(id: string, ownerId: string) {
    const ticket = await this.maintenanceRepository.findById(id, ownerId);
    if (!ticket) throw new NotFoundException(`Ticket ${id} no encontrado`);
    return ticket;
  }

  async update(id: string, ownerId: string, dto: UpdateMaintenanceDto) {
    const ticket = await this.findOne(id, ownerId);

    if (ticket.estado === MaintenanceStatus.CERRADO) {
      throw new BadRequestException('No se puede modificar un ticket cerrado');
    }

    const nuevoEstado = dto.estado ?? (ticket.estado as MaintenanceStatus);

    if (
      nuevoEstado === MaintenanceStatus.RESUELTO &&
      ticket.estado !== MaintenanceStatus.RESUELTO &&
      !dto.fechaResolucion
    ) {
      dto.fechaResolucion = new Date().toISOString();
    }

    const data: Prisma.MaintenanceTicketUpdateInput = {};

    if (dto.titulo !== undefined) data.titulo = dto.titulo;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.categoria !== undefined) data.categoria = dto.categoria as any;
    if (dto.prioridad !== undefined) data.prioridad = dto.prioridad as any;
    if (dto.estado !== undefined) data.estado = dto.estado as any;
    if (dto.costoEstimado !== undefined) data.costoEstimado = dto.costoEstimado;
    if (dto.costoFinal !== undefined) data.costoFinal = dto.costoFinal;
    if (dto.fechaResolucion !== undefined) data.fechaResolucion = new Date(dto.fechaResolucion);
    if (dto.assignedTo !== undefined) data.assignedTo = dto.assignedTo;
    if (dto.observaciones !== undefined) data.observaciones = dto.observaciones;

    return this.maintenanceRepository.update(id, data);
  }

  async remove(id: string, ownerId: string) {
    const ticket = await this.findOne(id, ownerId);

    if (ticket.estado === MaintenanceStatus.CERRADO) {
      throw new BadRequestException('El ticket ya está cerrado');
    }

    await this.maintenanceRepository.softDelete(id);
    this.logger.log(`Ticket de mantenimiento cerrado: ${id} por usuario ${ownerId}`);
  }

  async getOverview(ownerId: string) {
    return this.maintenanceRepository.getOverviewStats(ownerId);
  }
}
