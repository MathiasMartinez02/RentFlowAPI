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
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CanManageTenants } from '../../common/decorators/admin-only.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/enums/role.enum';
import { AuthUser, resolveOwnerId } from '../../common/helpers/resolve-owner.helper';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { PaginatedTenantsResponseDto, TenantResponseDto } from './dto/tenant-response.dto';
import { QueryTenantsDto } from './dto/query-tenants.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';

@ApiTags('Inquilinos')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @CanManageTenants()
  @ApiOperation({ summary: 'Crear un nuevo inquilino [ADMIN/CLIENTE/VENDEDOR/SUPER_ADMIN]' })
  @ApiCreatedResponse({ type: TenantResponseDto })
  @ApiConflictResponse({ description: 'Email o DNI ya registrado para este usuario' })
  @ApiNotFoundResponse({ description: 'Propiedad no encontrada al intentar asignarla' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTenantDto) {
    const ownerId = resolveOwnerId(user) ?? user.id;
    return this.tenantsService.create(ownerId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar inquilinos con filtros y paginación' })
  @ApiOkResponse({ type: PaginatedTenantsResponseDto })
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryTenantsDto) {
    // INQUILINO only sees their own record
    if (user.role === Role.INQUILINO) {
      if (!user.linkedTenantId) throw new ForbiddenException('Sin perfil de inquilino vinculado');
      return this.tenantsService.findOne(user.linkedTenantId, undefined);
    }
    return this.tenantsService.findAll(resolveOwnerId(user), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un inquilino por ID' })
  @ApiOkResponse({ type: TenantResponseDto })
  @ApiNotFoundResponse({ description: 'Inquilino no encontrado' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    // INQUILINO can only see their own record
    if (user.role === Role.INQUILINO && id !== user.linkedTenantId) {
      throw new ForbiddenException('Acceso denegado');
    }
    return this.tenantsService.findOne(id, resolveOwnerId(user));
  }

  @Patch(':id')
  @CanManageTenants()
  @ApiOperation({ summary: 'Actualizar un inquilino [ADMIN/CLIENTE/VENDEDOR/SUPER_ADMIN]' })
  @ApiOkResponse({ type: TenantResponseDto })
  @ApiNotFoundResponse({ description: 'Inquilino no encontrado' })
  @ApiConflictResponse({ description: 'Email o DNI ya registrado para este usuario' })
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateTenantDto) {
    const ownerId = resolveOwnerId(user) ?? user.id;
    return this.tenantsService.update(id, ownerId, dto);
  }

  @Delete(':id')
  @CanManageTenants()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Dar de baja un inquilino (soft delete) [ADMIN/CLIENTE/VENDEDOR/SUPER_ADMIN]',
  })
  @ApiNotFoundResponse({ description: 'Inquilino no encontrado' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.tenantsService.remove(id, resolveOwnerId(user));
  }
}
