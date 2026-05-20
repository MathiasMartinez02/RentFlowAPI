import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
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
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un ticket de mantenimiento' })
  @ApiCreatedResponse({ type: MaintenanceResponseDto })
  @ApiNotFoundResponse({ description: 'Propiedad o inquilino no encontrado' })
  create(@CurrentUser('id') ownerId: string, @Body() dto: CreateMaintenanceDto) {
    return this.maintenanceService.create(ownerId, dto);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Obtener métricas de mantenimiento' })
  @ApiOkResponse({ type: MaintenanceStatsResponseDto })
  getOverview(@CurrentUser('id') ownerId: string) {
    return this.maintenanceService.getOverview(ownerId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tickets con filtros, búsqueda y paginación' })
  @ApiOkResponse({ type: PaginatedMaintenanceResponseDto })
  findAll(@CurrentUser('id') ownerId: string, @Query() query: QueryMaintenanceDto) {
    return this.maintenanceService.findAll(ownerId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un ticket por ID' })
  @ApiOkResponse({ type: MaintenanceResponseDto })
  @ApiNotFoundResponse({ description: 'Ticket no encontrado' })
  findOne(@Param('id') id: string, @CurrentUser('id') ownerId: string) {
    return this.maintenanceService.findOne(id, ownerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un ticket (estado, costos, asignación, etc.)' })
  @ApiOkResponse({ type: MaintenanceResponseDto })
  @ApiNotFoundResponse({ description: 'Ticket no encontrado' })
  @ApiBadRequestResponse({ description: 'Ticket cerrado o validación fallida' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: UpdateMaintenanceDto,
  ) {
    return this.maintenanceService.update(id, ownerId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cerrar un ticket (soft delete)' })
  @ApiNotFoundResponse({ description: 'Ticket no encontrado' })
  @ApiBadRequestResponse({ description: 'El ticket ya está cerrado' })
  remove(@Param('id') id: string, @CurrentUser('id') ownerId: string) {
    return this.maintenanceService.remove(id, ownerId);
  }
}
