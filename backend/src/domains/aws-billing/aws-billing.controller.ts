import { Controller, Get, Post, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AwsBillingService, UpdateAwsCreditsDto } from './aws-billing.service';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
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

  @Get('summary')
  @ApiOperation({ summary: 'Get AWS Billing Summary Alias' })
  async getBillingSummaryAlias() {
    const summary = await this.awsBillingService.getBillingSummary();
    return ResponseBuilder.success(summary, 'AWS billing summary fetched successfully');
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync AWS Billing Data' })
  async syncBillingData() {
    const summary = await this.awsBillingService.getBillingSummary();
    return ResponseBuilder.success(summary, 'AWS billing data synced successfully');
  }

  @Post('credits')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Configure AWS Promotional Credits Details' })
  async updateCredits(@Body() body: UpdateAwsCreditsDto) {
    const summary = await this.awsBillingService.updateCreditsSettings(body);
    return ResponseBuilder.success(summary, 'AWS promotional credits updated successfully');
  }

  @Put('credits')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiOperation({ summary: 'Configure AWS Promotional Credits Details (PUT alias)' })
  async putCredits(@Body() body: UpdateAwsCreditsDto) {
    const summary = await this.awsBillingService.updateCreditsSettings(body);
    return ResponseBuilder.success(summary, 'AWS promotional credits updated successfully');
  }
}

