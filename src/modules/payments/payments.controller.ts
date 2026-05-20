import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a payment record' })
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  findAll(@Query() pagination: PaginationDto) {
    return this.paymentsService.findAll(pagination);
  }

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue payments and mark them' })
  findOverdue() {
    return this.paymentsService.findOverdue();
  }

  @Get('contract/:contractId')
  @ApiOperation({ summary: 'Get payments by contract' })
  findByContract(@Param('contractId') contractId: string) {
    return this.paymentsService.findByContract(contractId);
  }

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Mark a payment as paid' })
  markAsPaid(
    @Param('id') id: string,
    @Query('method') method?: string,
    @Query('reference') reference?: string,
  ) {
    return this.paymentsService.markAsPaid(id, method, reference);
  }
}
