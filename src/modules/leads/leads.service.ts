import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationPriority, NotificationType, Prisma } from '@prisma/client';
import { LeadRepository } from './repositories/lead.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { LeadStatus } from '../../common/enums/lead.enum';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(ownerId: string, dto: CreateLeadDto) {
    if (dto.propertyId) {
      const property = await this.leadRepository.findPropertyByOwner(dto.propertyId, ownerId);
      if (!property) throw new NotFoundException('Propiedad no encontrada');
    }

    const lead = await this.leadRepository.create(ownerId, dto);
    this.logger.log(`Lead creado: ${lead.id} por usuario ${ownerId}`);

    void this.notificationsService.logActivity(ownerId, {
      action: 'LEAD_CREATED',
      entityType: 'Lead',
      entityId: lead.id,
      descripcion: `Lead "${lead.nombre}" creado`,
    });

    void this.notificationsService.notify(ownerId, {
      titulo: 'Nuevo lead',
      mensaje: `Se recibió una nueva consulta de ${lead.nombre}`,
      tipo: NotificationType.LEAD,
      prioridad: NotificationPriority.MEDIUM,
      metadata: { leadId: lead.id, nombre: lead.nombre },
    });

    return lead;
  }

  async findAll(ownerId: string | undefined, query: QueryLeadsDto) {
    return this.leadRepository.findMany(ownerId, query);
  }

  async findOne(id: string, ownerId: string | undefined) {
    const lead = await this.leadRepository.findById(id, ownerId);
    if (!lead) throw new NotFoundException(`Lead ${id} no encontrado`);
    return lead;
  }

  async update(id: string, ownerId: string, dto: UpdateLeadDto) {
    const lead = await this.findOne(id, ownerId);

    if (dto.propertyId && dto.propertyId !== lead.propertyId) {
      const property = await this.leadRepository.findPropertyByOwner(dto.propertyId, ownerId);
      if (!property) throw new NotFoundException('Propiedad no encontrada');
    }

    const data: Prisma.LeadUpdateInput = {};

    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.telefono !== undefined) data.telefono = dto.telefono;
    if (dto.mensaje !== undefined) data.mensaje = dto.mensaje;
    if (dto.propertyId !== undefined) data.property = { connect: { id: dto.propertyId } };
    if (dto.vendedorId !== undefined) {
      data.vendedor = dto.vendedorId ? { connect: { id: dto.vendedorId } } : { disconnect: true };
    }
    if (dto.estado !== undefined) data.estado = dto.estado as LeadStatus;
    if (dto.fechaVisita !== undefined) data.fechaVisita = new Date(dto.fechaVisita);
    if (dto.visitaConfirmada !== undefined) data.visitaConfirmada = dto.visitaConfirmada;
    if (dto.notas !== undefined) data.notas = dto.notas;

    const updated = await this.leadRepository.update(id, data);

    if (dto.estado && dto.estado !== lead.estado) {
      if (dto.estado === LeadStatus.VISITA_AGENDADA) {
        void this.notificationsService.notify(ownerId, {
          titulo: 'Visita agendada',
          mensaje: `Se agendó una visita con ${lead.nombre}`,
          tipo: NotificationType.LEAD,
          prioridad: NotificationPriority.MEDIUM,
          metadata: { leadId: id, nombre: lead.nombre },
        });
      }
      if (dto.estado === LeadStatus.GANADO) {
        void this.notificationsService.notify(ownerId, {
          titulo: 'Lead ganado',
          mensaje: `${lead.nombre} avanzó a cliente — coordinar contrato`,
          tipo: NotificationType.LEAD,
          prioridad: NotificationPriority.HIGH,
          metadata: { leadId: id, nombre: lead.nombre },
        });
      }
      void this.notificationsService.logActivity(ownerId, {
        action: 'LEAD_STATUS_CHANGED',
        entityType: 'Lead',
        entityId: id,
        descripcion: `Lead "${lead.nombre}" pasó de ${lead.estado} a ${dto.estado}`,
      });
    } else {
      void this.notificationsService.logActivity(ownerId, {
        action: 'LEAD_UPDATED',
        entityType: 'Lead',
        entityId: id,
        descripcion: `Lead "${lead.nombre}" actualizado`,
      });
    }

    return updated;
  }

  async remove(id: string, ownerId: string) {
    const lead = await this.findOne(id, ownerId);
    await this.leadRepository.softDelete(id);
    this.logger.log(`Lead eliminado: ${id} por usuario ${ownerId}`);

    void this.notificationsService.logActivity(ownerId, {
      action: 'LEAD_DELETED',
      entityType: 'Lead',
      entityId: id,
      descripcion: `Lead "${lead.nombre}" eliminado`,
    });
  }

  async getOverview(ownerId: string | undefined) {
    return this.leadRepository.getOverviewStats(ownerId);
  }
}
