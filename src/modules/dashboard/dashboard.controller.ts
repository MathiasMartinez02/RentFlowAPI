import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { AuthUser, resolveOwnerId } from '../../common/helpers/resolve-owner.helper';
import {
  DashboardOverviewDto,
  MaintenanceAnalyticsDto,
  OccupancyAnalyticsDto,
  PaymentsAnalyticsDto,
  RevenueAnalyticsDto,
} from './dto/dashboard.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CLIENTE, Role.FINANZAS, Role.VENDEDOR, Role.MANTENIMIENTO)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'KPIs generales: propiedades, contratos, pagos y mantenimiento' })
  @ApiOkResponse({ type: DashboardOverviewDto })
  getOverview(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getOverview(resolveOwnerId(user));
  }

  @Get('revenue')
  @ApiOperation({
    summary: 'Analytics de ingresos: últimos 12 meses, comparativa anual y mejor mes',
  })
  @ApiOkResponse({ type: RevenueAnalyticsDto })
  getRevenue(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getRevenueAnalytics(resolveOwnerId(user));
  }

  @Get('occupancy')
  @ApiOperation({
    summary: 'Analytics de ocupación: tasa global y distribución por tipo de propiedad',
  })
  @ApiOkResponse({ type: OccupancyAnalyticsDto })
  getOccupancy(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getOccupancyAnalytics(resolveOwnerId(user));
  }

  @Get('payments')
  @ApiOperation({
    summary: 'Analytics financieros: collection rate, mora, distribución por método y estado',
  })
  @ApiOkResponse({ type: PaymentsAnalyticsDto })
  getPayments(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getPaymentsAnalytics(resolveOwnerId(user));
  }

  @Get('maintenance')
  @ApiOperation({
    summary: 'Analytics de mantenimiento: costos, tiempo de resolución y distribución',
  })
  @ApiOkResponse({ type: MaintenanceAnalyticsDto })
  getMaintenance(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getMaintenanceAnalytics(resolveOwnerId(user));
  }

  @Get('activity')
  @ApiOperation({
    summary: 'Actividad reciente: últimos pagos, contratos, tickets y log de actividad',
  })
  getActivity(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getRecentActivity(resolveOwnerId(user));
  }
}
