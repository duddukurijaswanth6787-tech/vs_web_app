import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  DashboardSummaryResponse,
  SalesChartResponse,
  OrderAnalyticsResponse,
  PaymentAnalyticsResponse,
  RecentActivityResponse,
} from './dashboard.types';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(): Promise<DashboardSummaryResponse> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(startOfToday.getTime() + 86400000);

    const orderFilter = (gte?: Date, lte?: Date) => ({
      deletedAt: null,
      ...(gte && { createdAt: { gte } }),
      ...(lte && { createdAt: { lte } }),
    });

    const todayFilter = {
      deletedAt: null,
      createdAt: { gte: startOfToday, lt: endOfToday },
    };

    const [
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      revenueAgg,
      lowStockCount,
      recentOrders,
      topProducts,
      todayRevenueAgg,
      todayOrders,
      categoriesCount,
      brandsCount,
      activeCoupons,
      outOfStockProducts,
      pendingReviews,
      returnsCount,
      cancelledOrders,
    ] = await Promise.all([
      this.prisma.order.count({ where: orderFilter(undefined, undefined) }),
      this.prisma.customerProfile.count(),
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.order.count({
        where: { status: 'PENDING', deletedAt: null },
      }),
      this.prisma.order.aggregate({
        _sum: { grandTotal: true },
        where: orderFilter(startOfMonth),
      }),
      this.prisma.inventory.count({ where: { stockStatus: 'LOW_STOCK' } }),
      this.prisma.order.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          grandTotal: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 10,
      }),
      this.prisma.order.aggregate({
        _sum: { grandTotal: true },
        where: todayFilter,
      }),
      this.prisma.order.count({ where: todayFilter }),
      this.prisma.category.count(),
      this.prisma.brand.count(),
      this.prisma.coupon.count({
        where: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
          deletedAt: null,
        },
      }),
      this.prisma.inventory.count({ where: { stockStatus: 'OUT_OF_STOCK' } }),
      this.prisma.review.count({ where: { status: 'PENDING' } }),
      this.prisma.returnRequest.count(),
      this.prisma.order.count({
        where: { status: 'CANCELLED', deletedAt: null },
      }),
    ]);

    const productIds = topProducts.map((p) => p.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, slug: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));
    const totalRev = Number(revenueAgg._sum.grandTotal ?? 0);

    return {
      totalOrders,
      totalRevenue: totalRev,
      totalCustomers,
      totalProducts,
      pendingOrders,
      lowStockCount,
      recentOrders,
      topProducts: topProducts.map((tp) => ({
        ...tp,
        product: productMap.get(tp.productId) ?? null,
      })),
      todayRevenue: Number(todayRevenueAgg._sum.grandTotal ?? 0),
      todayOrders,
      averageOrderValue:
        totalOrders > 0 ? Math.round(totalRev / totalOrders) : 0,
      categoriesCount,
      brandsCount,
      activeCoupons,
      lowStockProducts: lowStockCount, // ponytail: same metric as lowStockCount, using stockStatus field
      outOfStockProducts,
      pendingReviews,
      returnsCount,
      cancelledOrders,
    };
  }

  async getOrderAnalytics(
    dateFrom?: string,
    dateTo?: string,
  ): Promise<OrderAnalyticsResponse> {
    const where: any = { deletedAt: null };
    if (dateFrom) where.createdAt = { gte: new Date(dateFrom) };
    if (dateTo) where.createdAt = { ...where.createdAt, lte: new Date(dateTo) };

    const breakdown = await this.prisma.order.groupBy({
      by: ['status'],
      _count: true,
      where,
    });

    const allStatuses = [
      'PENDING',
      'PROCESSING',
      'PACKED',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
      'RETURNED',
      'REFUNDED',
    ];
    const map = new Map(breakdown.map((b) => [b.status, b._count]));
    return {
      statusBreakdown: allStatuses.map((status) => ({
        status,
        count: map.get(status) ?? 0,
      })),
    };
  }

  async getPaymentAnalytics(
    dateFrom?: string,
    dateTo?: string,
  ): Promise<PaymentAnalyticsResponse> {
    const paymentWhere: any = {};
    if (dateFrom) paymentWhere.createdAt = { gte: new Date(dateFrom) };
    if (dateTo)
      paymentWhere.createdAt = {
        ...paymentWhere.createdAt,
        lte: new Date(dateTo),
      };

    const [byMethod, refundAgg, failedCount] = await Promise.all([
      this.prisma.payment.groupBy({
        by: ['method'],
        _sum: { amount: true },
        _count: true,
        where: { status: 'COMPLETED', ...paymentWhere },
      }),
      this.prisma.refund.aggregate({
        _sum: { amount: true },
        where: paymentWhere,
      }),
      this.prisma.payment.count({
        where: { status: 'FAILED', ...paymentWhere },
      }),
    ]);

    return {
      byMethod: byMethod.map((m) => ({
        method: m.method,
        revenue: Number(m._sum.amount ?? 0),
        count: m._count,
      })),
      totalRefunds: Number(refundAgg._sum.amount ?? 0),
      failedPayments: failedCount,
    };
  }

  async getRecentActivity(): Promise<RecentActivityResponse> {
    const [orders, products, customers, reviews] = await Promise.all([
      this.prisma.order.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          grandTotal: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.product.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, slug: true, createdAt: true },
      }),
      this.prisma.customerProfile.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, userId: true, createdAt: true },
      }),
      this.prisma.review.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          productId: true,
        },
      }),
    ]);
    return { orders, products, customers, reviews };
  }

  async getSalesChart(period: string = 'monthly'): Promise<SalesChartResponse> {
    const now = new Date();
    let startDate: Date;
    let groupBy: 'day' | 'month';

    if (period === 'weekly') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      groupBy = 'day';
    } else if (period === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
      groupBy = 'month';
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      groupBy = 'day';
    }

    const orders = await this.prisma.order.findMany({
      where: { deletedAt: null, createdAt: { gte: startDate } },
      select: { grandTotal: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const bucket = new Map<string, number>();
    for (const order of orders) {
      const key =
        groupBy === 'day'
          ? order.createdAt.toISOString().slice(0, 10)
          : `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
      bucket.set(key, (bucket.get(key) ?? 0) + Number(order.grandTotal));
    }

    return {
      labels: Array.from(bucket.keys()),
      data: Array.from(bucket.values()),
    };
  }
}
