import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { AwsBillingService } from '../domains/aws-billing/aws-billing.service';
import { ResponseBuilder } from '@common/responses/response.builder';

/**
 * Root Application Controller exposing default heartbeat routes & AWS Billing endpoints.
 */
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly awsBillingService: AwsBillingService,
  ) {}

  /**
   * Retrieves a simple greeting from the application service.
   */
  @Get()
  getHello() {
    return this.appService.getHello();
  }

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
