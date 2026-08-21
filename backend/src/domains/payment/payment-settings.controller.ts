import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { UpdateRazorpayConfigDto } from './payment.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '@domains/auth/guards/permissions.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Payment Settings')
@Controller('admin/payment-settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PaymentSettingsController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('razorpay')
  @Permissions('settings:view')
  @ApiOperation({ summary: 'Get Razorpay credentials configuration' })
  async getConfig() {
    return ResponseBuilder.success(await this.paymentService.getConfig());
  }

  @Put('razorpay')
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Set Razorpay credentials' })
  async updateConfig(
    @Body() dto: UpdateRazorpayConfigDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.paymentService.updateConfig(dto, user.sub),
      'Razorpay configuration saved',
    );
  }
}
