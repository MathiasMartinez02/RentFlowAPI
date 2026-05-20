import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MaintenanceStatus } from '@prisma/client';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { MaintenanceService } from './maintenance.service';

class UpdateStatusDto {
  @IsEnum(MaintenanceStatus)
  status: MaintenanceStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

@ApiTags('Maintenance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a maintenance ticket' })
  create(@Body() dto: CreateMaintenanceDto) {
    return this.maintenanceService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all maintenance tickets' })
  findAll(@Query() pagination: PaginationDto) {
    return this.maintenanceService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update ticket status' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.maintenanceService.updateStatus(id, dto.status, dto.notes);
  }
}
