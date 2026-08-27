"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const storage_service_1 = require("../../infrastructure/storage/storage.service");
const exceptions_1 = require("../../common/exceptions");
const sales_series_1 = require("./sales-series");
let ReportService = class ReportService {
    prisma;
    storageService;
    exportQueue;
    constructor(prisma, storageService, exportQueue) {
        this.prisma = prisma;
        this.storageService = storageService;
        this.exportQueue = exportQueue;
    }
    async generateSalesReport(startDate, endDate, granularity, channel) {
        const where = { deletedAt: null };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const channelFilter = (0, sales_series_1.parseChannel)(channel);
        if (channelFilter)
            where.channel = channelFilter;
        const [orders, revenueAgg] = await Promise.all([
            this.prisma.order.findMany({
                where,
                select: {
                    id: true,
                    orderNumber: true,
                    grandTotal: true,
                    status: true,
                    channel: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.order.aggregate({ _sum: { grandTotal: true }, where }),
        ]);
        const to = endDate ? new Date(endDate) : new Date();
        const from = startDate
            ? new Date(startDate)
            : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
        const series = (0, sales_series_1.buildSalesSeries)(orders, (0, sales_series_1.parseGranularity)(granularity), from, to);
        const onlineRevenue = series.reduce((sum, p) => sum + p.onlineRevenue, 0);
        const offlineRevenue = series.reduce((sum, p) => sum + p.offlineRevenue, 0);
        return {
            type: 'SALES',
            data: {
                totalRevenue: Number(revenueAgg._sum.grandTotal ?? 0),
                totalOrders: orders.length,
                orders,
                granularity: (0, sales_series_1.parseGranularity)(granularity),
                channel: channelFilter ?? 'ALL',
                series,
                onlineRevenue,
                offlineRevenue,
                onlineOrders: series.reduce((sum, p) => sum + p.onlineOrders, 0),
                offlineOrders: series.reduce((sum, p) => sum + p.offlineOrders, 0),
            },
            generatedAt: new Date(),
        };
    }
    async generateInventoryMovementSeries(startDate, endDate, granularity) {
        const to = endDate ? new Date(endDate) : new Date();
        const from = startDate
            ? new Date(startDate)
            : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
        const movements = await this.prisma.inventoryMovement.findMany({
            where: { createdAt: { gte: from, lte: to } },
            select: { createdAt: true, quantity: true, movementType: true },
            orderBy: { createdAt: 'asc' },
        });
        const asOrders = movements.map((m) => ({
            createdAt: m.createdAt,
            grandTotal: Math.abs(m.quantity),
            channel: /OUT|SALE|DEDUCT|DAMAGE/i.test(m.movementType)
                ? 'POS_SHOPORA'
                : 'ONLINE_STORE',
        }));
        const series = (0, sales_series_1.buildSalesSeries)(asOrders, (0, sales_series_1.parseGranularity)(granularity), from, to).map((p) => ({
            bucket: p.bucket,
            label: p.label,
            stockIn: p.onlineRevenue,
            stockOut: p.offlineRevenue,
            movementsIn: p.onlineOrders,
            movementsOut: p.offlineOrders,
            net: p.onlineRevenue - p.offlineRevenue,
        }));
        return {
            type: 'INVENTORY_MOVEMENT',
            data: {
                granularity: (0, sales_series_1.parseGranularity)(granularity),
                series,
                totalIn: series.reduce((s, p) => s + p.stockIn, 0),
                totalOut: series.reduce((s, p) => s + p.stockOut, 0),
            },
            generatedAt: new Date(),
        };
    }
    async generateInventoryReport() {
        const [inventory, warehouseRows] = await Promise.all([
            this.prisma.inventory.findMany({
                include: {
                    variant: {
                        select: {
                            sku: true,
                            title: true,
                            product: { select: { name: true } },
                        },
                    },
                },
            }),
            this.prisma.variantWarehouseInventory.findMany({
                select: {
                    availableQuantity: true,
                    warehouse: { select: { id: true, name: true } },
                },
            }),
        ]);
        const warehouseTotals = new Map();
        for (const row of warehouseRows) {
            const key = row.warehouse.id;
            const existing = warehouseTotals.get(key);
            if (existing) {
                existing.totalQuantity += row.availableQuantity;
            }
            else {
                warehouseTotals.set(key, {
                    warehouseId: row.warehouse.id,
                    warehouseName: row.warehouse.name,
                    totalQuantity: row.availableQuantity,
                });
            }
        }
        return {
            type: 'INVENTORY',
            data: {
                totalItems: inventory.length,
                lowStock: inventory.filter((i) => i.stockStatus === 'LOW_STOCK').length,
                outOfStock: inventory.filter((i) => i.stockStatus === 'OUT_OF_STOCK')
                    .length,
                items: inventory,
                warehouseBreakdown: Array.from(warehouseTotals.values()),
            },
            generatedAt: new Date(),
        };
    }
    async getProductCategoryBreakdown() {
        const items = await this.prisma.orderItem.findMany({
            where: { order: { deletedAt: null } },
            select: {
                productId: true,
                quantity: true,
                totalPrice: true,
            },
        });
        const productIds = Array.from(new Set(items.map((i) => i.productId)));
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: {
                id: true,
                categories: {
                    take: 1,
                    select: { category: { select: { id: true, name: true } } },
                },
            },
        });
        const productCategoryMap = new Map(products.map((p) => [p.id, p.categories[0]?.category ?? null]));
        const totals = new Map();
        let uncategorizedRevenue = 0;
        let uncategorizedUnits = 0;
        for (const item of items) {
            const category = productCategoryMap.get(item.productId);
            if (!category) {
                uncategorizedRevenue += Number(item.totalPrice);
                uncategorizedUnits += item.quantity;
                continue;
            }
            const existing = totals.get(category.id);
            if (existing) {
                existing.revenue += Number(item.totalPrice);
                existing.unitsSold += item.quantity;
            }
            else {
                totals.set(category.id, {
                    categoryId: category.id,
                    categoryName: category.name,
                    revenue: Number(item.totalPrice),
                    unitsSold: item.quantity,
                });
            }
        }
        const breakdown = Array.from(totals.values()).sort((a, b) => b.revenue - a.revenue);
        if (uncategorizedRevenue > 0) {
            breakdown.push({
                categoryId: 'uncategorized',
                categoryName: 'Uncategorized',
                revenue: uncategorizedRevenue,
                unitsSold: uncategorizedUnits,
            });
        }
        return {
            type: 'PRODUCT_CATEGORY_BREAKDOWN',
            data: { breakdown },
            generatedAt: new Date(),
        };
    }
    async generateCustomerReport() {
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
    async generateOrderReport(startDate, endDate, channel) {
        const where = { deletedAt: null };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const channelFilter = (0, sales_series_1.parseChannel)(channel);
        if (channelFilter)
            where.channel = channelFilter;
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
        const channelCounts = await this.prisma.order.groupBy({
            by: ['channel'],
            _count: true,
            _sum: { grandTotal: true },
            where,
        });
        return {
            type: 'ORDER',
            data: {
                totalOrders: orders.length,
                statusBreakdown: Object.fromEntries(statusCounts.map((s) => [s.status, s._count])),
                channelBreakdown: channelCounts.map((c) => ({
                    channel: c.channel,
                    orders: c._count,
                    revenue: Number(c._sum.grandTotal ?? 0),
                })),
                channel: channelFilter ?? 'ALL',
                orders,
            },
            generatedAt: new Date(),
        };
    }
    async generateListReport(type, startDate, endDate, page = 1, limit = 50) {
        const where = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
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
    async getExportJobDownloadUrl(id) {
        const job = await this.prisma.exportJob.findUnique({
            where: { id },
        });
        if (!job)
            throw new exceptions_1.BusinessException('Export job not found', 'EXPORT_001');
        if (job.status !== 'COMPLETED' || !job.fileUrl) {
            throw new exceptions_1.BusinessException('Export file not ready', 'EXPORT_002');
        }
        const url = await this.storageService.getSignedDownloadUrl(job.fileUrl);
        return { url };
    }
    async createExportJob(dto, userId) {
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
        }
        else {
            process.nextTick(async () => {
                try {
                    await this.prisma.exportJob.update({
                        where: { id: job.id },
                        data: { status: 'PROCESSING' },
                    });
                    let reportData;
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
                        reportData = await this.generateSalesReport(dto.startDate, dto.endDate);
                    }
                    else if (job.type === 'INVENTORY') {
                        reportData = await this.generateInventoryReport();
                    }
                    else if (job.type === 'CUSTOMER') {
                        reportData = await this.generateCustomerReport();
                    }
                    else if (job.type === 'ORDER') {
                        reportData = await this.generateOrderReport(dto.startDate, dto.endDate);
                    }
                    else if (listTypes.includes(job.type)) {
                        reportData = await this.generateListReport(job.type, dto.startDate, dto.endDate);
                    }
                    else {
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
                }
                catch (err) {
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
    convertToCsv(type, data) {
        if (type === 'SALES') {
            const headers = 'OrderId,OrderNumber,GrandTotal,Status,CreatedAt\n';
            const rows = (data.orders || [])
                .map((o) => `"${o.id}","${o.orderNumber}",${o.grandTotal},"${o.status}","${o.createdAt.toISOString ? o.createdAt.toISOString() : o.createdAt}"`)
                .join('\n');
            return headers + rows;
        }
        if (type === 'INVENTORY') {
            const headers = 'InventoryId,SKU,Product,Quantity,ReservedQuantity,StockStatus\n';
            const rows = (data.items || [])
                .map((i) => `"${i.id}","${i.variant?.sku || ''}","${i.variant?.product?.name || ''}",${i.quantity},${i.reservedQuantity},"${i.stockStatus}"`)
                .join('\n');
            return headers + rows;
        }
        if (type === 'CUSTOMER') {
            const headers = 'CustomerId,FirstName,LastName,Email,Phone,Gender,OrderCount,TotalSpent\n';
            const rows = (data.customers || [])
                .map((c) => `"${c.id}","${c.user?.firstName || ''}","${c.user?.lastName || ''}","${c.user?.email || ''}","${c.phone || ''}","${c.gender || ''}",${c.orderCount},${c.totalSpent}`)
                .join('\n');
            return headers + rows;
        }
        if (type === 'ORDER') {
            const headers = 'OrderId,OrderNumber,GrandTotal,Status,CreatedAt,ItemsCount\n';
            const rows = (data.orders || [])
                .map((o) => `"${o.id}","${o.orderNumber}",${o.grandTotal},"${o.status}","${o.createdAt.toISOString ? o.createdAt.toISOString() : o.createdAt}",${o.items?.length || 0}`)
                .join('\n');
            return headers + rows;
        }
        if ([
            'PRODUCTS',
            'COUPONS',
            'RETURNS',
            'PAYMENTS',
            'TAX',
            'SHIPPING',
            'CATEGORIES',
            'BRANDS',
            'REVIEWS',
        ].includes(type)) {
            const items = data.items || [];
            if (!items.length)
                return 'No data';
            const keys = Object.keys(items[0]).filter((k) => k !== 'id' && typeof items[0][k] !== 'object');
            const headers = keys.map((k) => `"${k}"`).join(',') + '\n';
            const rows = items
                .map((item) => keys.map((k) => `"${item[k] ?? ''}"`).join(','))
                .join('\n');
            return headers + rows;
        }
        return 'No data';
    }
};
exports.ReportService = ReportService;
exports.ReportService = ReportService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Optional)()),
    __param(2, (0, bullmq_1.InjectQueue)('report-export')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService,
        bullmq_2.Queue])
], ReportService);
//# sourceMappingURL=report.service.js.map