import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CheckoutSessionStatus, Prisma } from '@prisma/client';
import {
  CreateCheckoutSessionDto,
  DEFAULT_TERMINAL_ID,
  PosCartItemDto,
  PosCustomerInfoDto,
  PosPaymentMethodType,
} from './pos.types';

@Injectable()
export class PosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findVariantByBarcode(code: string) {
    const trimmed = code.trim();
    // ONLINE-only products aren't stocked at the counter -- POS scan/search
    // should never resolve to one, even by exact barcode/SKU match.
    const sellableInStore: Prisma.ProductWhereInput = {
      channel: { in: ['STORE', 'BOTH'] },
    };

    // 1. Search directly on ProductVariant (barcode, sku, id)
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        OR: [
          { barcode: { equals: trimmed, mode: 'insensitive' } },
          { sku: { equals: trimmed, mode: 'insensitive' } },
          { id: trimmed },
        ],
        deletedAt: null,
        product: sellableInStore,
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
        ...sellableInStore,
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
        // No ProductVariant row exists for this product, so there is no
        // Inventory row either (Inventory is keyed off variantId) -- report
        // it the same way every other untracked variant is reported
        // (scanBarcode's `inventory?.availableQuantity ?? 0`), not a fake
        // in-stock number.
        inventory: null,
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

  /**
   * Variants matching a typed name, for the till's product search.
   *
   * Returns the same shape as findVariantByBarcode so the caller can map it
   * through the one scan-result builder -- a second mapping would be a second
   * place for stock, price or the GST rate to be got wrong.
   *
   * Restricted to store-sellable products for the same reason the scan is:
   * an online-only line has no business on the counter screen.
   */
  async searchVariantsByName(query: string, limit = 10) {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    return this.prisma.productVariant.findMany({
      where: {
        deletedAt: null,
        product: {
          channel: { in: ['STORE', 'BOTH'] },
          deletedAt: null,
          OR: [
            { name: { contains: trimmed, mode: 'insensitive' } },
            { sku: { contains: trimmed, mode: 'insensitive' } },
          ],
        },
      },
      include: {
        product: {
          include: {
            media: { where: { isPrimary: true, deletedAt: null }, take: 1 },
          },
        },
        inventory: true,
        attributeValues: { include: { attribute: true, option: true } },
        media: { where: { isPrimary: true, deletedAt: null }, take: 1 },
      },
      take: Math.min(25, Math.max(1, limit)),
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * GST rate per product, for pricing a till sale.
   *
   * Read at bill time rather than taken from the client: the phones in the
   * shop still send a flat 5%, and a rate that decides tax must not be
   * something the caller can choose.
   */
  async findProductTaxRates(
    productIds: string[],
  ): Promise<Map<string, number>> {
    const unique = Array.from(new Set(productIds.filter(Boolean)));
    if (!unique.length) return new Map();

    const rows = await this.prisma.product.findMany({
      where: { id: { in: unique } },
      select: { id: true, taxPercentage: true },
    });

    return new Map(rows.map((r) => [r.id, Number(r.taxPercentage ?? 0)]));
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
          terminalId: params.terminalId || DEFAULT_TERMINAL_ID,
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

  async findOrderByOrderNumber(orderNumber: string) {
    return this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });
  }

  /**
   * A past sale with everything needed to take items back over the counter:
   * the line items, the payment the refund attaches to, and how much of each
   * line has already gone back.
   *
   * Rejected returns are excluded from the returned tally -- goods that were
   * refused are still the customer's, so those quantities remain returnable.
   */
  async findSaleForReturn(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        payments: { orderBy: { createdAt: 'desc' } },
        customer: { select: { id: true, phone: true } },
      },
    });
    if (!order) return null;

    const alreadyReturned = await this.prisma.returnItem.groupBy({
      by: ['orderItemId'],
      _sum: { quantity: true },
      where: {
        orderItem: { orderId: order.id },
        returnRequest: { status: { notIn: ['REJECTED', 'CANCELLED'] } },
      },
    });

    const returnedByItem = new Map(
      alreadyReturned.map((r) => [r.orderItemId, r._sum.quantity ?? 0]),
    );

    return { order, returnedByItem };
  }

  /**
   * Records a completed over-the-counter return: the return itself, the
   * refund, and the restock, in one transaction. Either the shop has the
   * goods back and the customer has their money, or neither happened.
   */
  async createPosReturn(params: {
    orderId: string;
    orderNumber: string;
    paymentId: string;
    returnNumber: string;
    refundNumber: string;
    reason: string;
    notes?: string;
    refundMethod: string;
    refundAmount: number;
    cashierId: string;
    items: {
      orderItemId: string;
      variantId: string | null;
      quantity: number;
    }[];
    restock: (tx: Prisma.TransactionClient) => Promise<void>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const returnRequest = await tx.returnRequest.create({
        data: {
          orderId: params.orderId,
          returnNumber: params.returnNumber,
          reason: params.reason,
          // Not a request awaiting approval: the customer is at the counter,
          // the goods are back, and the money has been handed over.
          status: 'COMPLETED',
          adminNotes: params.notes,
          createdBy: params.cashierId,
          refundPreference: params.refundMethod,
          items: {
            create: params.items.map((i) => ({
              orderItemId: i.orderItemId,
              quantity: i.quantity,
              reason: params.reason,
            })),
          },
        },
        include: { items: true },
      });

      const refund = await tx.refund.create({
        data: {
          paymentId: params.paymentId,
          orderId: params.orderId,
          refundNumber: params.refundNumber,
          amount: params.refundAmount,
          reason: params.reason,
          status: 'COMPLETED',
          // Read back by getCashMovementForWindow to work out what should be
          // left in the drawer, so a cash refund has to say so here.
          method: params.refundMethod,
          createdBy: params.cashierId,
        },
      });

      await params.restock(tx);

      return { returnRequest, refund };
    });
  }

  async findInventoryQuantities(
    variantIds: string[],
  ): Promise<
    Map<string, { availableQuantity: number; allowBackorder: boolean }>
  > {
    if (variantIds.length === 0) return new Map();
    const rows = await this.prisma.inventory.findMany({
      where: { variantId: { in: variantIds } },
      select: {
        variantId: true,
        availableQuantity: true,
        allowBackorder: true,
      },
    });
    return new Map(
      rows.map((r) => [
        r.variantId,
        {
          availableQuantity: r.availableQuantity,
          allowBackorder: r.allowBackorder,
        },
      ]),
    );
  }

  /**
   * The open shift on a terminal, whoever opened it.
   *
   * A shift's takings are every POS sale on its terminal between openedAt and
   * closedAt (see getCashMovementForWindow -- it filters by terminal, not by
   * cashier). Two overlapping shifts on one terminal would therefore each
   * count the other's sales, so a terminal may only have one open at a time.
   */
  async findOpenShiftForTerminal(terminalId: string) {
    return this.prisma.posShift.findFirst({
      where: { terminalId, status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
      include: { cashier: { select: { firstName: true, lastName: true } } },
    });
  }

  async findOpenShift(cashierId: string, terminalId?: string) {
    return this.prisma.posShift.findFirst({
      where: {
        cashierId,
        status: 'OPEN',
        ...(terminalId && { terminalId }),
      },
      orderBy: { openedAt: 'desc' },
    });
  }

  async createShift(params: {
    terminalId: string;
    cashierId: string;
    openingCash: number;
    notes?: string;
  }) {
    return this.prisma.posShift.create({ data: params });
  }

  async findShiftById(id: string) {
    return this.prisma.posShift.findUnique({
      where: { id },
      include: {
        cashier: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async closeShift(
    id: string,
    data: {
      closingCashExpected: number;
      closingCashCounted: number;
      variance: number;
      notes?: string;
    },
  ) {
    return this.prisma.posShift.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closingCashExpected: data.closingCashExpected,
        closingCashCounted: data.closingCashCounted,
        variance: data.variance,
        ...(data.notes && { notes: data.notes }),
      },
    });
  }

  async listShifts(params: {
    page: number;
    limit: number;
    status?: string;
    terminalId?: string;
    cashierId?: string;
  }) {
    const where: Prisma.PosShiftWhereInput = {
      ...(params.status && { status: params.status }),
      ...(params.terminalId && { terminalId: params.terminalId }),
      ...(params.cashierId && { cashierId: params.cashierId }),
    };
    const [data, total] = await Promise.all([
      this.prisma.posShift.findMany({
        where,
        orderBy: { openedAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        include: {
          cashier: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.posShift.count({ where }),
    ]);
    return { data, total };
  }

  async getCashMovementForWindow(
    terminalId: string,
    from: Date,
    to: Date,
  ): Promise<{ cashSales: number; cashRefunds: number }> {
    const [salesAgg, refunds] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { grandTotal: true },
        where: {
          terminalId,
          channel: 'POS_SHOPORA',
          paymentMethod: 'CASH',
          deletedAt: null,
          createdAt: { gte: from, lte: to },
        },
      }),
      this.prisma.refund.findMany({
        where: {
          method: 'CASH',
          createdAt: { gte: from, lte: to },
          order: { terminalId, channel: 'POS_SHOPORA' },
        },
        select: { amount: true },
      }),
    ]);
    return {
      cashSales: Number(salesAgg._sum.grandTotal ?? 0),
      cashRefunds: refunds.reduce((sum, r) => sum + Number(r.amount), 0),
    };
  }

  async getShiftSalesBreakdown(terminalId: string, from: Date, to: Date) {
    const [byMethod, orderCount, refunds] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['paymentMethod'],
        _sum: { grandTotal: true },
        _count: true,
        where: {
          terminalId,
          channel: 'POS_SHOPORA',
          deletedAt: null,
          createdAt: { gte: from, lte: to },
        },
      }),
      this.prisma.order.count({
        where: {
          terminalId,
          channel: 'POS_SHOPORA',
          deletedAt: null,
          createdAt: { gte: from, lte: to },
        },
      }),
      this.prisma.refund.findMany({
        where: {
          createdAt: { gte: from, lte: to },
          order: { terminalId, channel: 'POS_SHOPORA' },
        },
        select: { amount: true, method: true },
      }),
    ]);
    return {
      byMethod: byMethod.map((m) => ({
        method: m.paymentMethod,
        revenue: Number(m._sum.grandTotal ?? 0),
        count: m._count,
      })),
      orderCount,
      refundsCount: refunds.length,
      refundsAmount: refunds.reduce((sum, r) => sum + Number(r.amount), 0),
    };
  }

  async getPosDaySummary(from: Date, to: Date) {
    const orderWhere: Prisma.OrderWhereInput = {
      channel: 'POS_SHOPORA',
      deletedAt: null,
      createdAt: { gte: from, lte: to },
    };

    const [byMethod, byTerminal, byCashier, refunds, totalAgg] =
      await Promise.all([
        this.prisma.order.groupBy({
          by: ['paymentMethod'],
          _sum: { grandTotal: true },
          _count: true,
          where: orderWhere,
        }),
        this.prisma.order.groupBy({
          by: ['terminalId'],
          _sum: { grandTotal: true },
          _count: true,
          where: orderWhere,
        }),
        this.prisma.order.groupBy({
          by: ['createdBy'],
          _sum: { grandTotal: true },
          _count: true,
          where: orderWhere,
        }),
        this.prisma.refund.findMany({
          where: {
            createdAt: { gte: from, lte: to },
            order: { channel: 'POS_SHOPORA' },
          },
          select: { amount: true, order: { select: { terminalId: true } } },
        }),
        this.prisma.order.aggregate({
          _sum: { grandTotal: true },
          _count: true,
          where: orderWhere,
        }),
      ]);

    const cashierIds = byCashier
      .map((c) => c.createdBy)
      .filter((id): id is string => Boolean(id));
    const cashiers = await this.prisma.user.findMany({
      where: { id: { in: cashierIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    const cashierMap = new Map(cashiers.map((c) => [c.id, c]));

    const refundsByTerminal = new Map<
      string,
      { count: number; amount: number }
    >();
    for (const r of refunds) {
      const key = r.order.terminalId || 'COUNTER_1';
      const existing = refundsByTerminal.get(key);
      if (existing) {
        existing.count += 1;
        existing.amount += Number(r.amount);
      } else {
        refundsByTerminal.set(key, { count: 1, amount: Number(r.amount) });
      }
    }

    return {
      totalRevenue: Number(totalAgg._sum.grandTotal ?? 0),
      totalOrders: totalAgg._count,
      byMethod: byMethod.map((m) => ({
        method: m.paymentMethod,
        revenue: Number(m._sum.grandTotal ?? 0),
        count: m._count,
      })),
      byTerminal: byTerminal.map((t) => ({
        terminalId: t.terminalId,
        revenue: Number(t._sum.grandTotal ?? 0),
        orderCount: t._count,
        refundsCount:
          refundsByTerminal.get(t.terminalId || 'COUNTER_1')?.count ?? 0,
        refundsAmount:
          refundsByTerminal.get(t.terminalId || 'COUNTER_1')?.amount ?? 0,
      })),
      byCashier: byCashier
        .filter((c) => c.createdBy)
        .map((c) => {
          const user = cashierMap.get(c.createdBy!);
          return {
            cashierId: c.createdBy,
            cashierName: user
              ? `${user.firstName} ${user.lastName || ''}`.trim()
              : 'Unknown',
            revenue: Number(c._sum.grandTotal ?? 0),
            orderCount: c._count,
          };
        }),
      totalRefundsCount: refunds.length,
      totalRefundsAmount: refunds.reduce((sum, r) => sum + Number(r.amount), 0),
    };
  }
}
