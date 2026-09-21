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
import {
  CheckoutPreviewDto,
  CheckoutItemResponse,
  CheckoutSummaryResponse,
  PlaceOrderDto,
  PlaceOrderPaymentResponse,
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
    private readonly configService: ConfigService,
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

    const [shippingFeeEnabledSetting, shippingFlatFeeSetting, freeThresholdEnabledSetting, freeThresholdSetting] =
      await Promise.all([
        this.prisma.appSetting.findFirst({
          where: { key: { in: ['shipping_fee_enabled', 'shipping_enabled'] } },
        }),
        this.prisma.appSetting.findFirst({
          where: { key: { in: ['shipping_flat_fee', 'shipping_fee'] } },
        }),
        this.prisma.appSetting.findFirst({
          where: { key: { in: ['shipping_free_threshold_enabled', 'free_shipping_threshold_enabled'] } },
        }),
        this.prisma.appSetting.findFirst({
          where: { key: { in: ['shipping_free_threshold', 'free_shipping_threshold'] } },
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
    if (freeThresholdEnabled && freeThreshold > 0 && subtotal >= freeThreshold) {
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

      const unitPrice = Number(item.unitPrice);
      const totalPrice = unitPrice * item.quantity;
      const taxPercentage =
        product.taxPercentage !== null && product.taxPercentage !== undefined
          ? Number(product.taxPercentage)
          : 0;
      const isTaxInclusive = product.taxInclusive !== false;
      const taxAmount =
        taxPercentage > 0
          ? isTaxInclusive
            ? (totalPrice * taxPercentage) / (100 + taxPercentage)
            : (totalPrice * taxPercentage) / 100
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
        variantName: item.variant?.title ?? item.variantTitle ?? item.variantName ?? undefined,
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
    const { items, brandByProduct, productMap } = await this.buildItems(activeItems);
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

    // Compute line-level tax amounts on the discounted payable line items (GST is tax-inclusive)
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
      const isTaxInclusive = product?.taxInclusive !== false;
      const lineTax =
        taxPercentage > 0
          ? isTaxInclusive
            ? (linePayable * taxPercentage) / (100 + taxPercentage)
            : (linePayable * taxPercentage) / 100
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
    const grandTotal = Math.round((payableItemsTotal + shippingCharge) * 100) / 100;

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
    const { profile, address } = await this.validateAddress(
      dto.addressId,
      userId,
    );
    const cart = await this.cartService.getCartByUser(userId);
    if (!cart.items || cart.items.length === 0)
      throw new BusinessException('Cart is empty', 'CHECKOUT_006');

    const activeItems = cart.items.filter((i) => !i.savedForLater);
    const { items, brandByProduct, productMap } = await this.buildItems(activeItems);
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

    // Compute line-level tax amounts on the discounted payable line items (GST is tax-inclusive)
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
      const isTaxInclusive = product?.taxInclusive !== false;
      const lineTax =
        taxPercentage > 0
          ? isTaxInclusive
            ? (linePayable * taxPercentage) / (100 + taxPercentage)
            : (linePayable * taxPercentage) / 100
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
    const grandTotal = Math.round((payableItemsTotal + shippingCharge) * 100) / 100;

    const orderNumber = await this.workflow.generateOrderNumber();

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: profile.id,
          status: 'PENDING',
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
              sku: 'SKU',
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.totalPrice,
              taxAmount: i.taxAmount,
            })),
          },
        },
        include: { items: true },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: createdOrder.id,
          status: 'PENDING',
          message: 'Order placed',
          createdBy: userId,
        },
      });

      return createdOrder;
    });

    // reserveInventory is atomic and all-or-nothing: it throws if any item
    // is short (e.g. a concurrent order for the same variant claimed the
    // last unit first). The order row above already committed as PENDING,
    // so compensate by cancelling it instead of leaving an unreservable
    // order stuck at PENDING forever, and leave the cart untouched so the
    // customer can retry.
    try {
      await this.workflow.reserveInventory(order.id, userId);
    } catch (err) {
      await this.workflow.transition(
        order.id,
        'CANCELLED',
        userId,
        'Auto-cancelled: insufficient stock at checkout',
      );
      throw err;
    }
    await this.cartService.clearCart(userId, undefined);

    if (dto.couponCode && (couponDiscount > 0 || freeShipping)) {
      await this.couponService.applyCoupon(userId, {
        code: dto.couponCode,
        orderId: order.id,
        orderAmount: subtotal,
        items: discountItems,
      });
    }

    await this.auditService.log({
      action: 'ORDER_CREATED',
      module: 'checkout',
      resource: 'order',
      resourceId: order.id,
      userId,
      newValue: { orderNumber, grandTotal: order.grandTotal },
    });

    const paymentMethod = dto.paymentMethod ?? 'COD';

    if (paymentMethod === 'RAZORPAY') {
      // Payment isn't confirmed yet -- the customer still has to complete
      // the Razorpay checkout the frontend opens with this response. The
      // order-confirmed email/SMS fire from PaymentService instead, once
      // the payment actually captures, so a customer who abandons payment
      // never gets a "your order is confirmed" message for an unpaid order.
      const payment = await this.paymentService.create(userId, {
        orderId: order.id,
        method: 'RAZORPAY',
        provider: 'razorpay',
        amount: Number(order.grandTotal),
        currency: order.currency,
      });
      const paymentInfo: PlaceOrderPaymentResponse = {
        paymentId: payment.id,
        providerOrderId: payment.providerOrderId ?? '',
        amount: payment.amount,
        currency: payment.currency,
        razorpayKeyId:
          this.configService.get<string>('app.razorpay.keyId') || '',
      };
      return { ...order, payment: paymentInfo };
    }

    // COD has no gateway step to wait for -- the order is confirmed
    // immediately, same as before.
    await this.workflow.notifyOrderConfirmed(order.id);

    return order;
  }
}
