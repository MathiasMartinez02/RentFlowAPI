import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
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
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'KPIs generales: propiedades, contratos, pagos y mantenimiento',
  })
  @ApiOkResponse({ type: DashboardOverviewDto })
  getOverview(@CurrentUser('id') ownerId: string) {
    return this.dashboardService.getOverview(ownerId);
  }

  @Get('revenue')
  @ApiOperation({
    summary: 'Analytics de ingresos: últimos 12 meses, comparativa anual y mejor mes',
  })
  @ApiOkResponse({ type: RevenueAnalyticsDto })
  getRevenue(@CurrentUser('id') ownerId: string) {
    return this.dashboardService.getRevenueAnalytics(ownerId);
  }

  @Get('occupancy')
  @ApiOperation({
    summary: 'Analytics de ocupación: tasa global y distribución por tipo de propiedad',
  })
  @ApiOkResponse({ type: OccupancyAnalyticsDto })
  getOccupancy(@CurrentUser('id') ownerId: string) {
    return this.dashboardService.getOccupancyAnalytics(ownerId);
  }

  @Get('payments')
  @ApiOperation({
    summary: 'Analytics financieros: collection rate, mora, distribución por método y estado',
  })
  @ApiOkResponse({ type: PaymentsAnalyticsDto })
  getPayments(@CurrentUser('id') ownerId: string) {
    return this.dashboardService.getPaymentsAnalytics(ownerId);
  }

  @Get('maintenance')
  @ApiOperation({
    summary: 'Analytics de mantenimiento: costos, tiempo de resolución y distribución',
  })
  @ApiOkResponse({ type: MaintenanceAnalyticsDto })
  getMaintenance(@CurrentUser('id') ownerId: string) {
    return this.dashboardService.getMaintenanceAnalytics(ownerId);
  }

  @Get('activity')
  @ApiOperation({
    summary: 'Actividad reciente: últimos pagos, contratos, tickets y log de actividad',
  })
  getActivity(@CurrentUser('id') ownerId: string) {
    return this.dashboardService.getRecentActivity(ownerId);
  }
}
