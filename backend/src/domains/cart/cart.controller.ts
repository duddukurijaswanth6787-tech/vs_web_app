import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
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
import { CartService } from './cart.service';
import { AddToCartDto, UpdateQuantityDto, MergeCartDto } from './cart.types';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';
import { UseGuards } from '@nestjs/common';

@ApiTags('Shopping Cart')
@Controller('cart')
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly jwtService: JwtService,
  ) {}

  private resolveUser(req: Request): { userId?: string; guestId?: string } {
    const authHeader = req.headers['authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      if (token && token !== 'null' && token !== 'undefined') {
        try {
          const payload: JwtPayload = this.jwtService.verify(token);
          if (payload?.sub) {
            return { userId: payload.sub };
          }
        } catch {
          // Token is expired or invalid -- fallback gracefully to guestId
        }
      }
    }
    const rawGuestId = req.query['guestId'];
    const guestId = typeof rawGuestId === 'string' && rawGuestId.trim() ? rawGuestId.trim() : undefined;
    return { guestId };
  }

  @Get()
  @ApiBearerAuth()
  @ApiQuery({ name: 'guestId', required: false })
  @ApiOperation({ summary: 'Get cart (works for both guest and customer)' })
  async getCart(@Req() req: Request) {
    const { userId, guestId } = this.resolveUser(req);
    return ResponseBuilder.success(
      await this.cartService.getCart(userId, guestId),
    );
  }

  @Get('summary')
  @ApiBearerAuth()
  @ApiQuery({ name: 'guestId', required: false })
  @ApiOperation({ summary: 'Get cart summary' })
  async getCartSummary(@Req() req: Request) {
    const { userId, guestId } = this.resolveUser(req);
    return ResponseBuilder.success(
      await this.cartService.getCartSummary(userId, guestId),
    );
  }

  @Post('items')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to cart' })
  async addItem(@Req() req: Request, @Body() dto: AddToCartDto) {
    const authHeader = req.headers['authorization'];
    let userId: string | undefined;
    let guestId: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload: JwtPayload = this.jwtService.verify(authHeader.slice(7));
        userId = payload.sub;
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }
    } else {
      guestId = (req.query['guestId'] as string) ?? req.body?.guestId;
    }

    return ResponseBuilder.success(
      await this.cartService.addItem(userId, guestId, dto),
      'Item added to cart',
    );
  }

  @Patch('items/:itemId')
  @ApiBearerAuth()
  @ApiQuery({ name: 'guestId', required: false })
  @ApiOperation({ summary: 'Update item quantity' })
  async updateQuantity(
    @Req() req: Request,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateQuantityDto,
  ) {
    const { userId, guestId } = this.resolveUser(req);
    return ResponseBuilder.success(
      await this.cartService.updateQuantity(userId, guestId, itemId, dto),
      'Cart updated',
    );
  }

  @Delete('items/:itemId')
  @ApiBearerAuth()
  @ApiQuery({ name: 'guestId', required: false })
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(@Req() req: Request, @Param('itemId') itemId: string) {
    const { userId, guestId } = this.resolveUser(req);
    return ResponseBuilder.success(
      await this.cartService.removeItem(userId, guestId, itemId),
      'Item removed',
    );
  }

  @Delete()
  @ApiBearerAuth()
  @ApiQuery({ name: 'guestId', required: false })
  @ApiOperation({ summary: 'Clear all items from cart' })
  async clearCart(@Req() req: Request) {
    const { userId, guestId } = this.resolveUser(req);
    await this.cartService.clearCart(userId, guestId);
    return ResponseBuilder.deleted('Cart cleared');
  }

  @Post('items/:itemId/save-for-later')
  @ApiBearerAuth()
  @ApiQuery({ name: 'guestId', required: false })
  @ApiOperation({ summary: 'Save item for later' })
  async saveForLater(@Req() req: Request, @Param('itemId') itemId: string) {
    const { userId, guestId } = this.resolveUser(req);
    return ResponseBuilder.success(
      await this.cartService.saveForLater(userId, guestId, itemId),
      'Item saved for later',
    );
  }

  @Post('items/:itemId/move-to-cart')
  @ApiBearerAuth()
  @ApiQuery({ name: 'guestId', required: false })
  @ApiOperation({ summary: 'Move saved item back to cart' })
  async moveToCart(@Req() req: Request, @Param('itemId') itemId: string) {
    const { userId, guestId } = this.resolveUser(req);
    return ResponseBuilder.success(
      await this.cartService.moveToCart(userId, guestId, itemId),
      'Item moved to cart',
    );
  }

  @Post('merge')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Merge guest cart into customer cart' })
  async mergeCart(@Req() req: Request, @Body() dto: MergeCartDto) {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer '))
      throw new UnauthorizedException('Authentication required for cart merge');
    let userId: string;
    try {
      const payload: JwtPayload = this.jwtService.verify(authHeader.slice(7));
      userId = payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return ResponseBuilder.success(
      await this.cartService.mergeGuestCart(userId, dto.guestId),
      'Guest cart merged',
    );
  }

  @Get('admin/customer/:customerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active cart of any customer (Admin only)' })
  async getCartAdmin(@Param('customerId') customerId: string) {
    return ResponseBuilder.success(
      await this.cartService.getCartByCustomerIdAdmin(customerId),
    );
  }
}
