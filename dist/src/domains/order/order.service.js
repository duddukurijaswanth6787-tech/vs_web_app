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
exports.OrderService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const order_repository_1 = require("./order.repository");
const order_workflow_service_1 = require("./order-workflow.service");
let OrderService = class OrderService {
    orderRepository;
    workflow;
    constructor(orderRepository, workflow) {
        this.orderRepository = orderRepository;
        this.workflow = workflow;
    }
    toResponse(o, includeRelations = false, includeAdminFields = false) {
        return {
            id: o.id,
            orderNumber: o.orderNumber,
            customerId: o.customerId,
            status: o.status,
            subtotal: Number(o.subtotal),
            discountTotal: Number(o.discountTotal),
            taxTotal: Number(o.taxTotal),
            shippingCharge: Number(o.shippingCharge),
            grandTotal: Number(o.grandTotal),
            currency: o.currency,
            notes: o.notes ?? undefined,
            ...(includeAdminFields
                ? {
                    channel: o.channel,
                    paymentMethod: o.paymentMethod ?? undefined,
                    terminalId: o.terminalId ?? undefined,
                }
                : {}),
            items: includeRelations && o.items
                ? o.items.map((i) => ({
                    id: i.id,
                    productId: i.productId,
                    productName: i.productName,
                    variantId: i.variantId ?? undefined,
                    variantTitle: i.variantTitle ?? undefined,
                    sku: i.sku,
                    quantity: i.quantity,
                    unitPrice: Number(i.unitPrice),
                    totalPrice: Number(i.totalPrice),
                    taxAmount: Number(i.taxAmount),
                    discountAmount: Number(i.discountAmount),
                }))
                : undefined,
            addresses: includeRelations && o.addresses
                ? o.addresses.map((a) => ({
                    id: a.id,
                    addressType: a.addressType,
                    fullName: a.fullName,
                    phone: a.phone,
                    addressLine1: a.addressLine1,
                    addressLine2: a.addressLine2 ?? undefined,
                    city: a.city,
                    state: a.state,
                    country: a.country,
                    postalCode: a.postalCode,
                    landmark: a.landmark ?? undefined,
                }))
                : undefined,
            timeline: includeRelations && o.timeline
                ? o.timeline.map((t) => ({
                    id: t.id,
                    status: t.status,
                    message: t.message ?? undefined,
                    createdBy: t.createdBy ?? undefined,
                    createdAt: t.createdAt,
                }))
                : undefined,
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
        };
    }
    async findAll(query, includeAdminFields = false) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.orderRepository.findAll({
            search: query.search,
            status: query.status,
            customerId: query.customerId,
            startDate: query.startDate,
            endDate: query.endDate,
            page,
            limit,
            sortBy: query.sortBy ?? 'createdAt',
            sortOrder: query.sortOrder ?? 'desc',
        });
        return {
            data: result.data.map((o) => this.toResponse(o, false, includeAdminFields)),
            meta: result.meta,
        };
    }
    async findById(id, includeAdminFields = false) {
        const order = await this.orderRepository.findById(id);
        if (!order)
            throw new exceptions_1.BusinessException('Order not found', 'ORDER_001');
        return this.toResponse(order, true, includeAdminFields);
    }
    async findByOrderNumber(orderNumber) {
        const order = await this.orderRepository.findByOrderNumber(orderNumber);
        if (!order)
            throw new exceptions_1.BusinessException('Order not found', 'ORDER_001');
        return this.toResponse(order, true);
    }
    async findByCustomerId(customerId, query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.orderRepository.findByCustomerId(customerId, page, limit);
        return {
            data: result.data.map((o) => this.toResponse(o)),
            meta: result.meta,
        };
    }
    async updateStatus(id, status, userId, message) {
        const order = await this.orderRepository.findById(id);
        if (!order)
            throw new exceptions_1.BusinessException('Order not found', 'ORDER_001');
        await this.workflow.transition(id, status, userId, message);
        if (status === 'CONFIRMED') {
            try {
                await this.workflow.deductInventory(id, userId);
            }
            catch (err) {
                await this.workflow.transition(id, 'CANCELLED', userId, 'Auto-cancelled: insufficient stock at confirmation');
                throw err;
            }
        }
        return this.findById(id);
    }
};
exports.OrderService = OrderService;
exports.OrderService = OrderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [order_repository_1.OrderRepository,
        order_workflow_service_1.OrderWorkflowService])
], OrderService);
//# sourceMappingURL=order.service.js.map