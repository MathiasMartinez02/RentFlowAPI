import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TenantRepository } from './repositories/tenant.repository';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { QueryTenantsDto } from './dto/query-tenants.dto';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(ownerId: string, dto: CreateTenantDto) {
    const [emailExists, dniExists] = await Promise.all([
      this.tenantRepository.existsByEmail(dto.email, ownerId),
      this.tenantRepository.existsByDni(dto.dni, ownerId),
    ]);

    if (emailExists) throw new ConflictException('Ya existe un inquilino con ese email');
    if (dniExists) throw new ConflictException('Ya existe un inquilino con ese DNI');

    if (dto.propertyId) {
      const property = await this.tenantRepository.findPropertyByOwner(dto.propertyId, ownerId);
      if (!property) throw new NotFoundException('Propiedad no encontrada');
    }

    const tenant = await this.tenantRepository.create(ownerId, dto);
    this.logger.log(`Inquilino creado: ${tenant.id} por usuario ${ownerId}`);

    void this.notificationsService.logActivity(ownerId, {
      action: 'TENANT_CREATED',
      entityType: 'Tenant',
      entityId: tenant.id,
      descripcion: `Inquilino "${tenant.nombre} ${tenant.apellido}" creado`,
    });

    return tenant;
  }

  async findAll(ownerId: string | undefined, query: QueryTenantsDto) {
    return this.tenantRepository.findMany(ownerId, query);
  }

  async findOne(id: string, ownerId: string | undefined) {
    const tenant = await this.tenantRepository.findById(id, ownerId);
    if (!tenant) throw new NotFoundException(`Inquilino ${id} no encontrado`);
    return tenant;
  }

  async update(id: string, ownerId: string, dto: UpdateTenantDto) {
    await this.findOne(id, ownerId);

    if (dto.email) {
      const emailExists = await this.tenantRepository.existsByEmail(dto.email, ownerId, id);
      if (emailExists) throw new ConflictException('Ya existe un inquilino con ese email');
    }

    if (dto.dni) {
      const dniExists = await this.tenantRepository.existsByDni(dto.dni, ownerId, id);
      if (dniExists) throw new ConflictException('Ya existe un inquilino con ese DNI');
    }

    if (dto.propertyId) {
      const property = await this.tenantRepository.findPropertyByOwner(dto.propertyId, ownerId);
      if (!property) throw new NotFoundException('Propiedad no encontrada');
    }

    const updated = await this.tenantRepository.update(id, dto);

    void this.notificationsService.logActivity(ownerId, {
      action: 'TENANT_UPDATED',
      entityType: 'Tenant',
      entityId: id,
      descripcion: `Inquilino "${updated.nombre} ${updated.apellido}" actualizado`,
    });

    return updated;
  }

  async remove(id: string, ownerId: string | undefined) {
    const tenant = await this.findOne(id, ownerId);
    await this.tenantRepository.softDelete(id);

    if (ownerId) {
      void this.notificationsService.logActivity(ownerId, {
        action: 'TENANT_DELETED',
        entityType: 'Tenant',
        entityId: id,
        descripcion: `Inquilino "${tenant.nombre} ${tenant.apellido}" eliminado`,
      });
    }
  }
}
