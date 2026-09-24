import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import {
  UpdateTelegramSettingsDto,
  TelegramWebhookUpdate,
} from './telegram.types';
import {
  JwtAuthGuard,
  CurrentUser,
  Public,
} from '@domains/auth/guards/jwt-auth.guard';
import {
  PermissionsGuard,
  Permissions,
} from '@domains/auth/guards/permissions.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Telegram Automation')
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Telegram Bot incoming Webhook' })
  async handleWebhook(@Body() update: TelegramWebhookUpdate) {
    // Process asynchronously so Telegram gets instant 200 OK
    this.telegramService.handleWebhookUpdate(update).catch(() => {});
    return { ok: true };
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Telegram automation settings and templates' })
  async getSettings() {
    return ResponseBuilder.success(await this.telegramService.getSettings());
  }

  @Put('settings')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings:update')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update Telegram automation settings, allowed IDs, and templates',
  })
  async updateSettings(
    @Body() dto: UpdateTelegramSettingsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.telegramService.updateSettings(dto, user.sub),
      'Telegram settings updated successfully',
    );
  }

  @Post('test')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a test alert message to verified Telegram chats' })
  async sendTestNotification() {
    const result = await this.telegramService.testNotification();
    return ResponseBuilder.success(result, result.message);
  }

  @Post('setup-webhook')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register backend URL as Telegram Webhook' })
  async setupWebhook(
    @Body('url') url?: string,
  ) {
    const targetUrl = url || 'https://api.vasanthissignature.in';
    const result = await this.telegramService.setupWebhook(targetUrl);
    return ResponseBuilder.success(result, 'Telegram Webhook registered successfully');
  }
}
