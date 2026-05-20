import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PaginatedPropertiesResponseDto, PropertyResponseDto } from './dto/property-response.dto';
import { QueryPropertiesDto } from './dto/query-properties.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

@ApiTags('Propiedades')
@ApiBearerAuth('JWT-auth')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva propiedad' })
  @ApiCreatedResponse({ type: PropertyResponseDto })
  create(@CurrentUser('id') ownerId: string, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(ownerId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar propiedades con filtros, búsqueda y paginación' })
  @ApiOkResponse({ type: PaginatedPropertiesResponseDto })
  findAll(@CurrentUser('id') ownerId: string, @Query() query: QueryPropertiesDto) {
    return this.propertiesService.findAll(ownerId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una propiedad por ID' })
  @ApiOkResponse({ type: PropertyResponseDto })
  @ApiNotFoundResponse({ description: 'Propiedad no encontrada' })
  findOne(@Param('id') id: string, @CurrentUser('id') ownerId: string) {
    return this.propertiesService.findOne(id, ownerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una propiedad' })
  @ApiOkResponse({ type: PropertyResponseDto })
  @ApiNotFoundResponse({ description: 'Propiedad no encontrada' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, ownerId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una propiedad (soft delete)' })
  @ApiNotFoundResponse({ description: 'Propiedad no encontrada' })
  remove(@Param('id') id: string, @CurrentUser('id') ownerId: string) {
    return this.propertiesService.remove(id, ownerId);
  }
}
