import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
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
import { ContractResponseDto, PaginatedContractsResponseDto } from './dto/contract-response.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { QueryContractsDto } from './dto/query-contracts.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ContractsService } from './contracts.service';

@ApiTags('Contratos')
@ApiBearerAuth('JWT-auth')
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo contrato' })
  @ApiCreatedResponse({ type: ContractResponseDto })
  @ApiNotFoundResponse({ description: 'Propiedad o inquilino no encontrado' })
  @ApiConflictResponse({ description: 'La propiedad ya tiene un contrato activo' })
  @ApiBadRequestResponse({ description: 'Fechas inválidas o validación fallida' })
  create(@CurrentUser('id') ownerId: string, @Body() dto: CreateContractDto) {
    return this.contractsService.create(ownerId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar contratos con filtros, búsqueda y paginación' })
  @ApiOkResponse({ type: PaginatedContractsResponseDto })
  findAll(@CurrentUser('id') ownerId: string, @Query() query: QueryContractsDto) {
    return this.contractsService.findAll(ownerId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un contrato por ID (con pagos, propiedad e inquilino)' })
  @ApiOkResponse({ type: ContractResponseDto })
  @ApiNotFoundResponse({ description: 'Contrato no encontrado' })
  findOne(@Param('id') id: string, @CurrentUser('id') ownerId: string) {
    return this.contractsService.findOne(id, ownerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un contrato' })
  @ApiOkResponse({ type: ContractResponseDto })
  @ApiNotFoundResponse({ description: 'Contrato no encontrado' })
  @ApiBadRequestResponse({ description: 'No se puede modificar un contrato cancelado o fechas inválidas' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: UpdateContractDto,
  ) {
    return this.contractsService.update(id, ownerId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancelar un contrato y liberar la propiedad' })
  @ApiNotFoundResponse({ description: 'Contrato no encontrado' })
  @ApiBadRequestResponse({ description: 'El contrato ya está cancelado' })
  remove(@Param('id') id: string, @CurrentUser('id') ownerId: string) {
    return this.contractsService.remove(id, ownerId);
  }
}
