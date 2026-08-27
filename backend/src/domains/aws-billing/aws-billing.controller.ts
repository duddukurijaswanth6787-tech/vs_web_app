import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AwsBillingService } from './aws-billing.service';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { ResponseBuilder } from '@common/responses/response.builder';

@ApiTags('AWS Billing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('aws-billing')
export class AwsBillingController {
  constructor(private readonly awsBillingService: AwsBillingService) {}

  @Get()
  @ApiOperation({ summary: 'Get AWS Billing & Storage Summary' })
  async getBillingSummary() {
    const summary = await this.awsBillingService.getBillingSummary();
    return ResponseBuilder.success(summary, 'AWS billing summary fetched successfully');
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync AWS Billing Data' })
  async syncBillingData() {
    const summary = await this.awsBillingService.getBillingSummary();
    return ResponseBuilder.success(summary, 'AWS billing data synced successfully');
  }
}
