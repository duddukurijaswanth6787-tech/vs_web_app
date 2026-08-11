import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LoyaltyService } from './loyalty.service';
import {
  EarnLoyaltyDto,
  RedeemLoyaltyDto,
  AdminRedeemLoyaltyDto,
  LoyaltyHistoryQueryDto,
} from './loyalty.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Loyalty')
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get own loyalty balance (requires loyalty feature enabled)',
  })
  async myBalance(@CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.loyaltyService.getMyBalance(user.sub),
    );
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get own loyalty history (requires loyalty feature enabled)',
  })
  async myHistory(
    @CurrentUser() user: JwtPayload,
    @Query() query: LoyaltyHistoryQueryDto,
  ) {
    return ResponseBuilder.success(
      await this.loyaltyService.getMyHistory(user.sub, query),
    );
  }

  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Redeem own loyalty points (requires loyalty feature enabled)',
  })
  async redeem(@CurrentUser() user: JwtPayload, @Body() dto: RedeemLoyaltyDto) {
    return ResponseBuilder.success(
      await this.loyaltyService.redeemMine(user.sub, dto),
      'Points redeemed',
    );
  }

  @Get('admin/customer/:customerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: get customer loyalty balance' })
  async adminBalance(@Param('customerId') customerId: string) {
    return ResponseBuilder.success(
      await this.loyaltyService.adminBalance(customerId),
    );
  }

  @Post('admin/earn')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: earn/credit loyalty points' })
  async adminEarn(
    @CurrentUser() user: JwtPayload,
    @Body() dto: EarnLoyaltyDto,
  ) {
    return ResponseBuilder.created(
      await this.loyaltyService.adminEarn(dto, user.sub),
      'Points credited',
    );
  }

  @Post('admin/redeem')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: redeem loyalty points for customer' })
  async adminRedeem(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AdminRedeemLoyaltyDto,
  ) {
    return ResponseBuilder.success(
      await this.loyaltyService.adminRedeem(dto, user.sub),
      'Points redeemed',
    );
  }
}
