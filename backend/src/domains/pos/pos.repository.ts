import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CheckoutSessionStatus, Prisma } from '@prisma/client';
import {
  CreateCheckoutSessionDto,
  PosCartItemDto,
  PosCustomerInfoDto,
  PosPaymentMethodType,
} from './pos.types';

@Injectable()
export class PosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findVariantByBarcode(code: string) {
    const trimmed = code.trim();

    // 1. Search directly on ProductVariant (barcode, sku, id)
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        OR: [
          { barcode: { equals: trimmed, mode: 'insensitive' } },
          { sku: { equals: trimmed, mode: 'insensitive' } },
          { id: trimmed },
        ],
        deletedAt: null,
      },
      include: {
        product: {
          include: {
            media: {
              where: { isPrimary: true, deletedAt: null },
              take: 1,
            },
          },
        },
        inventory: true,
        attributeValues: {
          include: {
            attribute: true,
            option: true,
          },
        },
        media: {
          where: { isPrimary: true, deletedAt: null },
          take: 1,
        },
      },
    });

    if (variant) return variant;

    // 2. Fallback search by Product SKU, barcode, slug, or name (case-insensitive)
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [
          { sku: { equals: trimmed, mode: 'insensitive' } },
          { barcode: { equals: trimmed, mode: 'insensitive' } },
          { slug: { equals: trimmed, mode: 'insensitive' } },
          { name: { contains: trimmed, mode: 'insensitive' } },
        ],
        deletedAt: null,
      },
      include: {
        variants: {
          where: { deletedAt: null },
          include: {
            inventory: true,
            media: { where: { isPrimary: true, deletedAt: null }, take: 1 },
            attributeValues: {
              include: { attribute: true, option: true },
            },
          },
          take: 1,
        },
        media: { where: { isPrimary: true, deletedAt: null }, take: 1 },
      },
    });
    if (product) {
      if (product.variants.length > 0) {
        const firstVariant = product.variants[0];
        return {
          ...firstVariant,
          product,
          media:
            product.media.length > 0 ? product.media : firstVariant.media || [],
        };
      }
      // Return synthetic variant if product has no explicit variants yet
      return {
        id: product.id,
        productId: product.id,
        title: product.name,
        sku: product.sku || `SKU-${product.id.slice(0, 6)}`,
        barcode: product.barcode || trimmed,
        priceOverride: product.basePrice,
        costPrice: product.costPrice,
        salePriceOverride: product.salePrice,
        product,
        media: product.media,
        inventory: { availableQuantity: 100 },
        attributeValues: [],
      };
    }

    return null;
  }

  async createCheckoutSession(
    sessionId: string,
    handoffToken: string,
    cashierId: string,
    dto: CreateCheckoutSessionDto,
    subtotal: number,
    taxTotal: number,
    grandTotal: number,
    expiresAt: Date,
  ) {
    return this.prisma.checkoutSession.create({
      data: {
        sessionId,
        handoffToken,
        shopId: dto.shopId || 'MAIN_STORE',
        deviceId: dto.deviceId,
        cashierId,
        cart: dto.items as unknown as Prisma.InputJsonValue,
        customer: dto.customer
          ? (dto.customer as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        subtotal,
        discountTotal: dto.discountTotal || 0,
        taxTotal,
        grandTotal,
        status: CheckoutSessionStatus.WAITING_FOR_WEB,
        expiresAt,
      },
    });
  }

  async findCheckoutSessionByToken(handoffToken: string) {
    return this.prisma.checkoutSession.findUnique({
      where: { handoffToken: handoffToken.trim() },
    });
  }

  async findCheckoutSessionById(sessionId: string) {
    return this.prisma.checkoutSession.findUnique({
      where: { sessionId },
    });
  }

  async updateCheckoutSessionStatus(
    sessionId: string,
    status: CheckoutSessionStatus,
    orderId?: string,
  ) {
    return this.prisma.checkoutSession.update({
      where: { sessionId },
      data: {
        status,
        ...(orderId ? { orderId } : {}),
      },
    });
  }

  async findOrCreateWalkInCustomer() {
    let user = await this.prisma.user.findFirst({
      where: { email: 'walkin@vasanthidesigners.com' },
      include: { customerProfile: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: 'walkin@vasanthidesigners.com',
          firstName: 'Walk-in',
          lastName: 'Customer',
          passwordHash: 'WALKIN_PASS_HASH',
          userType: 'CUSTOMER',
          accountStatus: 'ACTIVE',
          customerProfile: {
            create: {
              phone: '9999999999',
            },
          },
        },
        include: { customerProfile: true },
      });
    }

    if (!user.customerProfile) {
      const profile = await this.prisma.customerProfile.create({
        data: {
          userId: user.id,
          phone: '9999999999',
        },
      });
      return profile;
    }

    return user.customerProfile;
  }
  async findCustomerByPhone(phoneInput: string) {
    const cleanPhone = phoneInput.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) return null;

    const profile = await this.prisma.customerProfile.findFirst({
      where: {
        OR: [{ phone: cleanPhone }, { phone: { contains: cleanPhone } }],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    let userId = profile?.userId;
    const customerProfileId = profile?.id;
    let fullName = '';
    let email = '';

    if (profile) {
      fullName =
        [profile.user.firstName, profile.user.lastName]
          .filter(Boolean)
          .join(' ') || profile.user.email;
      email = profile.user.email;
    } else {
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [{ phone: cleanPhone }, { phone: { contains: cleanPhone } }],
        },
      });

      if (!user) return null;
      userId = user.id;
      fullName =
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
      email = user.email;
    }

    const whereOr: any[] = [];
    if (customerProfileId) whereOr.push({ customerId: customerProfileId });
    if (userId) whereOr.push({ createdBy: userId });

    const orders =
      whereOr.length > 0
        ? await this.prisma.order.findMany({
            where: { OR: whereOr },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              items: true,
            },
          })
        : [];

    const ordersCount = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.grandTotal), 0);

    const recentOrders = orders.map((o) => ({
      orderId: o.id,
      orderNumber: o.orderNumber,
      grandTotal: Number(o.grandTotal),
      status: o.status,
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt,
      itemsCount: o.items.length,
      items: o.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
      })),
    }));

    return {
      found: true,
      userId,
      customerProfileId,
      fullName: fullName || 'Valued Customer',
      phone: cleanPhone,
      email,
      ordersCount,
      totalSpent,
      recentOrders,
    };
  }

  async createPosOrder(params: {
    orderNumber: string;
    customerId: string;
    cashierId: string;
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
    paymentMethod: PosPaymentMethodType;
    terminalId?: string;
    notes?: string;
    items: PosCartItemDto[];
    customerInfo?: PosCustomerInfoDto;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const variantIds = params.items
        .map((i) => i.variantId)
        .filter((id): id is string => Boolean(id));
      const existingVariants = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true },
      });
      const validVariantSet = new Set(existingVariants.map((v) => v.id));

      const createdOrder = await tx.order.create({
        data: {
          orderNumber: params.orderNumber,
          customerId: params.customerId,
          status: 'CONFIRMED',
          channel: 'POS_SHOPORA',
          paymentMethod: params.paymentMethod,
          terminalId: params.terminalId || 'COUNTER_1',
          subtotal: params.subtotal,
          discountTotal: params.discountTotal,
          taxTotal: params.taxTotal,
          shippingCharge: 0,
          grandTotal: params.grandTotal,
          notes: params.notes,
          createdBy: params.cashierId,
          addresses: {
            create: [
              {
                addressType: 'SHIPPING',
                fullName: params.customerInfo?.fullName || 'Walk-in Customer',
                phone: params.customerInfo?.phone || '9999999999',
                addressLine1: 'Vasanthi Designers Store - Over The Counter',
                city: 'Hyderabad',
                state: 'Telangana',
                country: 'IN',
                postalCode: '500034',
              },
            ],
          },
          items: {
            create: params.items.map((i) => ({
              product: { connect: { id: i.productId } },
              ...(i.variantId && validVariantSet.has(i.variantId)
                ? { variant: { connect: { id: i.variantId } } }
                : {}),
              productName: i.productName,
              variantTitle: i.variantTitle,
              sku: i.sku || 'POS-SKU',
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              totalPrice: i.unitPrice * i.quantity,
              discountAmount: i.discountAmount || 0,
              taxAmount: i.taxAmount || 0,
            })),
          },
          payments: {
            create: [
              {
                paymentNumber: `PAY-${params.orderNumber}`,
                method: params.paymentMethod,
                provider: 'POS_TERMINAL',
                status: 'COMPLETED',
                amount: params.grandTotal,
                createdBy: params.cashierId,
              },
            ],
          },
          timeline: {
            create: [
              {
                status: 'CONFIRMED',
                message: `POS Sale completed via ${params.paymentMethod}`,
                createdBy: params.cashierId,
              },
            ],
          },
        },
        include: {
          items: true,
          payments: true,
          addresses: true,
        },
      });

      return createdOrder;
    });
  }
}
