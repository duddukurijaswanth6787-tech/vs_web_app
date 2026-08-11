import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReferralService } from './referral.service';
import {
  ApplyReferralDto,
  UpdateReferralRewardsDto,
  ReferralHistoryQueryDto,
} from './referral.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Referral')
@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Post('code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate or get own referral code (feature-gated)',
  })
  async myCode(@CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.referralService.getOrCreateMyCode(user.sub),
    );
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply a referral code (feature-gated)' })
  async apply(@CurrentUser() user: JwtPayload, @Body() dto: ApplyReferralDto) {
    return ResponseBuilder.success(
      await this.referralService.applyCode(user.sub, dto),
      'Referral applied',
    );
  }

  @Get('rewards')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my referral rewards history (feature-gated)' })
  async rewards(
    @CurrentUser() user: JwtPayload,
    @Query() query: ReferralHistoryQueryDto,
  ) {
    return ResponseBuilder.success(
      await this.referralService.myHistory(user.sub, query),
    );
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list referral codes' })
  async adminList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return ResponseBuilder.success(
      await this.referralService.adminList(
        Number(page) || 1,
        Number(limit) || 20,
      ),
    );
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: update referral rewards config' })
  async adminUpdate(
    @Param('id') id: string,
    @Body() dto: UpdateReferralRewardsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.referralService.adminUpdateRewards(id, dto, user.sub),
    );
  }
}
