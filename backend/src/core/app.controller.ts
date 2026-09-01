import { Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { AwsBillingService } from '../domains/aws-billing/aws-billing.service';
import { AnalyticsService } from '../domains/analytics/analytics.service';
import { AnalyticsPeriod } from '../domains/analytics/analytics.types';
import { ResponseBuilder } from '@common/responses/response.builder';

import { PrismaService } from '@database/prisma.service';

/**
 * Root Application Controller exposing default heartbeat routes, AWS Billing endpoints & Analytics fallbacks.
 */
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly awsBillingService: AwsBillingService,
    private readonly analyticsService: AnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get('sync-barcode')
  async syncBarcodeDirect() {
    const updated = await this.prisma.productVariant.updateMany({
      where: { sku: 'COL1-XL' },
      data: { barcode: '890351069409' },
    });
    return ResponseBuilder.success(updated, 'Barcode synced successfully');
  }

  // Analytics direct routes for 100% guaranteed registration
  @Get('analytics/omnichannel')
  async getOmnichannelDirect(@Query('period') period?: AnalyticsPeriod) {
    const data = await this.analyticsService.getOmnichannelOverview(period || 'monthly');
    return ResponseBuilder.success(data, 'Omnichannel analytics fetched successfully');
  }

  @Get('analytics/offline-pos')
  async getOfflinePosDirect(@Query('period') period?: AnalyticsPeriod) {
    const data = await this.analyticsService.getOfflinePosAnalytics(period || 'monthly');
    return ResponseBuilder.success(data, 'POS analytics fetched successfully');
  }

  @Get('analytics/online-sales')
  async getOnlineSalesDirect(@Query('period') period?: AnalyticsPeriod) {
    const data = await this.analyticsService.getOnlineSalesAnalytics(period || 'monthly');
    return ResponseBuilder.success(data, 'Online sales analytics fetched successfully');
  }

  @Get('analytics/inventory-velocity')
  async getInventoryVelocityDirect() {
    const data = await this.analyticsService.getInventoryVelocityAnalytics();
    return ResponseBuilder.success(data, 'Inventory velocity analytics fetched successfully');
  }

  @Post('analytics/sync')
  async syncAnalyticsDirect() {
    const data = await this.analyticsService.getOmnichannelOverview('monthly');
    return ResponseBuilder.success(data, 'Analytics synced successfully');
  }

  // AWS Billing direct routes
  @Get('aws-billing')
  async getAwsBilling() {
    const summary = await this.awsBillingService.getBillingSummary();
    return ResponseBuilder.success(summary, 'AWS billing summary fetched successfully');
  }

  @Post('aws-billing/sync')
  async syncAwsBilling() {
    const summary = await this.awsBillingService.getBillingSummary();
    return ResponseBuilder.success(summary, 'AWS billing data synced successfully');
  }

  @Get('admin/aws-billing')
  async getAdminAwsBilling() {
    const summary = await this.awsBillingService.getBillingSummary();
    return ResponseBuilder.success(summary, 'AWS billing summary fetched successfully');
  }

  @Post('admin/aws-billing/sync')
  async syncAdminAwsBilling() {
    const summary = await this.awsBillingService.getBillingSummary();
    return ResponseBuilder.success(summary, 'AWS billing data synced successfully');
  }
}
