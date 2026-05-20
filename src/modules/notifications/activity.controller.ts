import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QueryActivityDto } from './dto/query-activity.dto';
import { PaginatedActivityResponseDto } from './dto/notification-response.dto';
import { ActivityService } from './activity.service';

@ApiTags('Activity Feed')
@ApiBearerAuth('JWT-auth')
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
