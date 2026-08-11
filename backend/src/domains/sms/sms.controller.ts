import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { SendSmsDto, SendOrderSmsDto } from './sms.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('SMS')
@Controller('sms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'admin', 'staff')
@ApiBearerAuth()
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send SMS (order/OTP/custom)' })
  async send(@CurrentUser() user: JwtPayload, @Body() dto: SendSmsDto) {
    return ResponseBuilder.success(
      await this.smsService.send(dto, user.sub),
      'SMS queued',
    );
  }

  @Post('order')
  @ApiOperation({ summary: 'Send order status SMS' })
  async orderSms(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SendOrderSmsDto,
  ) {
    return ResponseBuilder.success(
      await this.smsService.sendOrderSms(dto, user.sub),
      'Order SMS queued',
    );
  }

  @Get('logs')
  @ApiOperation({ summary: 'List SMS logs' })
  async logs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return ResponseBuilder.success(
      await this.smsService.listLogs(Number(page) || 1, Number(limit) || 20),
    );
  }
}
