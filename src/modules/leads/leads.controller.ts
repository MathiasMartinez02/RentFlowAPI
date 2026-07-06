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
import { CanManageLeads } from '../../common/decorators/admin-only.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthUser, resolveOwnerId } from '../../common/helpers/resolve-owner.helper';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import {
  LeadResponseDto,
  LeadStatsResponseDto,
  PaginatedLeadsResponseDto,
} from './dto/lead-response.dto';
import { LeadsService } from './leads.service';

@ApiTags('Leads')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @CanManageLeads()
  @ApiOperation({ summary: 'Crear un lead [ADMIN/CLIENTE/VENDEDOR/SUPER_ADMIN]' })
  @ApiCreatedResponse({ type: LeadResponseDto })
  @ApiNotFoundResponse({ description: 'Propiedad no encontrada' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLeadDto) {
    const ownerId = resolveOwnerId(user) ?? user.id;
    return this.leadsService.create(ownerId, dto);
  }

  @Get('stats/overview')
  @CanManageLeads()
  @ApiOperation({
    summary: 'Obtener métricas del pipeline de leads [ADMIN/CLIENTE/VENDEDOR/SUPER_ADMIN]',
  })
  @ApiOkResponse({ type: LeadStatsResponseDto })
  getOverview(@CurrentUser() user: AuthUser) {
    return this.leadsService.getOverview(resolveOwnerId(user));
  }

  @Get()
  @CanManageLeads()
  @ApiOperation({
    summary: 'Listar leads con filtros y paginación [ADMIN/CLIENTE/VENDEDOR/SUPER_ADMIN]',
  })
  @ApiOkResponse({ type: PaginatedLeadsResponseDto })
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryLeadsDto) {
    return this.leadsService.findAll(resolveOwnerId(user), query);
  }

  @Get(':id')
  @CanManageLeads()
  @ApiOperation({ summary: 'Obtener un lead por ID [ADMIN/CLIENTE/VENDEDOR/SUPER_ADMIN]' })
  @ApiOkResponse({ type: LeadResponseDto })
  @ApiNotFoundResponse({ description: 'Lead no encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.leadsService.findOne(id, resolveOwnerId(user));
  }

  @Patch(':id')
  @CanManageLeads()
  @ApiOperation({
    summary:
      'Actualizar un lead (incluye cambio de estado en el pipeline) [ADMIN/CLIENTE/VENDEDOR/SUPER_ADMIN]',
  })
  @ApiOkResponse({ type: LeadResponseDto })
  @ApiNotFoundResponse({ description: 'Lead no encontrado' })
  @ApiBadRequestResponse({ description: 'Validación fallida' })
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateLeadDto) {
    const ownerId = resolveOwnerId(user) ?? user.id;
    return this.leadsService.update(id, ownerId, dto);
  }

  @Delete(':id')
  @CanManageLeads()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un lead (soft delete) [ADMIN/CLIENTE/VENDEDOR/SUPER_ADMIN]' })
  @ApiNotFoundResponse({ description: 'Lead no encontrado' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const ownerId = resolveOwnerId(user) ?? user.id;
    return this.leadsService.remove(id, ownerId);
  }
}
