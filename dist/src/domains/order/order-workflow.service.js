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
exports.OrderWorkflowService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const notification_service_1 = require("../notification/notification.service");
const email_service_1 = require("../email/email.service");
const otp_gateway_service_1 = require("../otp-gateway/otp-gateway.service");
const stock_status_util_1 = require("../../shared/inventory/stock-status.util");
const prisma_service_1 = require("../../database/prisma.service");
const ORDER_TRANSITIONS = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['PACKING', 'CANCELLED'],
    PACKING: ['READY_TO_SHIP'],
    READY_TO_SHIP: ['SHIPPED'],
    SHIPPED: ['OUT_FOR_DELIVERY'],
    OUT_FOR_DELIVERY: ['DELIVERED'],
    DELIVERED: ['RETURN_REQUESTED'],
    RETURN_REQUESTED: ['RETURN_APPROVED', 'RETURN_REJECTED'],
    RETURN_APPROVED: ['RETURN_COMPLETED'],
    RETURN_REJECTED: [],
    RETURN_COMPLETED: [],
    CANCELLED: [],
};
const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING'];
const RETURNABLE_STATUSES = ['DELIVERED'];
let OrderWorkflowService = class OrderWorkflowService {
    prisma;
    auditService;
    notificationService;
    emailService;
    otpGatewayService;
    constructor(prisma, auditService, notificationService, emailService, otpGatewayService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.otpGatewayService = otpGatewayService;
    }
    async notifyOrderConfirmed(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                addresses: true,
                customer: { include: { user: true } },
            },
        });
        if (!order)
            return;
        const email = order.customer?.user?.email;
        if (email) {
            await this.emailService.sendOrderConfirmationEmail({
                to: email,
                userId: order.customer.userId,
                orderNumber: order.orderNumber,
                items: order.items.map((i) => ({
                    productName: i.productName,
                    quantity: i.quantity,
                    unitPrice: Number(i.unitPrice),
                })),
                subtotal: Number(order.subtotal),
                discountTotal: Number(order.discountTotal),
                taxTotal: Number(order.taxTotal),
                shippingCharge: Number(order.shippingCharge),
                grandTotal: Number(order.grandTotal),
            });
        }
        const phone = order.addresses?.[0]?.phone;
        if (phone) {
            await this.otpGatewayService.sendOrderConfirmedSms({
                phone,
                orderNumber: order.orderNumber,
                userId: order.customer?.userId,
            });
        }
    }
    validateTransition(currentStatus, nextStatus) {
        const allowed = ORDER_TRANSITIONS[currentStatus] ?? [];
        if (!allowed.includes(nextStatus)) {
            throw new exceptions_1.BusinessException(`Cannot transition from ${currentStatus} to ${nextStatus}`, 'ORDER_002');
        }
    }
    canCancel(status) {
        return CANCELLABLE_STATUSES.includes(status);
    }
    canReturn(status) {
        return RETURNABLE_STATUSES.includes(status);
    }
    async transition(orderId, nextStatus, userId, message) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!order)
            throw new exceptions_1.BusinessException('Order not found', 'ORDER_001');
        this.validateTransition(order.status, nextStatus);
        const [updated] = await this.prisma.$transaction([
            this.prisma.order.update({
                where: { id: orderId },
                data: { status: nextStatus, updatedBy: userId },
            }),
            this.prisma.orderTimeline.create({
                data: {
                    orderId,
                    status: nextStatus,
                    message: message ?? `Status changed to ${nextStatus}`,
                    createdBy: userId,
                },
            }),
        ]);
        await this.auditService.log({
            action: `ORDER_${nextStatus}`,
            module: 'orders',
            resource: 'order',
            resourceId: orderId,
            userId,
            oldValue: { status: order.status },
            newValue: { status: nextStatus },
        });
        const notifTypes = {
            CONFIRMED: { type: 'ORDER_CREATED', title: 'New Order Confirmed' },
            CANCELLED: { type: 'ORDER_CANCELLED', title: 'Order Cancelled' },
            DELIVERED: { type: 'ORDER_DELIVERED', title: 'Order Delivered' },
            RETURN_COMPLETED: { type: 'ORDER_RETURNED', title: 'Return Completed' },
        };
        const notif = notifTypes[nextStatus];
        if (notif) {
            await this.notificationService.create({
                userId: order.customerId,
                type: notif.type,
                title: notif.title,
                message: nextStatus === 'DELIVERED'
                    ? `Your order #${order.orderNumber} has been delivered! Share your feedback & earn 50 reward points.`
                    : `Order #${order.orderNumber} ${notif.title.toLowerCase()}`,
                data: { orderId, orderNumber: order.orderNumber, status: nextStatus },
            });
        }
        return updated;
    }
    async logMovement(tx, row, params) {
        await tx.inventoryMovement.create({
            data: {
                inventory: { connect: { id: row.id } },
                variantId: params.variantId,
                movementType: params.movementType,
                quantity: params.quantity,
                previousQuantity: params.previousAvailable,
                newQuantity: row.availableQuantity,
                referenceType: params.referenceType,
                referenceId: params.referenceId,
                reason: params.reason,
                performedBy: params.performedBy,
            },
        });
        const status = (0, stock_status_util_1.calculateStockStatus)(row);
        await tx.inventory.update({ where: { id: row.id }, data: { stockStatus: status } });
    }
    async reserveInventory(orderId, userId = 'SYSTEM') {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order)
            throw new exceptions_1.BusinessException('Order not found', 'ORDER_001');
        await this.prisma.$transaction(async (tx) => {
            const shortages = [];
            for (const item of order.items) {
                if (!item.variantId)
                    continue;
                const rows = await tx.$queryRaw `
          UPDATE "inventory"
          SET "reservedQuantity" = "reservedQuantity" + ${item.quantity}
          WHERE "variantId" = ${item.variantId}
            AND ("availableQuantity" - "reservedQuantity" >= ${item.quantity} OR "allowBackorder" = true)
          RETURNING id, "availableQuantity", "reservedQuantity", "minimumStock", "reorderLevel", "allowBackorder"
        `;
                if (rows.length === 0) {
                    const current = await tx.inventory.findUnique({
                        where: { variantId: item.variantId },
                    });
                    if (current) {
                        shortages.push({
                            variantId: item.variantId,
                            productName: item.productName,
                            variantTitle: item.variantTitle,
                            requested: item.quantity,
                            available: current.availableQuantity - current.reservedQuantity,
                        });
                    }
                    continue;
                }
                await this.logMovement(tx, rows[0], {
                    variantId: item.variantId,
                    movementType: 'RESERVED',
                    quantity: item.quantity,
                    previousAvailable: rows[0].reservedQuantity - item.quantity,
                    referenceType: 'ORDER',
                    referenceId: orderId,
                    reason: `Order ${order.orderNumber} reserved`,
                    performedBy: userId,
                });
            }
            if (shortages.length > 0) {
                throw new exceptions_1.BusinessException(`Insufficient stock for ${shortages[0].productName}`, 'ORDER_003', { shortages });
            }
        });
    }
    async restockReturnedItems(tx, params) {
        for (const item of params.items) {
            if (!item.variantId || item.quantity <= 0)
                continue;
            const rows = await tx.$queryRaw `
        UPDATE "inventory"
        SET "availableQuantity" = "availableQuantity" + ${item.quantity}
        WHERE "variantId" = ${item.variantId}
        RETURNING id, "availableQuantity", "reservedQuantity", "minimumStock", "reorderLevel", "allowBackorder"
      `;
            if (rows.length === 0)
                continue;
            await this.logMovement(tx, rows[0], {
                variantId: item.variantId,
                movementType: 'RETURN',
                quantity: item.quantity,
                previousAvailable: rows[0].availableQuantity - item.quantity,
                referenceType: 'ORDER',
                referenceId: params.orderId,
                reason: params.reason || `Order ${params.orderNumber} items returned`,
                performedBy: params.userId || 'SYSTEM',
            });
        }
    }
    async releaseInventory(orderId, userId = 'SYSTEM') {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order)
            return;
        await this.prisma.$transaction(async (tx) => {
            for (const item of order.items) {
                if (!item.variantId)
                    continue;
                const rows = await tx.$queryRaw `
          UPDATE "inventory"
          SET "reservedQuantity" = GREATEST("reservedQuantity" - ${item.quantity}, 0)
          WHERE "variantId" = ${item.variantId}
          RETURNING id, "availableQuantity", "reservedQuantity", "minimumStock", "reorderLevel", "allowBackorder"
        `;
                if (rows.length === 0)
                    continue;
                await this.logMovement(tx, rows[0], {
                    variantId: item.variantId,
                    movementType: 'UNRESERVED',
                    quantity: item.quantity,
                    previousAvailable: rows[0].reservedQuantity + item.quantity,
                    referenceType: 'ORDER',
                    referenceId: orderId,
                    reason: `Order ${order.orderNumber} reservation released`,
                    performedBy: userId,
                });
            }
        });
    }
    async deductInventory(orderId, userId = 'SYSTEM') {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order)
            return;
        await this.prisma.$transaction(async (tx) => {
            const shortages = [];
            for (const item of order.items) {
                if (!item.variantId)
                    continue;
                const rows = await tx.$queryRaw `
          UPDATE "inventory"
          SET "availableQuantity" = "availableQuantity" - ${item.quantity},
              "reservedQuantity" = GREATEST("reservedQuantity" - ${item.quantity}, 0)
          WHERE "variantId" = ${item.variantId}
            AND ("availableQuantity" >= ${item.quantity} OR "allowBackorder" = true)
          RETURNING id, "availableQuantity", "reservedQuantity", "minimumStock", "reorderLevel", "allowBackorder"
        `;
                if (rows.length === 0) {
                    const current = await tx.inventory.findUnique({
                        where: { variantId: item.variantId },
                    });
                    if (current) {
                        shortages.push({
                            variantId: item.variantId,
                            productName: item.productName,
                            variantTitle: item.variantTitle,
                            requested: item.quantity,
                            available: current.availableQuantity,
                        });
                    }
                    continue;
                }
                await this.logMovement(tx, rows[0], {
                    variantId: item.variantId,
                    movementType: 'SALE',
                    quantity: item.quantity,
                    previousAvailable: rows[0].availableQuantity + item.quantity,
                    referenceType: 'ORDER',
                    referenceId: orderId,
                    reason: `Order ${order.orderNumber} sold`,
                    performedBy: userId,
                });
            }
            if (shortages.length > 0) {
                throw new exceptions_1.BusinessException('Insufficient stock to complete this order', 'ORDER_STOCK_CONFLICT', { shortages });
            }
        });
    }
    async restoreInventory(orderId, userId = 'SYSTEM') {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order)
            return;
        await this.prisma.$transaction(async (tx) => {
            for (const item of order.items) {
                if (!item.variantId)
                    continue;
                const rows = await tx.$queryRaw `
          UPDATE "inventory"
          SET "availableQuantity" = "availableQuantity" + ${item.quantity}
          WHERE "variantId" = ${item.variantId}
          RETURNING id, "availableQuantity", "reservedQuantity", "minimumStock", "reorderLevel", "allowBackorder"
        `;
                if (rows.length === 0)
                    continue;
                await this.logMovement(tx, rows[0], {
                    variantId: item.variantId,
                    movementType: 'RESTORE',
                    quantity: item.quantity,
                    previousAvailable: rows[0].availableQuantity - item.quantity,
                    referenceType: 'ORDER',
                    referenceId: orderId,
                    reason: `Order ${order.orderNumber} cancelled/returned -- stock restored`,
                    performedBy: userId,
                });
            }
        });
    }
    async generateOrderNumber() {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `ORD-${dateStr}-`;
        const lastOrder = await this.prisma.order.findFirst({
            where: { orderNumber: { startsWith: prefix } },
            orderBy: { orderNumber: 'desc' },
            select: { orderNumber: true },
        });
        let seq = 1;
        if (lastOrder) {
            const lastSeq = parseInt(lastOrder.orderNumber.slice(-6), 10);
            if (!isNaN(lastSeq))
                seq = lastSeq + 1;
        }
        return `${prefix}${String(seq).padStart(6, '0')}`;
    }
};
exports.OrderWorkflowService = OrderWorkflowService;
exports.OrderWorkflowService = OrderWorkflowService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        notification_service_1.NotificationService,
        email_service_1.EmailService,
        otp_gateway_service_1.OtpGatewayService])
], OrderWorkflowService);
//# sourceMappingURL=order-workflow.service.js.map