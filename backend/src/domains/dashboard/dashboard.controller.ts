import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '@domains/auth/guards/permissions.guard';
import { ResponseBuilder } from '@common/responses/response.builder';

@ApiTags('Dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('dashboard:view')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary' })
  async getSummary() {
    return ResponseBuilder.success(await this.dashboardService.getSummary());
  }

  @Get('sales-chart')
  @ApiOperation({ summary: 'Get sales chart data' })
  async getSalesChart(@Query('period') period?: string) {
    return ResponseBuilder.success(
      await this.dashboardService.getSalesChart(period),
    );
  }

  @Get('order-analytics')
  @ApiOperation({ summary: 'Order status breakdown' })
  async getOrderAnalytics(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return ResponseBuilder.success(
      await this.dashboardService.getOrderAnalytics(dateFrom, dateTo),
    );
  }

  @Get('payment-analytics')
  @ApiOperation({ summary: 'Payment method breakdown' })
  async getPaymentAnalytics(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return ResponseBuilder.success(
      await this.dashboardService.getPaymentAnalytics(dateFrom, dateTo),
    );
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Recent orders, products, customers, reviews' })
  async getRecentActivity() {
    return ResponseBuilder.success(
      await this.dashboardService.getRecentActivity(),
    );
  }
}
