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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagToolRegistry = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const search_service_1 = require("../search/search.service");
const products_service_1 = require("../products/products.service");
let RagToolRegistry = class RagToolRegistry {
    prisma;
    searchService;
    productsService;
    tools = new Map();
    constructor(prisma, searchService, productsService) {
        this.prisma = prisma;
        this.searchService = searchService;
        this.productsService = productsService;
        this.registerTools();
    }
    getTool(name) {
        return this.tools.get(name);
    }
    getAllTools() {
        return Array.from(this.tools.values());
    }
    register(tool) {
        this.tools.set(tool.name, tool);
    }
    registerTools() {
        this.register({
            name: 'PRODUCT_SEARCH',
            description: 'Search catalog products by keywords, categories, and price ranges.',
            execute: async (_ctx, input) => {
                const queryDto = {
                    q: input.query || '',
                    page: 1,
                    limit: input.limit || 5,
                };
                if (input.minPrice !== undefined)
                    queryDto.minPrice = input.minPrice;
                if (input.maxPrice !== undefined)
                    queryDto.maxPrice = input.maxPrice;
                const results = await this.searchService.search(queryDto);
                return {
                    products: results.data.map((p) => ({
                        id: p.id,
                        sku: p.sku,
                        name: p.name,
                        slug: p.slug,
                        price: Number(p.basePrice),
                        salePrice: p.salePrice ? Number(p.salePrice) : null,
                        imageUrl: p.images?.[0]?.url || null,
                        isFeatured: p.isFeatured,
                    })),
                    meta: results.meta,
                };
            },
        });
        this.register({
            name: 'PRODUCT_DETAILS',
            description: 'Fetch detailed specifications of a specific product by slug or SKU.',
            execute: async (_ctx, input) => {
                let product = null;
                if (input.slug) {
                    product = await this.prisma.product.findUnique({
                        where: { slug: input.slug, deletedAt: null },
                        include: {
                            media: true,
                            brand: true,
                            categories: { include: { category: true } },
                        },
                    });
                }
                else if (input.sku) {
                    product = await this.prisma.product.findUnique({
                        where: { sku: input.sku, deletedAt: null },
                        include: {
                            media: true,
                            brand: true,
                            categories: { include: { category: true } },
                        },
                    });
                }
                else if (input.id) {
                    product = await this.productsService.findById(input.id);
                }
                if (!product) {
                    return { error: 'Product not found' };
                }
                return {
                    id: product.id,
                    sku: product.sku,
                    barcode: product.barcode,
                    name: product.name,
                    slug: product.slug,
                    description: product.description,
                    price: Number(product.basePrice),
                    salePrice: product.salePrice ? Number(product.salePrice) : null,
                    brandName: product.brand?.name || null,
                    categoryName: product.categories?.[0]?.category?.name || null,
                    images: product.media?.map((img) => img.url) || [],
                };
            },
        });
        this.register({
            name: 'PRODUCT_AVAILABILITY',
            description: 'Check real-time stock levels and variant availability for a product.',
            execute: async (_ctx, input) => {
                const { productId } = input;
                if (!productId)
                    return { error: 'productId is required' };
                const inventory = await this.prisma.inventory.findMany({
                    where: {
                        variant: {
                            productId,
                        },
                    },
                    include: {
                        variant: {
                            include: {
                                attributeValues: {
                                    include: {
                                        attribute: true,
                                        option: true,
                                    },
                                },
                            },
                        },
                    },
                });
                return inventory.map((inv) => ({
                    variantId: inv.variantId,
                    sku: inv.variant.sku,
                    attributes: inv.variant.attributeValues.map((av) => ({
                        name: av.attribute.name,
                        value: av.value || av.option?.value || '',
                    })),
                    availableQuantity: inv.availableQuantity - inv.reservedQuantity,
                    status: inv.availableQuantity > inv.reservedQuantity
                        ? 'IN_STOCK'
                        : 'OUT_OF_STOCK',
                }));
            },
        });
        this.register({
            name: 'ORDER_STATUS',
            description: 'Check active order details and order lifecycle status.',
            execute: async (ctx, input) => {
                const { orderNumber } = input;
                if (!orderNumber)
                    return { error: 'orderNumber is required' };
                if (!ctx.userId && !ctx.isAdmin) {
                    throw new common_1.UnauthorizedException('Please log in to view order details.');
                }
                const order = await this.prisma.order.findUnique({
                    where: { orderNumber },
                    include: {
                        customer: true,
                        items: true,
                    },
                });
                if (!order) {
                    return { error: 'Order not found' };
                }
                if (order.customer?.userId !== ctx.userId && !ctx.isAdmin) {
                    throw new common_1.UnauthorizedException('You are not authorized to view this order.');
                }
                return {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    totalAmount: Number(order.grandTotal),
                    currency: order.currency,
                    createdAt: order.createdAt,
                    items: order.items.map((item) => ({
                        productName: item.productName,
                        sku: item.sku,
                        quantity: item.quantity,
                        price: Number(item.price),
                    })),
                };
            },
        });
        this.register({
            name: 'ORDER_TRACKING',
            description: 'Fetch shipment tracking updates and order status timelines.',
            execute: async (ctx, input) => {
                const { orderNumber } = input;
                if (!orderNumber)
                    return { error: 'orderNumber is required' };
                if (!ctx.userId && !ctx.isAdmin) {
                    throw new common_1.UnauthorizedException('Please log in to track shipments.');
                }
                const order = await this.prisma.order.findUnique({
                    where: { orderNumber },
                    include: {
                        customer: true,
                        timeline: { orderBy: { createdAt: 'desc' } },
                    },
                });
                if (!order) {
                    return { error: 'Order not found' };
                }
                if (order.customer?.userId !== ctx.userId && !ctx.isAdmin) {
                    throw new common_1.UnauthorizedException('You are not authorized to track this shipment.');
                }
                return {
                    orderNumber: order.orderNumber,
                    currentStatus: order.status,
                    timeline: order.timeline.map((tl) => ({
                        status: tl.status,
                        message: tl.message,
                        timestamp: tl.createdAt,
                    })),
                };
            },
        });
        this.register({
            name: 'RETURN_STATUS',
            description: 'Get processing update status of a return request.',
            execute: async (ctx, input) => {
                const { returnNumber, orderNumber } = input;
                if (!ctx.userId && !ctx.isAdmin) {
                    throw new common_1.UnauthorizedException('Please log in to check return statuses.');
                }
                const where = {};
                if (returnNumber)
                    where.returnNumber = returnNumber;
                if (orderNumber)
                    where.order = { orderNumber };
                const returns = await this.prisma.returnRequest.findMany({
                    where,
                    include: {
                        order: {
                            include: { customer: true },
                        },
                        items: true,
                    },
                });
                if (returns.length === 0) {
                    return { error: 'No return request found' };
                }
                const request = returns[0];
                if (request.order.customer?.userId !== ctx.userId && !ctx.isAdmin) {
                    throw new common_1.UnauthorizedException('Access denied for this return record.');
                }
                return {
                    id: request.id,
                    returnNumber: request.returnNumber,
                    status: request.status,
                    reason: request.reason,
                    createdAt: request.createdAt,
                    items: request.items.map((item) => ({
                        productName: item.productName,
                        quantity: item.quantity,
                    })),
                };
            },
        });
        this.register({
            name: 'REFUND_STATUS',
            description: 'Retrieve Razorpay transaction refund progress details.',
            execute: async (ctx, input) => {
                const { refundNumber, orderNumber } = input;
                if (!ctx.userId && !ctx.isAdmin) {
                    throw new common_1.UnauthorizedException('Please log in to inspect refund status.');
                }
                const where = {};
                if (refundNumber)
                    where.refundNumber = refundNumber;
                if (orderNumber)
                    where.order = { orderNumber };
                const refunds = await this.prisma.refund.findMany({
                    where,
                    include: {
                        order: {
                            include: { customer: true },
                        },
                    },
                });
                if (refunds.length === 0) {
                    return { error: 'No refund records found' };
                }
                const refund = refunds[0];
                if (refund.order.customer?.userId !== ctx.userId && !ctx.isAdmin) {
                    throw new common_1.UnauthorizedException('Access denied for this refund record.');
                }
                return {
                    id: refund.id,
                    refundNumber: refund.refundNumber,
                    status: refund.status,
                    amount: Number(refund.amount),
                    gatewayReference: refund.transactionId || null,
                    processedAt: refund.updatedAt || null,
                    createdAt: refund.createdAt,
                };
            },
        });
    }
};
exports.RagToolRegistry = RagToolRegistry;
exports.RagToolRegistry = RagToolRegistry = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        search_service_1.SearchService,
        products_service_1.ProductsService])
], RagToolRegistry);
//# sourceMappingURL=rag-tool.registry.js.map