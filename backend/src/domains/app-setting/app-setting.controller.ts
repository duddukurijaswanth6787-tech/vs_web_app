import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AppSettingService } from './app-setting.service';
import {
  CreateSettingDto,
  UpdateSettingDto,
  SettingQueryDto,
} from './app-setting.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { PermissionsGuard, Permissions } from '@domains/auth/guards/permissions.guard';
import { Public } from '@domains/auth/guards/jwt-auth.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Settings')
@Controller('settings')
export class AppSettingController {
  constructor(private readonly settingService: AppSettingService) {}

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List settings' })
  async findAll(@Query() query: SettingQueryDto) {
    return ResponseBuilder.success(await this.settingService.findAll(query));
  }
  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Get public store settings' })
  async getPublic() {
    return ResponseBuilder.success(await this.settingService.getPublicSettingsFallback());
  }

  @Get(':key')
  @Public()
  @ApiOperation({ summary: 'Get setting by key' })
  async findByKey(@Param('key') key: string) {
    if (key === 'public') {
      return ResponseBuilder.success(await this.settingService.getPublicSettingsFallback());
    }
    return ResponseBuilder.success(await this.settingService.findByKey(key));
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a setting' })
  async create(@Body() dto: CreateSettingDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.created(
      await this.settingService.create(dto, user.sub),
      'Setting created',
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('settings:update')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a setting' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSettingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.settingService.update(id, dto, user.sub),
      'Setting updated',
    );
  }
}
