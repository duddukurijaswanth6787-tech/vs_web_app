import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { StorageService } from '@infrastructure/storage/storage.service';
import { BusinessException } from '@common/exceptions';
import {
  GenerateReportDto,
  ReportResponse,
  ExportJobResponse,
} from './report.types';

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    @Optional()
    @InjectQueue('report-export')
    private readonly exportQueue?: Queue,
  ) {}

  async generateSalesReport(
    startDate?: string,
    endDate?: string,
  ): Promise<ReportResponse> {
    const where: any = { deletedAt: null };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [orders, revenueAgg] = await Promise.all([
      this.prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          grandTotal: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.aggregate({ _sum: { grandTotal: true }, where }),
    ]);

    return {
      type: 'SALES',
      data: {
        totalRevenue: Number(revenueAgg._sum.grandTotal ?? 0),
        totalOrders: orders.length,
        orders,
      },
      generatedAt: new Date(),
    };
  }

  async generateInventoryReport(): Promise<ReportResponse> {
    const inventory = await this.prisma.inventory.findMany({
      include: {
        variant: {
          select: {
            sku: true,
            title: true,
            product: { select: { name: true } },
          },
        },
      },
    });

    return {
      type: 'INVENTORY',
      data: {
        totalItems: inventory.length,
        lowStock: inventory.filter((i) => i.stockStatus === 'LOW_STOCK').length,
        outOfStock: inventory.filter((i) => i.stockStatus === 'OUT_OF_STOCK')
          .length,
        items: inventory,
      },
      generatedAt: new Date(),
    };
  }

  async generateCustomerReport(): Promise<ReportResponse> {
    const [customers, totalOrders] = await Promise.all([
      this.prisma.customerProfile.findMany({
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          _count: { select: { orders: true } },
        },
      }),
      this.prisma.order.groupBy({
        by: ['customerId'],
        _sum: { grandTotal: true },
        _count: true,
      }),
    ]);

    const orderMap = new Map(totalOrders.map((o) => [o.customerId, o]));

    return {
      type: 'CUSTOMER',
      data: {
        totalCustomers: customers.length,
        customers: customers.map((c) => ({
          ...c,
          totalSpent: Number(orderMap.get(c.id)?._sum.grandTotal ?? 0),
          orderCount: orderMap.get(c.id)?._count ?? 0,
        })),
      },
      generatedAt: new Date(),
    };
  }

  async generateOrderReport(
    startDate?: string,
    endDate?: string,
  ): Promise<ReportResponse> {
    const where: any = { deletedAt: null };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [orders, statusCounts] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            select: { productName: true, quantity: true, totalPrice: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.groupBy({ by: ['status'], _count: true, where }),
    ]);

    return {
      type: 'ORDER',
      data: {
        totalOrders: orders.length,
        statusBreakdown: Object.fromEntries(
          statusCounts.map((s) => [s.status, s._count]),
        ),
        orders,
      },
      generatedAt: new Date(),
    };
  }

  async generateListReport(
    type: string,
    startDate?: string,
    endDate?: string,
    page = 1,
    limit = 50,
  ): Promise<ReportResponse> {
    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    const skip = (page - 1) * limit;

    switch (type) {
      case 'PRODUCTS': {
        const [items, total] = await Promise.all([
          this.prisma.product.findMany({
            where: { deletedAt: null, ...where },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { variants: true } } },
          }),
          this.prisma.product.count({ where: { deletedAt: null } }),
        ]);
        return {
          type: 'PRODUCTS',
          data: { items, total, page, limit },
          generatedAt: new Date(),
        };
      }
      case 'COUPONS': {
        const [items, total] = await Promise.all([
          this.prisma.coupon.findMany({
            where: { deletedAt: null, ...where },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.coupon.count({ where: { deletedAt: null } }),
        ]);
        return {
          type: 'COUPONS',
          data: { items, total, page, limit },
          generatedAt: new Date(),
        };
      }
      case 'RETURNS': {
        const [items, total] = await Promise.all([
          this.prisma.returnRequest.findMany({
            where: { ...where },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { order: { select: { orderNumber: true } } },
          }),
          this.prisma.returnRequest.count({ where: { ...where } }),
        ]);
        return {
          type: 'RETURNS',
          data: { items, total, page, limit },
          generatedAt: new Date(),
        };
      }
      case 'PAYMENTS': {
        const [items, total] = await Promise.all([
          this.prisma.payment.findMany({
            where: { ...where },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { order: { select: { orderNumber: true } } },
          }),
          this.prisma.payment.count({ where: { ...where } }),
        ]);
        return {
          type: 'PAYMENTS',
          data: { items, total, page, limit },
          generatedAt: new Date(),
        };
      }
      case 'TAX': {
        const [items, total] = await Promise.all([
          this.prisma.order.findMany({
            where: { deletedAt: null, ...where },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              orderNumber: true,
              taxTotal: true,
              grandTotal: true,
              createdAt: true,
              status: true,
            },
          }),
          this.prisma.order.count({ where: { deletedAt: null, ...where } }),
        ]);
        return {
          type: 'TAX',
          data: { items, total, page, limit },
          generatedAt: new Date(),
        };
      }
      case 'SHIPPING': {
        const [items, total] = await Promise.all([
          this.prisma.order.findMany({
            where: { deletedAt: null, ...where },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              orderNumber: true,
              shippingCharge: true,
              grandTotal: true,
              createdAt: true,
              status: true,
            },
          }),
          this.prisma.order.count({ where: { deletedAt: null, ...where } }),
        ]);
        return {
          type: 'SHIPPING',
          data: { items, total, page, limit },
          generatedAt: new Date(),
        };
      }
      case 'CATEGORIES': {
        const [items, total] = await Promise.all([
          this.prisma.category.findMany({
            where: { ...where },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { productMappings: true } } },
          }),
          this.prisma.category.count({ where: { ...where } }),
        ]);
        return {
          type: 'CATEGORIES',
          data: { items, total, page, limit },
          generatedAt: new Date(),
        };
      }
      case 'BRANDS': {
        const [items, total] = await Promise.all([
          this.prisma.brand.findMany({
            where: { ...where },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { products: true } } },
          }),
          this.prisma.brand.count({ where: { ...where } }),
        ]);
        return {
          type: 'BRANDS',
          data: { items, total, page, limit },
          generatedAt: new Date(),
        };
      }
      case 'REVIEWS': {
        const [items, total] = await Promise.all([
          this.prisma.review.findMany({
            where: { deletedAt: null, ...where },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { product: { select: { name: true } } },
          }),
          this.prisma.review.count({ where: { deletedAt: null, ...where } }),
        ]);
        return {
          type: 'REVIEWS',
          data: { items, total, page, limit },
          generatedAt: new Date(),
        };
      }
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }
  }

  async getExportJobs(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.exportJob.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.exportJob.count(),
    ]);

    return {
      data: data.map((job) => ({
        id: job.id,
        type: job.type,
        format: job.format,
        status: job.status,
        fileUrl: job.fileUrl ?? undefined,
        error: job.error ?? undefined,
        createdAt: job.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
    };
  }

  async getExportJobDownloadUrl(id: string) {
    const job = await this.prisma.exportJob.findUnique({
      where: { id },
    });

    if (!job) throw new BusinessException('Export job not found', 'EXPORT_001');
    if (job.status !== 'COMPLETED' || !job.fileUrl) {
      throw new BusinessException('Export file not ready', 'EXPORT_002');
    }

    const url = await this.storageService.getSignedDownloadUrl(job.fileUrl);
    return { url };
  }

  async createExportJob(
    dto: GenerateReportDto,
    userId: string,
  ): Promise<ExportJobResponse> {
    const job = await this.prisma.exportJob.create({
      data: {
        type: dto.type,
        format: dto.format ?? 'CSV',
        requestedBy: userId,
      },
    });

    const isBullMQEnabled = process.env.ENABLE_BULLMQ !== 'false';

    if (isBullMQEnabled && this.exportQueue) {
      await this.exportQueue.add('generate-report', {
        jobId: job.id,
        type: job.type,
        format: job.format,
        startDate: dto.startDate,
        endDate: dto.endDate,
        userId,
      });
    } else {
      // Fallback: trigger synchronous generation in next tick
      process.nextTick(async () => {
        try {
          await this.prisma.exportJob.update({
            where: { id: job.id },
            data: { status: 'PROCESSING' },
          });

          let reportData: any;
          const listTypes = [
            'PRODUCTS',
            'COUPONS',
            'RETURNS',
            'PAYMENTS',
            'TAX',
            'SHIPPING',
            'CATEGORIES',
            'BRANDS',
            'REVIEWS',
          ];
          if (job.type === 'SALES') {
            reportData = await this.generateSalesReport(
              dto.startDate,
              dto.endDate,
            );
          } else if (job.type === 'INVENTORY') {
            reportData = await this.generateInventoryReport();
          } else if (job.type === 'CUSTOMER') {
            reportData = await this.generateCustomerReport();
          } else if (job.type === 'ORDER') {
            reportData = await this.generateOrderReport(
              dto.startDate,
              dto.endDate,
            );
          } else if (listTypes.includes(job.type)) {
            reportData = await this.generateListReport(
              job.type,
              dto.startDate,
              dto.endDate,
            );
          } else {
            throw new Error(`Unsupported report type: ${job.type}`);
          }

          const csvString = this.convertToCsv(job.type, reportData.data);
          const csvBuffer = Buffer.from(csvString, 'utf-8');

          const filename = `export_${job.type.toLowerCase()}_${Date.now()}.csv`;
          const uploadResult = await this.storageService.upload(csvBuffer, {
            originalName: filename,
            mimeType: 'text/csv',
            folder: `exports/${job.type.toLowerCase()}/${job.id}`,
          });

          await this.prisma.exportJob.update({
            where: { id: job.id },
            data: {
              status: 'COMPLETED',
              fileUrl: uploadResult.key,
            },
          });
        } catch (err: any) {
          await this.prisma.exportJob.update({
            where: { id: job.id },
            data: {
              status: 'FAILED',
              error: err.message,
            },
          });
        }
      });
    }

    return {
      id: job.id,
      type: job.type,
      format: job.format,
      status: job.status,
      fileUrl: job.fileUrl ?? undefined,
      createdAt: job.createdAt,
    };
  }

  private convertToCsv(type: string, data: any): string {
    if (type === 'SALES') {
      const headers = 'OrderId,OrderNumber,GrandTotal,Status,CreatedAt\n';
      const rows = (data.orders || [])
        .map(
          (o: any) =>
            `"${o.id}","${o.orderNumber}",${o.grandTotal},"${o.status}","${o.createdAt.toISOString ? o.createdAt.toISOString() : o.createdAt}"`,
        )
        .join('\n');
      return headers + rows;
    }
    if (type === 'INVENTORY') {
      const headers =
        'InventoryId,SKU,Product,Quantity,ReservedQuantity,StockStatus\n';
      const rows = (data.items || [])
        .map(
          (i: any) =>
            `"${i.id}","${i.variant?.sku || ''}","${i.variant?.product?.name || ''}",${i.quantity},${i.reservedQuantity},"${i.stockStatus}"`,
        )
        .join('\n');
      return headers + rows;
    }
    if (type === 'CUSTOMER') {
      const headers =
        'CustomerId,FirstName,LastName,Email,Phone,Gender,OrderCount,TotalSpent\n';
      const rows = (data.customers || [])
        .map(
          (c: any) =>
            `"${c.id}","${c.user?.firstName || ''}","${c.user?.lastName || ''}","${c.user?.email || ''}","${c.phone || ''}","${c.gender || ''}",${c.orderCount},${c.totalSpent}`,
        )
        .join('\n');
      return headers + rows;
    }
    if (type === 'ORDER') {
      const headers =
        'OrderId,OrderNumber,GrandTotal,Status,CreatedAt,ItemsCount\n';
      const rows = (data.orders || [])
        .map(
          (o: any) =>
            `"${o.id}","${o.orderNumber}",${o.grandTotal},"${o.status}","${o.createdAt.toISOString ? o.createdAt.toISOString() : o.createdAt}",${o.items?.length || 0}`,
        )
        .join('\n');
      return headers + rows;
    }
    // Generic list report types
    if (
      [
        'PRODUCTS',
        'COUPONS',
        'RETURNS',
        'PAYMENTS',
        'TAX',
        'SHIPPING',
        'CATEGORIES',
        'BRANDS',
        'REVIEWS',
      ].includes(type)
    ) {
      const items = data.items || [];
      if (!items.length) return 'No data';
      const keys = Object.keys(items[0]).filter(
        (k) => k !== 'id' && typeof items[0][k] !== 'object',
      );
      const headers = keys.map((k) => `"${k}"`).join(',') + '\n';
      const rows = items
        .map((item: any) => keys.map((k) => `"${item[k] ?? ''}"`).join(','))
        .join('\n');
      return headers + rows;
    }
    return 'No data';
  }
}
