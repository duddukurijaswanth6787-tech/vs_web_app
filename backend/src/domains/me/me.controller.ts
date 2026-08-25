import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtService } from '@domains/auth/services/jwt.service';
import { CustomerProfileService } from '@domains/customer-profile/customer-profile.service';
import { PhoneChangeService } from '@domains/customer-profile/phone-change.service';
import { CustomerAddressService } from '@domains/customer-address/customer-address.service';
import { WishlistService } from '@domains/wishlist/wishlist.service';
import { CartService } from '@domains/cart/cart.service';
import {
  UpdateMeDto,
  RequestPhoneChangeDto,
  ConfirmPhoneChangeDto,
  CreateAddressDto,
  UpdateAddressDto,
  AddToWishlistDto,
  WishlistQueryDto,
  WishlistResponse,
  CartActionDto,
  MergeCartDto,
  MeResponse,
} from './me.types';
import type { CartResponse } from '@domains/cart/cart.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Me')
@Controller('me')
export class MeController {
  constructor(
    private readonly profileService: CustomerProfileService,
    private readonly phoneChangeService: PhoneChangeService,
    private readonly addressService: CustomerAddressService,
    private readonly wishlistService: WishlistService,
    private readonly cartService: CartService,
    private readonly jwtService: JwtService,
  ) {}

  private resolveUser(req: Request): { userId?: string; guestId?: string } {
    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload: JwtPayload = this.jwtService.verify(authHeader.slice(7));
        return { userId: payload.sub };
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }
    const guestId = (req.query['guestId'] as string) ?? undefined;
    return { guestId };
  }

  // ─── Profile ───────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my profile with wishlist count and cart summary',
  })
  async getMe(@CurrentUser() user: JwtPayload) {
    const [profile, wishlistCount, cart] = await Promise.all([
      this.profileService.getProfile(user.sub),
      this.wishlistService.getCount(user.sub),
      this.cartService.getCartByUser(user.sub),
    ]);
    const response: MeResponse = {
      ...profile,
      wishlistCount,
      cartItemCount: cart.itemCount,
      cartSubtotal: cart.subtotal,
    };
    return ResponseBuilder.success(response);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my profile' })
  async updateMe(@Body() dto: UpdateMeDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.profileService.updateProfile(user.sub, dto),
      'Profile updated',
    );
  }

  // Phone is a login credential, not just a profile field: OTP login resolves
  // an account by its number. So it is never written by PUT /me -- it changes
  // only through this request/confirm pair, and only once an OTP proves the
  // customer holds the number.
  @Post('phone/change/request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a verification code to a new phone number' })
  async requestPhoneChange(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RequestPhoneChangeDto,
  ) {
    return ResponseBuilder.success(
      await this.phoneChangeService.requestChange(user.sub, dto.phone),
      'Verification code sent',
    );
  }

  @Post('phone/change/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm a phone number change with its code' })
  async confirmPhoneChange(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ConfirmPhoneChangeDto,
  ) {
    return ResponseBuilder.success(
      await this.phoneChangeService.confirmChange(user.sub, dto.phone, dto.code),
      'Phone number updated',
    );
  }

  // ─── Addresses ─────────────────────────────────────────

  @Get('addresses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my addresses' })
  async getAddresses(@Query() query: any, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.addressService.findAll(user.sub, query),
    );
  }

  @Post('addresses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new address' })
  async createAddress(
    @Body() dto: CreateAddressDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.addressService.create(dto, user.sub),
      'Address created',
    );
  }

  @Put('addresses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an address' })
  async updateAddress(
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.success(
      await this.addressService.update(id, dto, user.sub),
      'Address updated',
    );
  }

  @Delete('addresses/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an address' })
  async deleteAddress(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.addressService.delete(id, user.sub);
    return ResponseBuilder.deleted('Address deleted');
  }

  // ─── Wishlist ──────────────────────────────────────────

  @Get('wishlist')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my wishlist with items, count, and pagination',
  })
  async getWishlist(
    @Query() query: WishlistQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const [wishlist, items] = await Promise.all([
      this.wishlistService.getWishlist(user.sub),
      this.wishlistService.getItems(user.sub, query),
    ]);
    const response: WishlistResponse = {
      id: wishlist.id,
      itemCount: wishlist.itemCount,
      items: items.data,
      meta: items.meta,
    };
    return ResponseBuilder.success(response);
  }

  @Post('wishlist')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to wishlist' })
  async addToWishlist(
    @Body() dto: AddToWishlistDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return ResponseBuilder.created(
      await this.wishlistService.addItem(user.sub, dto),
      'Item added to wishlist',
    );
  }

  @Delete('wishlist/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove item from wishlist' })
  async removeFromWishlist(
    @Param('productId') productId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.wishlistService.removeItem(user.sub, productId);
    return ResponseBuilder.deleted('Item removed from wishlist');
  }

  // ─── Cart ──────────────────────────────────────────────

  @Get('cart')
  @ApiBearerAuth()
  @ApiQuery({ name: 'guestId', required: false })
  @ApiOperation({ summary: 'Get cart with items, summary, and counts' })
  async getCart(@Req() req: Request) {
    const { userId, guestId } = this.resolveUser(req);
    return ResponseBuilder.success(
      await this.cartService.getCart(userId, guestId),
    );
  }

  @Put('cart')
  @ApiBearerAuth()
  @ApiQuery({ name: 'guestId', required: false })
  @ApiOperation({
    summary: 'Cart action: ADD, UPDATE, REMOVE, SAVE_FOR_LATER, MOVE_TO_CART',
  })
  async cartAction(@Req() req: Request, @Body() dto: CartActionDto) {
    const { userId, guestId } = this.resolveUser(req);

    let result: CartResponse;
    switch (dto.action) {
      case 'ADD':
        if (!dto.productId)
          throw new UnauthorizedException('productId required for ADD');
        result = await this.cartService.addItem(userId, guestId, {
          productId: dto.productId,
          variantId: dto.variantId,
          quantity: dto.quantity,
        });
        break;
      case 'UPDATE':
        if (!dto.itemId)
          throw new UnauthorizedException('itemId required for UPDATE');
        result = await this.cartService.updateQuantity(
          userId,
          guestId,
          dto.itemId,
          { quantity: dto.quantity ?? 1 },
        );
        break;
      case 'REMOVE':
        if (!dto.itemId)
          throw new UnauthorizedException('itemId required for REMOVE');
        result = await this.cartService.removeItem(userId, guestId, dto.itemId);
        break;
      case 'SAVE_FOR_LATER':
        if (!dto.itemId)
          throw new UnauthorizedException('itemId required for SAVE_FOR_LATER');
        result = await this.cartService.saveForLater(
          userId,
          guestId,
          dto.itemId,
        );
        break;
      case 'MOVE_TO_CART':
        if (!dto.itemId)
          throw new UnauthorizedException('itemId required for MOVE_TO_CART');
        result = await this.cartService.moveToCart(userId, guestId, dto.itemId);
        break;
      default:
        throw new UnauthorizedException('Invalid action');
    }

    return ResponseBuilder.success(result, `Cart ${dto.action.toLowerCase()}`);
  }

  @Delete('cart')
  @ApiBearerAuth()
  @ApiQuery({ name: 'guestId', required: false })
  @ApiOperation({ summary: 'Clear all items from cart' })
  async clearCart(@Req() req: Request) {
    const { userId, guestId } = this.resolveUser(req);
    await this.cartService.clearCart(userId, guestId);
    return ResponseBuilder.deleted('Cart cleared');
  }

  @Post('cart/merge')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Merge guest cart into customer cart' })
  async mergeCart(@Body() dto: MergeCartDto, @CurrentUser() user: JwtPayload) {
    return ResponseBuilder.success(
      await this.cartService.mergeGuestCart(user.sub, dto.guestId),
      'Guest cart merged',
    );
  }
}
