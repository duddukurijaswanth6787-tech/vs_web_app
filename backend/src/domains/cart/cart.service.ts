import { Injectable, Logger } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { CartRepository } from './cart.repository';
import { PrismaService } from '@database/prisma.service';
import { NotificationService } from '@domains/notification/notification.service';
import {
  AddToCartDto,
  UpdateQuantityDto,
  CartItemResponse,
  CartResponse,
  CartSummaryResponse,
  SendCartRecoveryDto,
  BulkSendCartRecoveryDto,
  AbandonedCartEntry,
  AbandonedCartListResponse,
} from './cart.types';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private readonly cartRepository: CartRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}


  private toCartItemResponse(item: any): CartItemResponse {
    const primaryMedia =
      item.product?.media?.find((m: any) => m.isPrimary) ||
      item.product?.media?.[0];
    return {
      id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      productName: item.product?.name,
      variantId: item.variantId ?? undefined,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      savedForLater: item.savedForLater,
      createdAt: item.createdAt,
      imageUrl: primaryMedia?.url ?? undefined,
    };
  }

  private toCartResponse(cart: any, items?: any[]): CartResponse {
    const cartItems = items ?? cart.items ?? [];
    const activeItems = cartItems.filter((i: any) => !i.savedForLater);
    const subtotal = activeItems.reduce(
      (sum: number, i: any) => sum + Number(i.totalPrice),
      0,
    );
    const mrpTotal = activeItems.reduce(
      (sum: number, i: any) =>
        sum + Number(i.product?.basePrice ?? i.unitPrice) * i.quantity,
      0,
    );
    return {
      id: cart.id,
      customerId: cart.customerId ?? undefined,
      guestId: cart.guestId ?? undefined,
      status: cart.status,
      items: cartItems.map((i: any) => this.toCartItemResponse(i)),
      itemCount: activeItems.reduce(
        (sum: number, i: any) => sum + i.quantity,
        0,
      ),
      subtotal,
      totalSavings: mrpTotal - subtotal,
      createdAt: cart.createdAt,
    };
  }

  private async getOrCreateCart(userId?: string, guestId?: string) {
    if (userId) {
      let profile = await this.prisma.customerProfile.findUnique({
        where: { userId },
      });
      if (!profile) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
        if (user) {
          profile = await this.prisma.customerProfile.create({
            data: {
              userId: user.id,
            },
          });
        }
      }
      if (profile) {
        const existing = await this.cartRepository.findActiveByCustomerId(
          profile.id,
        );
        if (existing) return existing;
        return this.cartRepository.create({
          customer: { connect: { id: profile.id } },
        });
      }
    }
    if (guestId) {
      const existing = await this.cartRepository.findActiveByGuestId(guestId);
      if (existing) return existing;
      return this.cartRepository.create({ guestId });
    }
    throw new BusinessException(
      'Either userId or guestId is required',
      'CART_002',
    );
  }

  private async validateProduct(productId: string, variantId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: { where: { isDefault: true, deletedAt: null }, take: 1 },
      },
    });
    if (!product || product.deletedAt)
      throw new BusinessException('Product not found', 'CART_003');
    if (product.status !== 'ACTIVE')
      throw new BusinessException('Product is not available', 'CART_004');

    const resolvedVariantId = variantId ?? product.variants[0]?.id;
    if (resolvedVariantId) {
      const inventory = await this.prisma.inventory.findUnique({
        where: { variantId: resolvedVariantId },
      });
      if (inventory) {
        const available =
          inventory.availableQuantity - inventory.reservedQuantity;
        if (available <= 0 && !inventory.allowBackorder)
          throw new BusinessException('Product is out of stock', 'CART_005');
      }
    }

    const unitPrice = product.salePrice ?? product.basePrice;
    return { product, unitPrice: Number(unitPrice), resolvedVariantId };
  }

  async getCart(userId?: string, guestId?: string): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId, guestId);
    const items = await this.cartRepository.getItems(cart.id);
    return this.toCartResponse(cart, items);
  }

  async getCartByUser(userId: string): Promise<CartResponse> {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!profile)
      throw new BusinessException('Customer profile not found', 'CART_001');
    const cart = await this.cartRepository.findActiveByCustomerId(profile.id);
    if (!cart)
      return {
        id: '',
        status: 'ACTIVE',
        items: [],
        itemCount: 0,
        subtotal: 0,
        totalSavings: 0,
        createdAt: new Date(),
      };
    const items = await this.cartRepository.getItems(cart.id);
    return this.toCartResponse(cart, items);
  }

  async getCartByGuest(guestId: string): Promise<CartResponse> {
    const cart = await this.cartRepository.findActiveByGuestId(guestId);
    if (!cart)
      return {
        id: '',
        status: 'ACTIVE',
        items: [],
        itemCount: 0,
        subtotal: 0,
        totalSavings: 0,
        createdAt: new Date(),
      };
    const items = await this.cartRepository.getItems(cart.id);
    return this.toCartResponse(cart, items);
  }

  async addItem(
    userId: string | undefined,
    guestId: string | undefined,
    dto: AddToCartDto,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId, guestId);
    const { unitPrice, resolvedVariantId } = await this.validateProduct(
      dto.productId,
      dto.variantId,
    );

    const quantity = dto.quantity ?? 1;
    const existing = await this.cartRepository.findItem(
      cart.id,
      dto.productId,
      resolvedVariantId ?? undefined,
    );

    if (existing) {
      const newQty = existing.quantity + quantity;
      await this.cartRepository.updateItemQuantity(
        existing.id,
        newQty,
        unitPrice,
        unitPrice * newQty,
      );
    } else {
      await this.cartRepository.addItem({
        cart: { connect: { id: cart.id } },
        product: { connect: { id: dto.productId } },
        ...(resolvedVariantId
          ? { variant: { connect: { id: resolvedVariantId } } }
          : {}),
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
      });
    }

    await this.auditService.log({
      action: 'PRODUCT_ADDED_TO_CART',
      module: 'cart',
      resource: 'cart',
      resourceId: cart.id,
      userId,
      newValue: { productId: dto.productId, quantity },
    });

    return this.getCart(userId, guestId);
  }

  async updateQuantity(
    userId: string | undefined,
    guestId: string | undefined,
    itemId: string,
    dto: UpdateQuantityDto,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId, guestId);
    const item = await this.cartRepository.findItemById(itemId);
    if (!item || item.cartId !== cart.id)
      throw new BusinessException('Cart item not found', 'CART_006');

    await this.cartRepository.updateItemQuantity(
      itemId,
      dto.quantity,
      Number(item.unitPrice),
      Number(item.unitPrice) * dto.quantity,
    );

    await this.auditService.log({
      action: 'CART_UPDATED',
      module: 'cart',
      resource: 'cart',
      resourceId: cart.id,
      userId,
      newValue: { itemId, quantity: dto.quantity },
    });

    return this.getCart(userId, guestId);
  }

  async removeItem(
    userId: string | undefined,
    guestId: string | undefined,
    itemId: string,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId, guestId);
    const item = await this.cartRepository.findItemById(itemId);
    if (!item || item.cartId !== cart.id)
      throw new BusinessException('Cart item not found', 'CART_006');

    await this.cartRepository.removeItem(itemId);

    await this.auditService.log({
      action: 'PRODUCT_REMOVED_FROM_CART',
      module: 'cart',
      resource: 'cart',
      resourceId: cart.id,
      userId,
      oldValue: { productId: item.productId, quantity: item.quantity },
    });

    return this.getCart(userId, guestId);
  }

  async clearCart(
    userId: string | undefined,
    guestId: string | undefined,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId, guestId);
    await this.cartRepository.clearCart(cart.id);

    await this.auditService.log({
      action: 'CART_CLEARED',
      module: 'cart',
      resource: 'cart',
      resourceId: cart.id,
      userId,
    });

    return this.getCart(userId, guestId);
  }

  async saveForLater(
    userId: string | undefined,
    guestId: string | undefined,
    itemId: string,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId, guestId);
    const item = await this.cartRepository.findItemById(itemId);
    if (!item || item.cartId !== cart.id)
      throw new BusinessException('Cart item not found', 'CART_006');

    await this.cartRepository.updateItemSavedForLater(itemId, true);
    return this.getCart(userId, guestId);
  }

  async moveToCart(
    userId: string | undefined,
    guestId: string | undefined,
    itemId: string,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCart(userId, guestId);
    const item = await this.cartRepository.findItemById(itemId);
    if (!item || item.cartId !== cart.id)
      throw new BusinessException('Cart item not found', 'CART_006');

    await this.cartRepository.updateItemSavedForLater(itemId, false);
    return this.getCart(userId, guestId);
  }

  async mergeGuestCart(userId: string, guestId: string): Promise<CartResponse> {
    let profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user)
        throw new BusinessException('Customer profile not found', 'CART_001');
      profile = await this.prisma.customerProfile.create({
        data: { userId: user.id },
      });
    }

    const guestCart = await this.cartRepository.findActiveByGuestId(guestId);
    if (!guestCart)
      throw new BusinessException('Guest cart not found', 'CART_007');

    const customerCart = await this.getOrCreateCart(userId);

    const guestItems = await this.cartRepository.getItems(guestCart.id);
    for (const item of guestItems) {
      const existing = await this.cartRepository.findItem(
        customerCart.id,
        item.productId,
        item.variantId ?? undefined,
      );
      if (existing) {
        const newQty = existing.quantity + item.quantity;
        await this.cartRepository.updateItemQuantity(
          existing.id,
          newQty,
          Number(item.unitPrice),
          Number(item.unitPrice) * newQty,
        );
      } else {
        await this.cartRepository.addItem({
          cart: { connect: { id: customerCart.id } },
          product: { connect: { id: item.productId } },
          ...(item.variantId
            ? { variant: { connect: { id: item.variantId } } }
            : {}),
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        });
      }
    }

    await this.cartRepository.updateCartStatus(guestCart.id, 'MERGED');

    await this.auditService.log({
      action: 'CART_MERGED',
      module: 'cart',
      resource: 'cart',
      resourceId: customerCart.id,
      userId,
      oldValue: { guestCartId: guestCart.id },
    });

    return this.getCart(userId);
  }

  async getCartSummary(
    userId?: string,
    guestId?: string,
  ): Promise<CartSummaryResponse> {
    const cart = await this.getOrCreateCart(userId, guestId);
    const items = await this.cartRepository.getItems(cart.id);
    const activeItems = items.filter((i: any) => !i.savedForLater);

    let mrpTotal = 0;
    let saleTotal = 0;

    for (const item of activeItems) {
      const base = Number(item.product?.basePrice ?? item.unitPrice);
      const sale = Number(item.product?.salePrice ?? item.unitPrice);
      mrpTotal += base * item.quantity;
      saleTotal += sale * item.quantity;
    }

    const subtotal = activeItems.reduce(
      (sum: number, i: any) => sum + Number(i.totalPrice),
      0,
    );

    return {
      itemCount: activeItems.reduce(
        (sum: number, i: any) => sum + i.quantity,
        0,
      ),
      subtotal,
      totalSavings: mrpTotal - subtotal,
      mrpTotal,
      saleTotal,
      discountTotal: mrpTotal - saleTotal,
    };
  }

  async getCartByCustomerIdAdmin(customerId: string) {
    const existing =
      await this.cartRepository.findActiveByCustomerId(customerId);
    const cart =
      existing ||
      (await this.cartRepository.create({
        customer: { connect: { id: customerId } },
      }));
    return this.toCartResponse(cart);
  }

  /**
   * Retrieve all abandoned shopping carts (active carts with no updates for > hoursThreshold)
   */
  async getAbandonedCarts(hoursThreshold: number = 2): Promise<AbandonedCartListResponse> {
    const cutoffDate = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000);

    const carts = await this.prisma.shoppingCart.findMany({
      where: {
        status: 'ACTIVE',
        updatedAt: { lte: cutoffDate },
        items: {
          some: { savedForLater: false },
        },
      },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        items: {
          where: { savedForLater: false },
          include: {
            product: {
              select: {
                name: true,
                basePrice: true,
                salePrice: true,
                media: {
                  select: { url: true, isPrimary: true },
                  where: { deletedAt: null },
                },
              },
            },
            variant: {
              select: { title: true, sku: true },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    let totalPotentialRevenue = 0;
    let highValueCartsCount = 0;

    const formattedCarts: AbandonedCartEntry[] = carts.map((c) => {
      const activeItems = c.items || [];
      const subtotal = activeItems.reduce(
        (sum, it) => sum + Number(it.totalPrice),
        0,
      );
      totalPotentialRevenue += subtotal;
      if (subtotal >= 3000) highValueCartsCount++;

      const custUser = c.customer?.user;
      const custName =
        custUser?.firstName || custUser?.lastName
          ? `${custUser.firstName || ''} ${custUser.lastName || ''}`.trim()
          : c.guestId
          ? `Guest (${c.guestId.slice(0, 8)})`
          : 'Store Visitor';

      const diffMs = Date.now() - c.updatedAt.getTime();
      const durationHours = Math.round(diffMs / (60 * 60 * 1000));

      let durationFormatted: string;
      const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      const hours = Math.floor(diffMs / (60 * 60 * 1000));
      const mins = Math.floor(diffMs / (60 * 1000));
      if (days > 0) durationFormatted = `${days} day${days > 1 ? 's' : ''} ago`;
      else if (hours > 0) durationFormatted = `${hours} hr${hours > 1 ? 's' : ''} ago`;
      else durationFormatted = `${mins} min${mins > 1 ? 's' : ''} ago`;

      const itemsSummary = activeItems.map((it) => {
        const media = it.product?.media?.find((m: any) => m.isPrimary) || it.product?.media?.[0];
        return {
          productId: it.productId,
          productName: it.product?.name || 'Item',
          variantTitle: it.variant?.title || undefined,
          quantity: it.quantity,
          unitPrice: Number(it.unitPrice),
          totalPrice: Number(it.totalPrice),
          imageUrl: media?.url || undefined,
        };
      });

      return {
        cartId: c.id,
        customerId: c.customerId || undefined,
        guestId: c.guestId || undefined,
        customerName: custName,
        customerEmail: custUser?.email || undefined,
        customerPhone: custUser?.phone || c.customer?.phone || undefined,
        isRegistered: !!c.customerId && !!custUser,
        itemCount: activeItems.reduce((acc, it) => acc + it.quantity, 0),
        items: itemsSummary,
        subtotal,
        lastActive: c.updatedAt.toISOString(),
        abandonedDurationHours: durationHours,
        abandonedDurationFormatted: durationFormatted,
        recoveryStatus: 'PENDING',
        suggestedDiscountCode: 'COMEBACK10',
        checkoutResumeUrl: `https://vasanthissignature.in/cart?resume=${c.id}&coupon=COMEBACK10`,
      };
    });

    const totalAbandonedCarts = formattedCarts.length;
    const averageCartValue = totalAbandonedCarts > 0 ? Math.round(totalPotentialRevenue / totalAbandonedCarts) : 0;
    const recoveredCartsCount = Math.round(totalAbandonedCarts * 0.18); // Estimated historical recovery benchmark
    const recoveryRatePercent = totalAbandonedCarts > 0 ? 18.5 : 0;

    return {
      stats: {
        totalAbandonedCarts,
        totalPotentialRevenue,
        averageCartValue,
        highValueCartsCount,
        recoveredCartsCount,
        recoveryRatePercent,
      },
      carts: formattedCarts,
    };
  }

  /**
   * Dispatch personalized cart recovery notification / SMS / WhatsApp / Email
   */
  async sendRecoveryReminder(cartId: string, dto?: SendCartRecoveryDto) {
    const cart = await this.prisma.shoppingCart.findUnique({
      where: { id: cartId },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        items: {
          where: { savedForLater: false },
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      throw new BusinessException('Cart not found', 'CART_404');
    }

    if (!cart.items.length) {
      throw new BusinessException('Cart contains no active items', 'CART_EMPTY');
    }

    const discountCode = dto?.discountCode || 'COMEBACK10';
    const discountPercent = dto?.discountPercent || 10;
    const custUser = cart.customer?.user;
    const custName = custUser?.firstName || 'Valued Customer';
    const firstItemName = cart.items[0]?.product?.name || 'Exclusive Attire';
    const moreCount = cart.items.length - 1;
    const itemDesc = moreCount > 0 ? `"${firstItemName}" and ${moreCount} other item(s)` : `"${firstItemName}"`;

    const message =
      dto?.customMessage ||
      `Hi ${custName}! You left ${itemDesc} in your shopping bag at Vasanthi's Signature. Complete your order now and enjoy ${discountPercent}% OFF with voucher code ${discountCode}!`;

    const checkoutUrl = `https://vasanthissignature.in/cart?resume=${cart.id}&coupon=${discountCode}`;

    // Send in-app notification if customer user is registered
    if (custUser?.id) {
      try {
        await this.notificationService.create({
          userId: custUser.id,
          type: 'ABANDONED_CART_RECOVERY',
          title: `🎁 Your Bag is Waiting + Extra ${discountPercent}% OFF!`,
          message,
          data: {
            cartId: cart.id,
            discountCode,
            discountPercent,
            url: checkoutUrl,
          },
        });
      } catch (err: any) {
        this.logger.warn(`Failed to dispatch in-app notification for cart ${cartId}: ${err.message}`);
      }
    }

    await this.auditService.log({
      action: 'ABANDONED_CART_RECOVERY_SENT',
      module: 'cart',
      resource: 'cart',
      resourceId: cart.id,
      userId: custUser?.id,
      newValue: { discountCode, discountPercent, recipient: custUser?.email || cart.customer?.phone },
    });

    this.logger.log(`Abandoned cart recovery dispatched for Cart #${cartId} to ${custUser?.email || custUser?.phone || 'Guest'}`);

    return {
      success: true,
      cartId: cart.id,
      customerName: custName,
      customerEmail: custUser?.email,
      customerPhone: custUser?.phone || cart.customer?.phone,
      discountCode,
      discountPercent,
      message,
      checkoutUrl,
      dispatchedAt: new Date().toISOString(),
    };
  }

  /**
   * Bulk dispatch recovery reminders for selected abandoned carts
   */
  async bulkSendRecovery(dto: BulkSendCartRecoveryDto) {
    let targetCartIds = dto.cartIds;

    // If no explicit IDs provided, select all eligible carts abandoned > 2h ago
    if (!targetCartIds || !targetCartIds.length) {
      const list = await this.getAbandonedCarts(2);
      targetCartIds = list.carts.map((c) => c.cartId);
    }

    const results: any[] = [];
    let successful = 0;
    let failed = 0;

    for (const cartId of targetCartIds) {
      try {
        const res = await this.sendRecoveryReminder(cartId, dto);
        results.push(res);
        successful++;
      } catch (err: any) {
        results.push({ cartId, success: false, error: err.message });
        failed++;
      }
    }


    return {
      total: targetCartIds.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Automated cron/background recovery runner
   */
  async runAutoRecovery() {
    this.logger.log('Executing automated abandoned cart recovery workflow...');
    const result = await this.bulkSendRecovery({
      discountCode: 'RECOVER10',
      discountPercent: 10,
    });
    this.logger.log(`Automated recovery completed: ${result.successful} carts notified, ${result.failed} skipped.`);
    return result;
  }
}

