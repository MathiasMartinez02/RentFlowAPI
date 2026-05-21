import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryActivityDto } from './dto/query-activity.dto';
import { PaginatedActivityResponseDto } from './dto/notification-response.dto';
import { ActivityService } from './activity.service';

@ApiTags('Actividad')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @ApiOperation({ summary: 'Listar activity feed con filtros, búsqueda y paginación' })
  @ApiOkResponse({ type: PaginatedActivityResponseDto })
  findAll(@CurrentUser('id') userId: string, @Query() query: QueryActivityDto) {
    return this.activityService.findAll(userId, query);
  }
}
