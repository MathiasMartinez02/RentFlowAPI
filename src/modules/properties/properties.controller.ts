import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CanManageProperties } from '../../common/decorators/admin-only.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser, resolveOwnerId } from '../../common/helpers/resolve-owner.helper';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PaginatedPropertiesResponseDto, PropertyResponseDto } from './dto/property-response.dto';
import { QueryPropertiesDto } from './dto/query-properties.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

@ApiTags('Propiedades')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @CanManageProperties()
  @ApiOperation({ summary: 'Crear una nueva propiedad [ADMIN/CLIENTE/SUPER_ADMIN]' })
  @ApiCreatedResponse({ type: PropertyResponseDto })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePropertyDto) {
    const ownerId = resolveOwnerId(user) ?? user.id;
    return this.propertiesService.create(ownerId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar propiedades con filtros y paginación' })
  @ApiOkResponse({ type: PaginatedPropertiesResponseDto })
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryPropertiesDto) {
    return this.propertiesService.findAll(resolveOwnerId(user), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una propiedad por ID' })
  @ApiOkResponse({ type: PropertyResponseDto })
  @ApiNotFoundResponse({ description: 'Propiedad no encontrada' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.propertiesService.findOne(id, resolveOwnerId(user));
  }

  @Patch(':id')
  @CanManageProperties()
  @ApiOperation({ summary: 'Actualizar una propiedad [ADMIN/CLIENTE/SUPER_ADMIN]' })
  @ApiOkResponse({ type: PropertyResponseDto })
  @ApiNotFoundResponse({ description: 'Propiedad no encontrada' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, resolveOwnerId(user), dto);
  }

  @Delete(':id')
  @CanManageProperties()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una propiedad (soft delete) [ADMIN/CLIENTE/SUPER_ADMIN]' })
  @ApiNotFoundResponse({ description: 'Propiedad no encontrada' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.propertiesService.remove(id, resolveOwnerId(user));
  }
}
