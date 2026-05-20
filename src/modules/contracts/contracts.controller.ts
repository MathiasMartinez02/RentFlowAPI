import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';

@ApiTags('Contracts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new contract' })
  create(@Body() dto: CreateContractDto) {
    return this.contractsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all contracts' })
  findAll(@Query() pagination: PaginationDto) {
    return this.contractsService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contract by ID with payments' })
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Delete(':id/terminate')
  @ApiOperation({ summary: 'Terminate a contract' })
  terminate(@Param('id') id: string) {
    return this.contractsService.terminate(id);
  }
}
