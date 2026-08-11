import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RecentlyViewedService } from './recently-viewed.service';
import { TrackViewDto, RecentlyViewedQueryDto } from './recently-viewed.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Recently Viewed')
@Controller('recently-viewed')
export class RecentlyViewedController {
  constructor(private readonly recentlyViewedService: RecentlyViewedService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track a product view' })
  async track(@CurrentUser() user: JwtPayload, @Body() dto: TrackViewDto) {
    return ResponseBuilder.success(
      await this.recentlyViewedService.track(user.sub, dto),
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List recently viewed products' })
  async list(
    @CurrentUser() user: JwtPayload,
    @Query() query: RecentlyViewedQueryDto,
  ) {
    return ResponseBuilder.success(
      await this.recentlyViewedService.list(user.sub, query),
    );
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Clear recently viewed history' })
  async clear(@CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.recentlyViewedService.clear(user.sub),
      'Cleared',
    );
  }
}
