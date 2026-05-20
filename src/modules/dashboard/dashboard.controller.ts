import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics for current user' })
  getStats(@CurrentUser('id') ownerId: string) {
    return this.dashboardService.getStats(ownerId);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent activity feed' })
  getRecentActivity(@CurrentUser('id') ownerId: string) {
    return this.dashboardService.getRecentActivity(ownerId);
  }
}
