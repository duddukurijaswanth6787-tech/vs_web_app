import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OtpGatewayService } from './otp-gateway.service';
import { UpdateOtpGatewayConfigDto } from './otp-gateway.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '@domains/auth/guards/permissions.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('OTP Gateway')
@Controller('admin/otp-gateway')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class OtpGatewayController {
  constructor(private readonly otpGatewayService: OtpGatewayService) {}

  @Get('config')
  @Permissions('settings:view')
  @ApiOperation({ summary: 'Get OTP gateway configuration' })
  async getConfig() {
    return ResponseBuilder.success(await this.otpGatewayService.getConfig());
  }

  @Put('config')
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Update OTP gateway configuration' })
  async updateConfig(
    @Body() dto: UpdateOtpGatewayConfigDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.otpGatewayService.updateConfig(dto, user.sub),
      'OTP gateway config updated',
    );
  }
}
