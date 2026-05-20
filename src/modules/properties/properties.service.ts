import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PropertyRepository } from './repositories/property.repository';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { QueryPropertiesDto } from './dto/query-properties.dto';

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(private readonly propertyRepository: PropertyRepository) {}

  async create(ownerId: string, dto: CreatePropertyDto) {
    const property = await this.propertyRepository.create(ownerId, dto);
    this.logger.log(`Propiedad creada: ${property.id} por usuario ${ownerId}`);
    return property;
  }

  async findAll(ownerId: string, query: QueryPropertiesDto) {
    return this.propertyRepository.findMany(ownerId, query);
  }

  async findOne(id: string, ownerId: string) {
    const property = await this.propertyRepository.findById(id, ownerId);
    if (!property) throw new NotFoundException(`Propiedad ${id} no encontrada`);
    return property;
  }

  async update(id: string, ownerId: string, dto: UpdatePropertyDto) {
    await this.findOne(id, ownerId);
    return this.propertyRepository.update(id, dto);
  }

  async remove(id: string, ownerId: string) {
    await this.findOne(id, ownerId);
    await this.propertyRepository.softDelete(id);
  }
}
