import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { LeadsService } from '../leads/leads.service';
import { CreatePublicLeadDto } from './dto/create-public-lead.dto';

@Injectable()
export class PublicLeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leadsService: LeadsService,
  ) {}

  async create(dto: CreatePublicLeadDto) {
    const ownerId = await this.resolveOwnerId(dto.propertyId);
    return this.leadsService.create(ownerId, dto);
  }

  /**
   * Un visitante anónimo no tiene ownerId propio. Si consulta por una propiedad puntual,
   * el lead pertenece al dueño de esa propiedad. Si es una consulta general (sin propiedad),
   * se asigna al primer ADMIN/SUPER_ADMIN creado — es una simplificación válida mientras el
   * sistema sirva a una sola inmobiliaria; en la Fase 6 (multi-tenant) esto debe resolverse
   * de verdad (ej. por dominio/subdominio de la request).
   */
  private async resolveOwnerId(propertyId?: string): Promise<string> {
    if (propertyId) {
      const property = await this.prisma.property.findFirst({
        where: { id: propertyId, publicado: true, isActive: true },
        select: { ownerId: true },
      });
      if (!property) throw new NotFoundException('Propiedad no encontrada');
      return property.ownerId;
    }

    const defaultOwner = await this.prisma.user.findFirst({
      where: { role: { in: [Role.SUPER_ADMIN, Role.ADMIN] } },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!defaultOwner) throw new NotFoundException('No hay una inmobiliaria configurada');
    return defaultOwner.id;
  }
}
