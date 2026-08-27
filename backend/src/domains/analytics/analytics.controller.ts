import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsPeriod } from './analytics.types';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin', 'staff')
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('omnichannel')
  @ApiOperation({ summary: 'Get Omnichannel Overview Analytics (POS vs Online)' })
  async getOmnichannel(@Query('period') period?: AnalyticsPeriod) {
    const data = await this.analyticsService.getOmnichannelOverview(period || 'monthly');
    return ResponseBuilder.success(data, 'Omnichannel analytics fetched successfully');
  }

  @Get('offline-pos')
  @ApiOperation({ summary: 'Get POS In-Store Counter Analytics' })
  async getOfflinePos(@Query('period') period?: AnalyticsPeriod) {
    const data = await this.analyticsService.getOfflinePosAnalytics(period || 'monthly');
    return ResponseBuilder.success(data, 'POS analytics fetched successfully');
  }

  @Get('online-sales')
  @ApiOperation({ summary: 'Get E-Commerce Online Store Analytics' })
  async getOnlineSales(@Query('period') period?: AnalyticsPeriod) {
    const data = await this.analyticsService.getOnlineSalesAnalytics(period || 'monthly');
    return ResponseBuilder.success(data, 'Online sales analytics fetched successfully');
  }

  @Get('inventory-velocity')
  @ApiOperation({ summary: 'Get Fast-Moving vs Slow-Moving Inventory Velocity' })
  async getInventoryVelocity() {
    const data = await this.analyticsService.getInventoryVelocityAnalytics();
    return ResponseBuilder.success(data, 'Inventory velocity analytics fetched successfully');
  }
}
