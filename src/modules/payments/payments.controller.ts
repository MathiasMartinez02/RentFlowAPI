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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CanManagePayments } from '../../common/decorators/admin-only.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../../common/enums/role.enum';
import { AuthUser, resolveOwnerId } from '../../common/helpers/resolve-owner.helper';
import { CreatePaymentDto } from './dto/create-payment.dto';
import {
  PaginatedPaymentsResponseDto,
  PaymentResponseDto,
  PaymentStatsResponseDto,
} from './dto/payment-response.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Pagos')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @CanManagePayments()
  @ApiOperation({ summary: 'Registrar un nuevo pago [ADMIN/CLIENTE/FINANZAS/SUPER_ADMIN]' })
  @ApiCreatedResponse({ type: PaymentResponseDto })
  @ApiNotFoundResponse({ description: 'Contrato no encontrado' })
  @ApiConflictResponse({ description: 'Ya existe un pago para ese contrato y período' })
  @ApiBadRequestResponse({ description: 'fechaPago obligatoria en estado PAGADO' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePaymentDto) {
    const ownerId = resolveOwnerId(user) ?? user.id;
    return this.paymentsService.create(ownerId, dto);
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Obtener métricas financieras del mes actual' })
  @ApiOkResponse({ type: PaymentStatsResponseDto })
  getOverview(@CurrentUser() user: AuthUser) {
    return this.paymentsService.getOverview(resolveOwnerId(user));
  }

  @Get()
  @ApiOperation({ summary: 'Listar pagos con filtros y paginación' })
  @ApiOkResponse({ type: PaginatedPaymentsResponseDto })
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryPaymentsDto) {
    if (user.role === Role.INQUILINO) {
      if (!user.linkedTenantId) throw new ForbiddenException('Sin perfil de inquilino vinculado');
      query.tenantId = user.linkedTenantId;
      return this.paymentsService.findAll(undefined, query);
    }
    return this.paymentsService.findAll(resolveOwnerId(user), query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un pago por ID' })
  @ApiOkResponse({ type: PaymentResponseDto })
  @ApiNotFoundResponse({ description: 'Pago no encontrado' })
  async findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const payment = await this.paymentsService.findOne(id, resolveOwnerId(user));
    if (user.role === Role.INQUILINO && payment.tenantId !== user.linkedTenantId) {
      throw new ForbiddenException('Acceso denegado');
    }
    return payment;
  }

  @Patch(':id')
  @CanManagePayments()
  @ApiOperation({ summary: 'Actualizar un pago [ADMIN/CLIENTE/FINANZAS/SUPER_ADMIN]' })
  @ApiOkResponse({ type: PaymentResponseDto })
  @ApiNotFoundResponse({ description: 'Pago no encontrado' })
  @ApiBadRequestResponse({ description: 'Pago cancelado o validación de fechaPago fallida' })
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdatePaymentDto) {
    const ownerId = resolveOwnerId(user) ?? user.id;
    return this.paymentsService.update(id, ownerId, dto);
  }

  @Delete(':id')
  @CanManagePayments()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancelar un pago (soft delete) [ADMIN/CLIENTE/FINANZAS/SUPER_ADMIN]' })
  @ApiNotFoundResponse({ description: 'Pago no encontrado' })
  @ApiBadRequestResponse({ description: 'El pago ya está cancelado' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const ownerId = resolveOwnerId(user) ?? user.id;
    return this.paymentsService.remove(id, ownerId);
  }
}
