import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { CartService } from '@domains/cart/cart.service';
import { CouponService } from '@domains/coupon/coupon.service';
import { OfferService } from '@domains/offer/offer.service';
import { OrderWorkflowService } from '@domains/order/order-workflow.service';
import { PaymentService } from '@domains/payment/payment.service';
import { PrismaService } from '@database/prisma.service';
import { randomBytes, createHash } from 'crypto';
import { getOrderState } from '@domains/order/order-state';
import {
  CheckoutPreviewDto,
  CheckoutItemResponse,
  CheckoutSummaryResponse,
  PlaceOrderDto,
} from './checkout.types';

interface DiscountItem {
  productId: string;
  brandId?: string;
  price: number;
  quantity: number;
}

const SHIPPING_RATES: Record<string, number> = {
  STANDARD: 50,
  EXPRESS: 100,
  SAME_DAY: 200,
};
const SHIPPING_ESTIMATES: Record<string, string> = {
  STANDARD: '5-7 business days',
  EXPRESS: '2-3 business days',
  SAME_DAY: 'Same day delivery',
};

@Injectable()
export class CheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cartService: CartService,
    private readonly couponService: CouponService,
    private readonly offerService: OfferService,
    private readonly workflow: OrderWorkflowService,
    private readonly paymentService: PaymentService,
    _configService: ConfigService,
  ) {}

  /**
   * Resolves both discount sources for a cart: an entered coupon code (if
   * any) and the best currently-active, auto-applied Offer for these items.
   * The customer gets whichever is larger -- they don't stack -- but a
   * coupon's free-shipping perk and usage recording are tracked against the
   * coupon specifically, independent of which discount "wins" on amount.
   */
  private async resolveDiscount(
    userId: string,
    couponCode: string | undefined,
    subtotal: number,
    items: DiscountItem[],
  ): Promise<{
    discountTotal: number;
    couponDiscount: number;
    freeShipping: boolean;
  }> {
    let couponDiscount = 0;
    let freeShipping = false;
    if (couponCode) {
      const result = await this.couponService.checkCoupon(
        userId,
        couponCode,
        subtotal,
        items,
      );
      couponDiscount = Math.min(result.discountAmount, subtotal);
      freeShipping = result.freeShipping;
    }

    let offerDiscount = 0;
    try {
      const activeOffers = await this.offerService.getActiveOffers();
      const best = this.offerService.calculateDiscount(items, activeOffers);
      if (best) offerDiscount = Math.min(best.discount, subtotal);
    } catch {
      // Offers are a background auto-discount, not a customer-entered code --
      // never let a problem computing them block checkout.
      offerDiscount = 0;
    }

    return {
      discountTotal: Math.max(couponDiscount, offerDiscount),
      couponDiscount,
      freeShipping,
    };
  }

  private async validateAddress(addressId: string, userId: string) {
    let profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      profile = await this.prisma.customerProfile.create({
        data: { userId },
      });
    }
    const address = await this.prisma.customerAddress.findUnique({
      where: { id: addressId },
    });
    if (!address || address.customerId !== profile.id)
      throw new BusinessException('Address not found', 'CHECKOUT_002');
    return { profile, address };
  }

  private async calculateShipping(
    method: string,
    subtotal: number,
    freeShipping = false,
  ): Promise<number> {
    if (freeShipping) return 0;

    const [
      shippingFeeEnabledSetting,
      shippingFlatFeeSetting,
      freeThresholdEnabledSetting,
      freeThresholdSetting,
    ] = await Promise.all([
      this.prisma.appSetting.findFirst({
        where: { key: { in: ['shipping_fee_enabled', 'shipping_enabled'] } },
      }),
      this.prisma.appSetting.findFirst({
        where: { key: { in: ['shipping_flat_fee', 'shipping_fee'] } },
      }),
      this.prisma.appSetting.findFirst({
        where: {
          key: {
            in: [
              'shipping_free_threshold_enabled',
              'free_shipping_threshold_enabled',
            ],
          },
        },
      }),
      this.prisma.appSetting.findFirst({
        where: {
          key: { in: ['shipping_free_threshold', 'free_shipping_threshold'] },
        },
      }),
    ]);

    const isShippingFeeEnabled = shippingFeeEnabledSetting
      ? shippingFeeEnabledSetting.value === 'true'
      : false;

    // If shipping fees are disabled globally by admin, delivery is 100% free (₹0)
    if (!isShippingFeeEnabled) {
      return 0;
    }

    const freeThresholdEnabled = freeThresholdEnabledSetting
      ? freeThresholdEnabledSetting.value === 'true'
      : false;
    const freeThreshold = freeThresholdSetting
      ? parseFloat(freeThresholdSetting.value) || 0
      : 0;

    // If threshold enabled and subtotal qualifies
    if (
      freeThresholdEnabled &&
      freeThreshold > 0 &&
      subtotal >= freeThreshold
    ) {
      return 0;
    }

    const flatFee = shippingFlatFeeSetting
      ? parseFloat(shippingFlatFeeSetting.value) || 0
      : 0;

    if (method && method !== 'STANDARD' && SHIPPING_RATES[method]) {
      return SHIPPING_RATES[method];
    }

    return flatFee;
  }

  private async buildItems(cartItems: any[]): Promise<{
    items: CheckoutItemResponse[];
    brandByProduct: Map<string, string | undefined>;
    productMap: Map<string, any>;
  }> {
    const productIds = cartItems.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      select: {
        id: true,
        name: true,
        status: true,
        basePrice: true,
        salePrice: true,
        sku: true,
        taxPercentage: true,
        taxInclusive: true,
        brandId: true,
        media: {
          select: { url: true, isPrimary: true },
          where: { deletedAt: null },
        },
      },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));
    const brandByProduct = new Map(
      products.map((p) => [p.id, p.brandId ?? undefined]),
    );

    const items: CheckoutItemResponse[] = [];
    for (const item of cartItems) {
      const product = productMap.get(item.productId);
      if (!product)
        throw new BusinessException('Product not found', 'CHECKOUT_003');
      if (product.status !== 'ACTIVE')
        throw new BusinessException('Product is not available', 'CHECKOUT_004');

      if (item.variantId) {
        const inventory = await this.prisma.inventory.findUnique({
          where: { variantId: item.variantId },
        });
        if (inventory) {
          const available =
            inventory.availableQuantity - inventory.reservedQuantity;
          if (available < item.quantity && !inventory.allowBackorder)
            throw new BusinessException('Insufficient stock', 'CHECKOUT_005');
        }
      }

      const variant = item.variantId
        ? await this.prisma.productVariant.findUnique({
            where: { id: item.variantId },
          })
        : null;
      if (
        item.variantId &&
        (!variant || variant.deletedAt || variant.productId !== item.productId)
      ) {
        throw new BusinessException(
          'This product option is no longer available.',
          'CHECKOUT_VARIANT',
        );
      }
      const unitPrice = Number(
        variant?.salePriceOverride ??
          variant?.priceOverride ??
          product.salePrice ??
          product.basePrice,
      );
      const totalPrice = unitPrice * item.quantity;
      const taxPercentage =
        product.taxPercentage !== null && product.taxPercentage !== undefined
          ? Number(product.taxPercentage)
          : 0;
      const isTaxInclusive = product.taxInclusive === true;
      const taxAmount =
        isTaxInclusive && taxPercentage > 0
          ? (totalPrice * taxPercentage) / (100 + taxPercentage)
          : 0;

      const primaryImage =
        product.media?.find((m: any) => m.isPrimary)?.url ||
        product.media?.[0]?.url ||
        item.imageUrl ||
        item.productImage ||
        undefined;

      items.push({
        productId: item.productId,
        productName: product.name,
        variantId: item.variantId ?? undefined,
        variantName:
          item.variant?.title ??
          item.variantTitle ??
          item.variantName ??
          undefined,
        productImage: primaryImage,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        taxAmount: Math.round(taxAmount * 100) / 100,
      });
    }
    return { items, brandByProduct, productMap };
  }

  async preview(
    userId: string,
    dto: CheckoutPreviewDto,
  ): Promise<CheckoutSummaryResponse> {
    await this.validateAddress(dto.addressId, userId);
    const cart = await this.cartService.getCartByUser(userId);
    if (!cart.items || cart.items.length === 0)
      throw new BusinessException('Cart is empty', 'CHECKOUT_006');

    const activeItems = cart.items.filter((i) => !i.savedForLater);
    if (!activeItems.length)
      throw new BusinessException(
        'Your bag has no items ready to checkout.',
        'CHECKOUT_006',
      );
    const { items, brandByProduct, productMap } =
      await this.buildItems(activeItems);
    const method = dto.shippingMethod ?? 'STANDARD';

    const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const discountItems: DiscountItem[] = items.map((i) => ({
      productId: i.productId,
      brandId: brandByProduct.get(i.productId),
      price: i.unitPrice,
      quantity: i.quantity,
    }));
    const { discountTotal, freeShipping } = await this.resolveDiscount(
      userId,
      dto.couponCode,
      subtotal,
      discountItems,
    );

    const effectiveDiscount = Math.min(discountTotal, subtotal);
    const payableItemsTotal = Math.max(0, subtotal - effectiveDiscount);

    // Compute line-level tax amounts only if product has Price includes GST enabled
    let taxTotal = 0;
    for (const item of items) {
      const lineFraction = subtotal > 0 ? item.totalPrice / subtotal : 0;
      const lineDiscount = effectiveDiscount * lineFraction;
      const linePayable = Math.max(0, item.totalPrice - lineDiscount);
      const product = productMap.get(item.productId);
      const taxPercentage =
        product?.taxPercentage !== null && product?.taxPercentage !== undefined
          ? Number(product.taxPercentage)
          : 0;
      const isTaxInclusive = product?.taxInclusive === true;
      const lineTax =
        isTaxInclusive && taxPercentage > 0
          ? (linePayable * taxPercentage) / (100 + taxPercentage)
          : 0;
      item.taxAmount = Math.round(lineTax * 100) / 100;
      taxTotal += item.taxAmount;
    }
    taxTotal = Math.round(taxTotal * 100) / 100;

    const shippingCharge = await this.calculateShipping(
      method,
      subtotal,
      freeShipping,
    );
    const grandTotal =
      Math.round((payableItemsTotal + shippingCharge) * 100) / 100;

    return {
      items,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(effectiveDiscount * 100) / 100,
      taxTotal,
      shippingCharge,
      grandTotal,
      estimatedDelivery:
        SHIPPING_ESTIMATES[method] ?? SHIPPING_ESTIMATES.STANDARD,
    };
  }

  async placeOrder(userId: string, dto: PlaceOrderDto) {
    const paymentMethod = dto.paymentMethod ?? 'COD';
    if (dto.checkoutAttemptId) {
      const existing = await this.prisma.order.findUnique({
        where: {
          orderNumber: this.attemptOrderNumber(userId, dto.checkoutAttemptId),
        },
      });
      if (existing)
        return this.orderPaymentResponse(userId, existing, paymentMethod);
    }
    if (paymentMethod === 'COD') {
      const enabled = await this.prisma.appSetting.findFirst({
        where: {
          key: {
            in: ['cod_enabled', 'payment_cod_enabled', 'payment.cod_enabled'],
          },
        },
      });
      if (enabled?.value !== 'true')
        throw new BusinessException(
          'Cash on delivery is not available. Please select online payment.',
          'CHECKOUT_COD_DISABLED',
        );
    } else if (!(await this.paymentService.gatewayAvailable())) {
      throw new BusinessException(
        'Online payment is temporarily unavailable. Please try later.',
        'PAYMENT_GATEWAY_UNAVAILABLE',
      );
    }
    const { profile, address } = await this.validateAddress(
      dto.addressId,
      userId,
    );
    const cart = await this.cartService.getCartByUser(userId);
    if (!cart.items || cart.items.length === 0)
      throw new BusinessException('Cart is empty', 'CHECKOUT_006');

    const activeItems = cart.items.filter((i) => !i.savedForLater);
    if (!activeItems.length)
      throw new BusinessException(
        'Your bag has no items ready to checkout.',
        'CHECKOUT_006',
      );
    const { items, brandByProduct, productMap } =
      await this.buildItems(activeItems);
    const method = dto.shippingMethod ?? 'STANDARD';

    const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const discountItems: DiscountItem[] = items.map((i) => ({
      productId: i.productId,
      brandId: brandByProduct.get(i.productId),
      price: i.unitPrice,
      quantity: i.quantity,
    }));
    const { discountTotal, couponDiscount, freeShipping } =
      await this.resolveDiscount(
        userId,
        dto.couponCode,
        subtotal,
        discountItems,
      );

    const effectiveDiscount = Math.min(discountTotal, subtotal);
    const payableItemsTotal = Math.max(0, subtotal - effectiveDiscount);

    // Compute line-level tax amounts only if product has Price includes GST enabled
    let taxTotal = 0;
    for (const item of items) {
      const lineFraction = subtotal > 0 ? item.totalPrice / subtotal : 0;
      const lineDiscount = effectiveDiscount * lineFraction;
      const linePayable = Math.max(0, item.totalPrice - lineDiscount);
      const product = productMap.get(item.productId);
      const taxPercentage =
        product?.taxPercentage !== null && product?.taxPercentage !== undefined
          ? Number(product.taxPercentage)
          : 0;
      const isTaxInclusive = product?.taxInclusive === true;
      const lineTax =
        isTaxInclusive && taxPercentage > 0
          ? (linePayable * taxPercentage) / (100 + taxPercentage)
          : 0;
      item.taxAmount = Math.round(lineTax * 100) / 100;
      taxTotal += item.taxAmount;
    }
    taxTotal = Math.round(taxTotal * 100) / 100;

    const shippingCharge = await this.calculateShipping(
      method,
      subtotal,
      freeShipping,
    );
    const grandTotal =
      Math.round((payableItemsTotal + shippingCharge) * 100) / 100;

    if (grandTotal <= 0)
      throw new BusinessException(
        'The payable order total must be greater than zero.',
        'CHECKOUT_TOTAL',
      );
    const orderNumber = dto.checkoutAttemptId
      ? this.attemptOrderNumber(userId, dto.checkoutAttemptId)
      : await this.workflow.generateOrderNumber();

    const order = await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "shopping_carts" WHERE id = ${cart.id} FOR UPDATE`;
      const replay = await tx.order.findUnique({ where: { orderNumber } });
      if (replay) return replay;
      const lockedItems = await tx.$queryRaw<
        { id: string; quantity: number; savedForLater: boolean }[]
      >`SELECT id, quantity, "savedForLater" FROM "shopping_cart_items" WHERE "cartId" = ${cart.id} FOR UPDATE`;
      if (
        activeItems.some(
          (item) =>
            !lockedItems.some(
              (row) =>
                row.id === item.id &&
                row.quantity === item.quantity &&
                !row.savedForLater,
            ),
        )
      ) {
        throw new BusinessException(
          'Your bag changed. Review the updated quantity before placing the order.',
          'CHECKOUT_CART_CHANGED',
        );
      }
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: profile.id,
          status: 'PENDING',
          createdBy: userId,
          subtotal: Math.round(subtotal * 100) / 100,
          discountTotal: Math.round(discountTotal * 100) / 100,
          taxTotal: Math.round(taxTotal * 100) / 100,
          shippingCharge: Math.round(shippingCharge * 100) / 100,
          grandTotal: Math.round(grandTotal * 100) / 100,
          notes: dto.notes,
          deliveryInstructions: dto.deliveryInstructions,
          preferredDeliverySlot: dto.preferredDeliverySlot,
          isGift: Boolean(dto.isGift),
          giftWrapMessage: dto.giftWrapMessage,
          terminalId: dto.terminalId,
          addresses: {
            create: [
              {
                addressType: 'SHIPPING',
                fullName: address.fullName,
                phone: address.phone,
                addressLine1: address.addressLine1,
                addressLine2: address.addressLine2,
                city: address.city,
                state: address.state,
                country: address.country,
                postalCode: address.postalCode,
              },
            ],
          },
          items: {
            create: items.map((i) => ({
              product: { connect: { id: i.productId } },
              ...(i.variantId
                ? { variant: { connect: { id: i.variantId } } }
                : {}),
              productName: i.productName,
              sku: productMap.get(i.productId)?.sku || 'SKU',
              variantTitle: i.variantName,
              discountAmount:
                subtotal > 0
                  ? Math.round(
                      ((effectiveDiscount * i.totalPrice) / subtotal) * 100,
                    ) / 100
                  : 0,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.totalPrice,
              taxAmount: i.taxAmount,
            })),
          },
        },
        include: { items: true },
      });

      if (paymentMethod === 'COD')
        await tx.payment.create({
          data: {
            orderId: createdOrder.id,
            paymentNumber: `COD-${randomBytes(8).toString('hex')}`,
            method: 'COD',
            provider: 'MANUAL',
            amount: grandTotal,
            currency: 'INR',
            status: 'PENDING',
            createdBy: userId,
          },
        });
      await this.workflow.reserveInventoryTx(tx, createdOrder.id, userId);

      await tx.orderTimeline.create({
        data: {
          orderId: createdOrder.id,
          status: 'PENDING',
          message: 'Order placed',
          createdBy: userId,
        },
      });

      // Claim these exact lines in the same transaction as the order and reservation.
      await tx.shoppingCartItem.deleteMany({
        where: { cartId: cart.id, id: { in: activeItems.map((i) => i.id) } },
      });

      return createdOrder;
    });

    if (address?.fullName && userId) {
      const parts = address.fullName.trim().split(/\s+/);
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ') || undefined;
      const updateData: any = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (address.phone) updateData.phone = address.phone;

      await this.prisma.user
        .updateMany({
          where: {
            id: userId,
            OR: [{ firstName: 'Customer' }, { firstName: '' }, { phone: null }],
          },
          data: updateData,
        })
        .catch(() => {});
    }

    let response;
    try {
      if (dto.couponCode && (couponDiscount > 0 || freeShipping))
        await this.couponService.applyCoupon(userId, {
          code: dto.couponCode,
          orderId: order.id,
          orderAmount: subtotal,
          items: discountItems,
        });
      if (paymentMethod === 'COD') {
        const confirmed = await this.workflow.transition(
          order.id,
          'CONFIRMED',
          userId,
          'Cash on delivery order confirmed',
        );
        response = { ...order, ...confirmed };
      } else {
        response = await this.orderPaymentResponse(
          userId,
          order,
          paymentMethod,
        );
      }
    } catch (err) {
      await this.workflow.transition(
        order.id,
        'CANCELLED',
        userId,
        'Checkout could not initialize payment. Bag retained.',
      );
      await this.prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "shopping_carts" WHERE id = ${cart.id} FOR UPDATE`;
        for (const item of activeItems) {
          const existing = await tx.shoppingCartItem.findFirst({
            where: {
              cartId: cart.id,
              productId: item.productId,
              variantId: item.variantId ?? null,
            },
          });
          if (!existing)
            await tx.shoppingCartItem.create({
              data: {
                cartId: cart.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
              },
            });
        }
      });
      throw err;
    }
    await this.auditService
      .log({
        action: 'ORDER_CREATED',
        module: 'checkout',
        resource: 'order',
        resourceId: order.id,
        userId,
        newValue: { orderNumber, grandTotal: order.grandTotal },
      })
      .catch(() => {});
    return response;
  }

  private attemptOrderNumber(userId: string, attemptId: string) {
    return `ORD-ONL-${createHash('sha256')
      .update(userId + ':' + attemptId)
      .digest('hex')
      .slice(0, 16)
      .toUpperCase()}`;
  }

  private async orderPaymentResponse(
    userId: string,
    order: any,
    _method: string,
  ) {
    if (order.status === 'CANCELLED')
      throw new BusinessException(
        'This checkout has expired or was cancelled. Please return to your bag.',
        'CHECKOUT_EXPIRED',
      );
    const payments = await this.prisma.payment.findMany({
      where: { orderId: order.id },
    });
    if (payments.some((p) => p.method === 'COD') || order.status !== 'PENDING')
      return order;
    const amount = getOrderState({ ...order, payments }).amountDue;
    if (amount <= 0) return order;
    const payment = await this.paymentService.create(userId, {
      orderId: order.id,
      method: 'RAZORPAY',
      provider: 'razorpay',
      amount,
      currency: order.currency,
    });
    return {
      ...order,
      payment: {
        paymentId: payment.id,
        providerOrderId: payment.providerOrderId,
        amount: payment.amount,
        currency: payment.currency,
        razorpayKeyId: payment.razorpayKeyId,
      },
    };
  }
}
