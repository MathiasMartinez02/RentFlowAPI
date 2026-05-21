import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CanManageContracts } from '../../common/decorators/admin-only.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/enums/role.enum';
import { AuthUser, resolveOwnerId } from '../../common/helpers/resolve-owner.helper';
import { ContractResponseDto, PaginatedContractsResponseDto } from './dto/contract-response.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { QueryContractsDto } from './dto/query-contracts.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ContractsService } from './contracts.service';

@ApiTags('Contratos')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @CanManageContracts()
  @ApiOperation({ summary: 'Crear un nuevo contrato [ADMIN/CLIENTE/VENDEDOR/SUPER_ADMIN]' })
  @ApiCreatedResponse({ type: ContractResponseDto })
  @ApiNotFoundResponse({ description: 'Propiedad o inquilino no encontrado' })
  @ApiConflictResponse({ description: 'La propiedad ya tiene un contrato activo' })
  @ApiBadRequestResponse({ description: 'Fechas inválidas o validación fallida' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateContractDto) {
    const ownerId = resolveOwnerId(user) ?? user.id;
    return this.contractsService.create(ownerId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar contratos con filtros y paginación' })
  @ApiOkResponse({ type: PaginatedContractsResponseDto })
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryContractsDto) {
    // INQUILINO only sees their own contracts
    if (user.role === Role.INQUILINO) {
      if (!user.linkedTenantId) throw new ForbiddenException('Sin perfil de inquilino vinculado');
      query.tenantId = user.linkedTenantId;
      return this.contractsService.findAll(undefined, query);
    }
    return this.contractsService.findAll(resolveOwnerId(user), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un contrato por ID (con pagos, propiedad e inquilino)' })
  @ApiOkResponse({ type: ContractResponseDto })
  @ApiNotFoundResponse({ description: 'Contrato no encontrado' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const contract = await this.contractsService.findOne(id, resolveOwnerId(user));
    if (user.role === Role.INQUILINO && contract.tenantId !== user.linkedTenantId) {
      throw new ForbiddenException('Acceso denegado');
    }
    return contract;
  }

  @Patch(':id')
  @CanManageContracts()
  @ApiOperation({ summary: 'Actualizar un contrato [ADMIN/CLIENTE/VENDEDOR/SUPER_ADMIN]' })
  @ApiOkResponse({ type: ContractResponseDto })
  @ApiNotFoundResponse({ description: 'Contrato no encontrado' })
  @ApiBadRequestResponse({ description: 'No se puede modificar un contrato cancelado o fechas inválidas' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateContractDto,
  ) {
    const ownerId = resolveOwnerId(user) ?? user.id;
    return this.contractsService.update(id, ownerId, dto);
  }

  @Delete(':id')
  @CanManageContracts()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancelar un contrato y liberar la propiedad [ADMIN/CLIENTE/VENDEDOR/SUPER_ADMIN]' })
  @ApiNotFoundResponse({ description: 'Contrato no encontrado' })
  @ApiBadRequestResponse({ description: 'El contrato ya está cancelado' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const ownerId = resolveOwnerId(user) ?? user.id;
    return this.contractsService.remove(id, ownerId);
  }
}
