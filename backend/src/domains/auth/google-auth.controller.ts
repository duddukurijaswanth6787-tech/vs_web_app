import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { GoogleAuthService } from './services/google-auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from './guards/permissions.guard';
import { ResponseBuilder } from '@common/responses/response.builder';

export class UpdateGoogleAuthConfigDto {
  @ApiProperty({ description: 'Google OAuth Web Client ID (ends with .apps.googleusercontent.com)' })
  @IsString()
  @MinLength(10)
  clientId!: string;
}

@ApiTags('Google Auth Settings')
@Controller('admin/google-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class GoogleAuthAdminController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  @Get('config')
  @Permissions('settings:view')
  @ApiOperation({ summary: 'Get the configured Google OAuth Client ID' })
  async getConfig() {
    return ResponseBuilder.success({ clientId: await this.googleAuthService.getEffectiveClientId() });
  }

  @Put('config')
  @Permissions('settings:update')
  @ApiOperation({ summary: 'Set the Google OAuth Client ID' })
  async updateConfig(@Body() dto: UpdateGoogleAuthConfigDto) {
    return ResponseBuilder.success(
      await this.googleAuthService.updateClientId(dto.clientId),
      'Google Client ID saved',
    );
  }
}
