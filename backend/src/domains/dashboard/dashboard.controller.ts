import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import type { JwtPayload } from '@domains/auth/services/jwt.service';
import {
  PermissionsGuard,
  Permissions,
} from '@domains/auth/guards/permissions.guard';
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
  async getSummary(
    @CurrentUser() user: JwtPayload,
    @Query('channel') channel?: string,
    @Query('scope') scope?: string,
  ) {
    return ResponseBuilder.success(
      await this.dashboardService.getSummary(user, channel, scope),
    );
  }

  @Get('sales-chart')
  @ApiOperation({ summary: 'Get sales chart data' })
  async getSalesChart(
    @CurrentUser() user: JwtPayload,
    @Query('period') period?: string,
  ) {
    return ResponseBuilder.success(
      await this.dashboardService.getSalesChart(period, user),
    );
  }

  @Get('order-analytics')
  @ApiOperation({ summary: 'Order status breakdown' })
  async getOrderAnalytics(
    @CurrentUser() user: JwtPayload,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return ResponseBuilder.success(
      await this.dashboardService.getOrderAnalytics(dateFrom, dateTo, user),
    );
  }

  @Get('payment-analytics')
  @ApiOperation({ summary: 'Payment method breakdown' })
  async getPaymentAnalytics(
    @CurrentUser() user: JwtPayload,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return ResponseBuilder.success(
      await this.dashboardService.getPaymentAnalytics(dateFrom, dateTo, user),
    );
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Recent orders, products, customers, reviews' })
  async getRecentActivity(@CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.dashboardService.getRecentActivity(user),
    );
  }
}
