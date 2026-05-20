import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePropertyDto } from './dto/create-property.dto';
import { FilterPropertyDto } from './dto/filter-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

@ApiTags('Properties')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new property' })
  @ApiResponse({ status: 201, description: 'Property created successfully' })
  create(@CurrentUser('id') ownerId: string, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(ownerId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all properties for current user' })
  findAll(@CurrentUser('id') ownerId: string, @Query() filters: FilterPropertyDto) {
    return this.propertiesService.findAll(ownerId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get property by ID' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  findOne(@Param('id') id: string, @CurrentUser('id') ownerId: string) {
    return this.propertiesService.findOne(id, ownerId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update property' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') ownerId: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, ownerId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete property (soft delete)' })
  remove(@Param('id') id: string, @CurrentUser('id') ownerId: string) {
    return this.propertiesService.remove(id, ownerId);
  }
}
