import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PropertyRepository } from './repositories/property.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertiesDto } from './dto/query-properties.dto';

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(
    private readonly propertyRepository: PropertyRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(ownerId: string, dto: CreatePropertyDto) {
    const property = await this.propertyRepository.create(ownerId, dto);
    this.logger.log(`Propiedad creada: ${property.id} por usuario ${ownerId}`);

    void this.notificationsService.logActivity(ownerId, {
      action: 'PROPERTY_CREATED',
      entityType: 'Property',
      entityId: property.id,
      descripcion: `Propiedad "${property.nombre}" creada en ${property.ciudad}`,
    });

    return property;
  }

  async findAll(ownerId: string | undefined, query: QueryPropertiesDto) {
    return this.propertyRepository.findMany(ownerId, query);
  }

  async findOne(id: string, ownerId: string | undefined) {
    const property = await this.propertyRepository.findById(id, ownerId);
    if (!property) throw new NotFoundException(`Propiedad ${id} no encontrada`);
    return property;
  }

  async update(id: string, ownerId: string | undefined, dto: UpdatePropertyDto) {
    const property = await this.findOne(id, ownerId);

    // Al publicar por primera vez, registrar la fecha; al despublicar, limpiarla.
    let publicadoEn: Date | null | undefined;
    if (dto.publicado === true && !property.publicado) {
      publicadoEn = new Date();
    } else if (dto.publicado === false) {
      publicadoEn = null;
    }

    const updated = await this.propertyRepository.update(
      id,
      publicadoEn !== undefined ? { ...dto, publicadoEn } : dto,
    );

    if (ownerId) {
      void this.notificationsService.logActivity(ownerId, {
        action: 'PROPERTY_UPDATED',
        entityType: 'Property',
        entityId: id,
        descripcion: `Propiedad "${updated.nombre}" actualizada`,
      });
    }

    return updated;
  }

  async remove(id: string, ownerId: string | undefined) {
    const property = await this.findOne(id, ownerId);
    await this.propertyRepository.softDelete(id);

    if (ownerId) {
      void this.notificationsService.logActivity(ownerId, {
        action: 'PROPERTY_DELETED',
        entityType: 'Property',
        entityId: id,
        descripcion: `Propiedad "${property.nombre}" eliminada`,
      });
    }
  }
}
