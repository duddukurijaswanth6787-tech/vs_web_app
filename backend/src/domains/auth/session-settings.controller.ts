import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SessionSettingsService } from './services/session-settings.service';
import { UpdateSessionExpirySettingsDto } from './services/session-settings.types';
import { JwtAuthGuard, CurrentUser } from './guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from './guards/permissions.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from './services/jwt.service';

@ApiTags('Session Settings')
@Controller('admin/session-settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SessionSettingsController {
  constructor(private readonly sessionSettingsService: SessionSettingsService) {}

  @Get()
  @Permissions('settings:view')
  @ApiOperation({ summary: 'Get login token expiry settings' })
  async getSettings() {
    return ResponseBuilder.success(await this.sessionSettingsService.getSettings());
  }

  @Put()
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Update login token expiry settings' })
  async updateSettings(
    @Body() dto: UpdateSessionExpirySettingsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.sessionSettingsService.updateSettings(dto, user.sub),
      'Session settings updated',
    );
  }
}
