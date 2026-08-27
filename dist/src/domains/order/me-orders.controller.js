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
exports.MeOrdersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const order_service_1 = require("./order.service");
const order_types_1 = require("./order.types");
const cancellation_service_1 = require("../cancellation/cancellation.service");
const invoice_service_1 = require("../invoice/invoice.service");
const audit_service_1 = require("../audit/audit.service");
const prisma_service_1 = require("../../database/prisma.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let MeOrdersController = class MeOrdersController {
    orderService;
    cancellationService;
    invoiceService;
    prisma;
    auditService;
    constructor(orderService, cancellationService, invoiceService, prisma, auditService) {
        this.orderService = orderService;
        this.cancellationService = cancellationService;
        this.invoiceService = invoiceService;
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async resolveCustomerId(userId) {
        const profile = await this.prisma.customerProfile.findUnique({
            where: { userId },
        });
        return profile?.id ?? null;
    }
    async findAll(query, user) {
        const customerId = await this.resolveCustomerId(user.sub);
        if (!customerId)
            return response_builder_1.ResponseBuilder.success({ data: [], meta: {} });
        return response_builder_1.ResponseBuilder.success(await this.orderService.findByCustomerId(customerId, query));
    }
    async findByOrderNumber(orderNumber, user) {
        const order = await this.orderService.findByOrderNumber(orderNumber);
        const customerId = await this.resolveCustomerId(user.sub);
        if (order.customerId !== customerId)
            return response_builder_1.ResponseBuilder.success(null, 'Order not found');
        return response_builder_1.ResponseBuilder.success(order);
    }
    async tracking(orderNumber, user) {
        const order = await this.orderService.findByOrderNumber(orderNumber);
        const customerId = await this.resolveCustomerId(user.sub);
        if (order.customerId !== customerId)
            return response_builder_1.ResponseBuilder.success(null, 'Order not found');
        await this.auditService.log({
            action: 'TRACKING_VIEWED',
            module: 'orders',
            resource: 'order',
            resourceId: order.id,
            userId: user.sub,
        });
        const timeline = (order.timeline || []).map((t) => ({
            status: t.status,
            time: t.createdAt ? new Date(t.createdAt).toISOString() : '',
        }));
        return response_builder_1.ResponseBuilder.success({
            orderNumber: order.orderNumber,
            status: order.status,
            carrier: null,
            trackingNumber: null,
            trackingUrl: '',
            estimatedDelivery: '',
            currentStatus: order.status,
            timeline,
        });
    }
    async invoice(orderNumber, user) {
        const order = await this.orderService.findByOrderNumber(orderNumber);
        const customerId = await this.resolveCustomerId(user.sub);
        if (order.customerId !== customerId)
            return response_builder_1.ResponseBuilder.success(null, 'Order not found');
        const invoices = await this.invoiceService.findByOrderId(order.id);
        if (invoices.length > 0) {
            const inv = invoices[0];
            await this.auditService.log({
                action: 'INVOICE_VIEWED',
                module: 'orders',
                resource: 'invoice',
                resourceId: inv.id,
                userId: user.sub,
            });
            return response_builder_1.ResponseBuilder.success({
                downloadUrl: null,
                fileName: null,
                mimeType: null,
                invoice: inv,
            });
        }
        const [userRec, payments] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: user.sub },
                select: { firstName: true, lastName: true, email: true, phone: true },
            }),
            this.prisma.payment.findMany({
                where: { orderId: order.id },
                orderBy: { createdAt: 'desc' },
                take: 1,
                select: { method: true, status: true },
            }),
        ]);
        const billing = (order.addresses || []).find((a) => a.addressType === 'BILLING');
        const shipping = (order.addresses || []).find((a) => a.addressType === 'SHIPPING');
        const payment = payments[0];
        await this.auditService.log({
            action: 'INVOICE_VIEWED',
            module: 'orders',
            resource: 'order',
            resourceId: order.id,
            userId: user.sub,
        });
        return response_builder_1.ResponseBuilder.success({
            downloadUrl: null,
            fileName: null,
            mimeType: null,
            invoice: {
                invoiceNumber: '',
                invoiceDate: order.createdAt
                    ? new Date(order.createdAt).toISOString()
                    : '',
                orderNumber: order.orderNumber,
                customer: {
                    name: userRec
                        ? `${userRec.firstName}${userRec.lastName ? ' ' + userRec.lastName : ''}`
                        : '',
                    email: userRec?.email ?? '',
                    phone: userRec?.phone ?? '',
                },
                billingAddress: billing
                    ? {
                        fullName: billing.fullName,
                        phone: billing.phone,
                        addressLine1: billing.addressLine1,
                        addressLine2: billing.addressLine2 ?? '',
                        city: billing.city,
                        state: billing.state,
                        country: billing.country,
                        postalCode: billing.postalCode,
                    }
                    : null,
                shippingAddress: shipping
                    ? {
                        fullName: shipping.fullName,
                        phone: shipping.phone,
                        addressLine1: shipping.addressLine1,
                        addressLine2: shipping.addressLine2 ?? '',
                        city: shipping.city,
                        state: shipping.state,
                        country: shipping.country,
                        postalCode: shipping.postalCode,
                    }
                    : null,
                items: (order.items || []).map((i) => ({
                    productName: i.productName,
                    sku: i.sku,
                    quantity: i.quantity,
                    unitPrice: i.unitPrice,
                    totalPrice: i.totalPrice,
                    taxAmount: i.taxAmount,
                    discountAmount: i.discountAmount,
                })),
                subtotal: order.subtotal,
                tax: order.taxTotal ?? 0,
                shipping: order.shippingCharge ?? 0,
                discount: order.discountTotal ?? 0,
                wallet: 0,
                total: order.grandTotal,
                paymentMethod: payment?.method ?? '',
                paymentStatus: payment?.status ?? '',
                currency: order.currency ?? 'INR',
            },
        });
    }
    async cancel(orderNumber, body, user) {
        const order = await this.orderService.findByOrderNumber(orderNumber);
        const customerId = await this.resolveCustomerId(user.sub);
        if (order.customerId !== customerId)
            return response_builder_1.ResponseBuilder.success(null, 'Order not found');
        return response_builder_1.ResponseBuilder.success(await this.cancellationService.create(user.sub, {
            orderId: order.id,
            reason: body.reason,
        }), 'Cancellation requested');
    }
};
exports.MeOrdersController = MeOrdersController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current customer orders' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [order_types_1.OrderQueryDto, Object]),
    __metadata("design:returntype", Promise)
], MeOrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':orderNumber'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current customer order by order number' }),
    __param(0, (0, common_1.Param)('orderNumber')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MeOrdersController.prototype, "findByOrderNumber", null);
__decorate([
    (0, common_1.Get)(':orderNumber/tracking'),
    (0, swagger_1.ApiOperation)({ summary: 'Get order tracking information' }),
    __param(0, (0, common_1.Param)('orderNumber')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MeOrdersController.prototype, "tracking", null);
__decorate([
    (0, common_1.Get)(':orderNumber/invoice'),
    (0, swagger_1.ApiOperation)({ summary: 'Get order invoice' }),
    __param(0, (0, common_1.Param)('orderNumber')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MeOrdersController.prototype, "invoice", null);
__decorate([
    (0, common_1.Post)(':orderNumber/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel current customer order' }),
    __param(0, (0, common_1.Param)('orderNumber')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MeOrdersController.prototype, "cancel", null);
exports.MeOrdersController = MeOrdersController = __decorate([
    (0, swagger_1.ApiTags)('Me / Orders'),
    (0, common_1.Controller)('me/orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [order_service_1.OrderService,
        cancellation_service_1.CancellationService,
        invoice_service_1.InvoiceService,
        prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], MeOrdersController);
//# sourceMappingURL=me-orders.controller.js.map