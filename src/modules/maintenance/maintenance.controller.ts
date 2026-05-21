import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CanManageMaintenance } from '../../common/decorators/admin-only.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { AuthUser, resolveOwnerId } from '../../common/helpers/resolve-owner.helper';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { QueryMaintenanceDto } from './dto/query-maintenance.dto';
import {
  MaintenanceResponseDto,
  MaintenanceStatsResponseDto,
  PaginatedMaintenanceResponseDto,
} from './dto/maintenance-response.dto';
import { MaintenanceService } from './maintenance.service';

@ApiTags('Mantenimiento')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CLIENTE, Role.MANTENIMIENTO, Role.INQUILINO)
  @ApiOperation({ summary: 'Crear un ticket de mantenimiento [todos los roles]' })
  @ApiCreatedResponse({ type: MaintenanceResponseDto })
  @ApiNotFoundResponse({ description: 'Propiedad o inquilino no encontrado' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMaintenanceDto) {
    const ownerId = resolveOwnerId(user) ?? user.id;
    return this.maintenanceService.create(ownerId, dto);
  }

  @Get('stats/overview')
  @CanManageMaintenance()
  @ApiOperation({ summary: 'Obtener métricas de mantenimiento [ADMIN/CLIENTE/MANTENIMIENTO/SUPER_ADMIN]' })
  @ApiOkResponse({ type: MaintenanceStatsResponseDto })
  getOverview(@CurrentUser() user: AuthUser) {
    return this.maintenanceService.getOverview(resolveOwnerId(user));
  }

  @Get()
  @ApiOperation({ summary: 'Listar tickets con filtros y paginación' })
  @ApiOkResponse({ type: PaginatedMaintenanceResponseDto })
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryMaintenanceDto) {
    if (user.role === Role.INQUILINO) {
      if (!user.linkedTenantId) throw new ForbiddenException('Sin perfil de inquilino vinculado');
      query.tenantId = user.linkedTenantId;
      return this.maintenanceService.findAll(undefined, query);
    }
    return this.maintenanceService.findAll(resolveOwnerId(user), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un ticket por ID' })
  @ApiOkResponse({ type: MaintenanceResponseDto })
  @ApiNotFoundResponse({ description: 'Ticket no encontrado' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const ticket = await this.maintenanceService.findOne(id, resolveOwnerId(user));
    if (user.role === Role.INQUILINO && ticket.tenantId !== user.linkedTenantId) {
      throw new ForbiddenException('Acceso denegado');
    }
    return ticket;
  }

  @Patch(':id')
  @CanManageMaintenance()
  @ApiOperation({ summary: 'Actualizar un ticket [ADMIN/CLIENTE/MANTENIMIENTO/SUPER_ADMIN]' })
  @ApiOkResponse({ type: MaintenanceResponseDto })
  @ApiNotFoundResponse({ description: 'Ticket no encontrado' })
  @ApiBadRequestResponse({ description: 'Ticket cerrado o validación fallida' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateMaintenanceDto,
  ) {
    const ownerId = resolveOwnerId(user) ?? user.id;
    return this.maintenanceService.update(id, ownerId, dto);
  }

  @Delete(':id')
  @CanManageMaintenance()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cerrar un ticket (soft delete) [ADMIN/CLIENTE/MANTENIMIENTO/SUPER_ADMIN]' })
  @ApiNotFoundResponse({ description: 'Ticket no encontrado' })
  @ApiBadRequestResponse({ description: 'El ticket ya está cerrado' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.maintenanceService.remove(id, resolveOwnerId(user));
  }
}
