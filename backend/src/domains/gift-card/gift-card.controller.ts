import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GiftCardService } from './gift-card.service';
import {
  CreateGiftCardDto,
  PurchaseGiftCardDto,
  RedeemGiftCardDto,
  GiftCardBalanceDto,
} from './gift-card.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Gift Cards')
@Controller('gift-cards')
export class GiftCardController {
  constructor(private readonly giftCardService: GiftCardService) {}

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase a gift card' })
  async purchase(
    @CurrentUser() user: JwtPayload,
    @Body() dto: PurchaseGiftCardDto,
  ) {
    return ResponseBuilder.created(
      await this.giftCardService.purchase(user.sub, dto),
      'Gift card purchased',
    );
  }

  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Redeem gift card balance' })
  async redeem(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RedeemGiftCardDto,
  ) {
    return ResponseBuilder.success(
      await this.giftCardService.redeem(user.sub, dto),
      'Gift card redeemed',
    );
  }

  @Post('balance')
  @ApiOperation({ summary: 'Check gift card balance by code' })
  async balance(@Body() dto: GiftCardBalanceDto) {
    return ResponseBuilder.success(
      await this.giftCardService.getBalance(dto.code),
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: create gift card' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateGiftCardDto,
  ) {
    return ResponseBuilder.created(
      await this.giftCardService.createAdmin(dto, user.sub),
      'Gift card created',
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list gift cards' })
  async list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return ResponseBuilder.success(
      await this.giftCardService.listAdmin(
        Number(page) || 1,
        Number(limit) || 20,
      ),
    );
  }
}
