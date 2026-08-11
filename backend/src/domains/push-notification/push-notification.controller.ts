import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PushNotificationService } from './push-notification.service';
import { RegisterDeviceDto, SendPushDto } from './push-notification.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Push Notifications')
@Controller('push')
export class PushNotificationController {
  constructor(private readonly pushService: PushNotificationService) {}

  @Post('devices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register device for push notifications' })
  async register(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterDeviceDto,
  ) {
    return ResponseBuilder.created(
      await this.pushService.registerDevice(user.sub, dto),
      'Device registered',
    );
  }

  @Get('devices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my registered devices' })
  async myDevices(@CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.pushService.listMyDevices(user.sub),
    );
  }

  @Delete('devices/:token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unregister push device' })
  async unregister(
    @CurrentUser() user: JwtPayload,
    @Param('token') token: string,
  ) {
    return ResponseBuilder.success(
      await this.pushService.unregisterDevice(user.sub, token),
      'Device unregistered',
    );
  }

  @Post('send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: send push notification' })
  async send(@CurrentUser() user: JwtPayload, @Body() dto: SendPushDto) {
    return ResponseBuilder.success(
      await this.pushService.send(dto, user.sub),
      'Push queued',
    );
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list push logs' })
  async logs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return ResponseBuilder.success(
      await this.pushService.listLogs(Number(page) || 1, Number(limit) || 20),
    );
  }
}
