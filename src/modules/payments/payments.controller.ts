import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaginatedPaymentsResponseDto, PaymentResponseDto, PaymentStatsResponseDto } from './dto/payment-response.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Pagos')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo pago' })
  @ApiCreatedResponse({ type: PaymentResponseDto })
  @ApiNotFoundResponse({ description: 'Contrato no encontrado' })
  @ApiConflictResponse({ description: 'Ya existe un pago para ese contrato y período' })
  @ApiBadRequestResponse({ description: 'fechaPago obligatoria en estado PAGADO' })
  create(@CurrentUser('id') ownerId: string, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(ownerId, dto);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Obtener métricas financieras del mes actual' })
  @ApiOkResponse({ type: PaymentStatsResponseDto })
  getOverview(@CurrentUser('id') ownerId: string) {
    return this.paymentsService.getOverview(ownerId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar pagos con filtros, búsqueda y paginación' })
  @ApiOkResponse({ type: PaginatedPaymentsResponseDto })
  findAll(@CurrentUser('id') ownerId: string, @Query() query: QueryPaymentsDto) {
    return this.paymentsService.findAll(ownerId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un pago por ID' })
  @ApiOkResponse({ type: PaymentResponseDto })
  @ApiNotFoundResponse({ description: 'Pago no encontrado' })
  findOne(@Param('id') id: string, @CurrentUser('id') ownerId: string) {
    return this.paymentsService.findOne(id, ownerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un pago (estado, método, referencias, etc.)' })
  @ApiOkResponse({ type: PaymentResponseDto })
  @ApiNotFoundResponse({ description: 'Pago no encontrado' })
  @ApiBadRequestResponse({ description: 'Pago cancelado o validación de fechaPago fallida' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, ownerId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancelar un pago (soft delete)' })
  @ApiNotFoundResponse({ description: 'Pago no encontrado' })
  @ApiBadRequestResponse({ description: 'El pago ya está cancelado' })
  remove(@Param('id') id: string, @CurrentUser('id') ownerId: string) {
    return this.paymentsService.remove(id, ownerId);
  }
}
