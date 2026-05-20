import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { PaginatedTenantsResponseDto, TenantResponseDto } from './dto/tenant-response.dto';
import { QueryTenantsDto } from './dto/query-tenants.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';

@ApiTags('Inquilinos')
@ApiBearerAuth('JWT-auth')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo inquilino' })
  @ApiCreatedResponse({ type: TenantResponseDto })
  @ApiConflictResponse({ description: 'Email o DNI ya registrado para este usuario' })
  @ApiNotFoundResponse({ description: 'Propiedad no encontrada al intentar asignarla' })
  create(@CurrentUser('id') ownerId: string, @Body() dto: CreateTenantDto) {
    return this.tenantsService.create(ownerId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar inquilinos con filtros, búsqueda y paginación' })
  @ApiOkResponse({ type: PaginatedTenantsResponseDto })
  findAll(@CurrentUser('id') ownerId: string, @Query() query: QueryTenantsDto) {
    return this.tenantsService.findAll(ownerId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un inquilino por ID' })
  @ApiOkResponse({ type: TenantResponseDto })
  @ApiNotFoundResponse({ description: 'Inquilino no encontrado' })
  findOne(@Param('id') id: string, @CurrentUser('id') ownerId: string) {
    return this.tenantsService.findOne(id, ownerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un inquilino' })
  @ApiOkResponse({ type: TenantResponseDto })
  @ApiNotFoundResponse({ description: 'Inquilino no encontrado' })
  @ApiConflictResponse({ description: 'Email o DNI ya registrado para este usuario' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(id, ownerId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Dar de baja un inquilino (soft delete)' })
  @ApiNotFoundResponse({ description: 'Inquilino no encontrado' })
  remove(@Param('id') id: string, @CurrentUser('id') ownerId: string) {
    return this.tenantsService.remove(id, ownerId);
  }
}
