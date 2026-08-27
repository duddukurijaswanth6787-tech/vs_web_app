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
exports.ReturnRequestService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const notification_service_1 = require("../notification/notification.service");
const order_workflow_service_1 = require("../order/order-workflow.service");
const return_request_repository_1 = require("./return-request.repository");
const prisma_service_1 = require("../../database/prisma.service");
let ReturnRequestService = class ReturnRequestService {
    returnRepo;
    auditService;
    notificationService;
    prisma;
    workflow;
    constructor(returnRepo, auditService, notificationService, prisma, workflow) {
        this.returnRepo = returnRepo;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.prisma = prisma;
        this.workflow = workflow;
    }
    async getSetting(key, defaultValue) {
        const setting = await this.prisma.appSetting.findUnique({ where: { key } });
        return setting?.value ?? defaultValue;
    }
    toResponse(r) {
        return {
            id: r.id,
            orderId: r.orderId,
            returnNumber: r.returnNumber,
            reason: r.reason,
            status: r.status,
            refundPreference: r.refundPreference ?? undefined,
            adminNotes: r.adminNotes ?? undefined,
            items: r.items?.map((i) => ({
                id: i.id,
                orderItemId: i.orderItemId,
                quantity: i.quantity,
                reason: i.reason ?? undefined,
                images: i.images?.map((img) => ({
                    id: img.id,
                    url: img.url,
                    displayOrder: img.displayOrder,
                })),
            })),
            createdAt: r.createdAt,
        };
    }
    async findAll(query, customerId) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.returnRepo.findAll({
            status: query.status,
            orderId: query.orderId,
            customerId,
            page,
            limit,
        });
        return {
            data: result.data.map((r) => this.toResponse(r)),
            meta: result.meta,
        };
    }
    async findById(id) {
        const ret = await this.returnRepo.findById(id);
        if (!ret)
            throw new exceptions_1.BusinessException('Return request not found', 'RETURN_001');
        return this.toResponse(ret);
    }
    async create(userId, dto) {
        const order = await this.prisma.order.findUnique({
            where: { id: dto.orderId },
            include: { items: true },
        });
        if (!order)
            throw new exceptions_1.BusinessException('Order not found', 'ORDER_001');
        const customerProfile = await this.prisma.customerProfile.findUnique({
            where: { userId },
        });
        if (!customerProfile || order.customerId !== customerProfile.id) {
            throw new exceptions_1.BusinessException('Order not found', 'ORDER_001');
        }
        if (!this.workflow.canReturn(order.status))
            throw new exceptions_1.BusinessException('Order must be delivered before requesting a return', 'RETURN_002');
        const deliveredEntry = await this.prisma.orderTimeline.findFirst({
            where: { orderId: dto.orderId, status: 'DELIVERED' },
            orderBy: { createdAt: 'desc' },
        });
        if (deliveredEntry) {
            const returnWindowDays = Number(await this.getSetting('return_window_days', '30'));
            const deadline = new Date(deliveredEntry.createdAt);
            deadline.setDate(deadline.getDate() + returnWindowDays);
            if (new Date() > deadline)
                throw new exceptions_1.BusinessException('Return window has expired', 'RETURN_006');
        }
        const itemsToProcess = dto.items?.length
            ? dto.items
            : order.items.map((i) => ({ orderItemId: i.id, quantity: i.quantity, reason: dto.reason }));
        const orderItemMap = new Map(order.items.map((i) => [i.id, i]));
        for (const item of itemsToProcess) {
            const orderItem = orderItemMap.get(item.orderItemId);
            if (!orderItem)
                throw new exceptions_1.BusinessException(`Order item ${item.orderItemId} not found`, 'RETURN_003');
            if (item.quantity > orderItem.quantity)
                throw new exceptions_1.BusinessException('Return quantity exceeds order item quantity', 'RETURN_004');
        }
        const returnNumber = await this.returnRepo.generateReturnNumber();
        const ret = await this.returnRepo.create({
            order: { connect: { id: dto.orderId } },
            returnNumber,
            reason: dto.reason,
            refundPreference: dto.refundPreference,
            createdBy: userId,
            items: {
                create: itemsToProcess.map((i) => ({
                    orderItem: { connect: { id: i.orderItemId } },
                    quantity: i.quantity,
                    reason: i.reason,
                })),
            },
        });
        const images = dto.images;
        if (images?.length) {
            for (const item of ret.items) {
                for (let i = 0; i < images.length; i++) {
                    await this.prisma.returnItemImage.create({
                        data: { returnItemId: item.id, url: images[i], displayOrder: i },
                    });
                }
            }
        }
        await this.workflow.transition(dto.orderId, 'RETURN_REQUESTED', userId, `Return requested: ${returnNumber}`);
        await this.auditService.log({
            action: 'RETURN_REQUESTED',
            module: 'returns',
            resource: 'return_request',
            resourceId: ret.id,
            userId,
            newValue: { orderId: dto.orderId, returnNumber },
        });
        await this.notificationService.create({
            userId,
            type: 'ORDER_RETURNED',
            title: 'Return Requested',
            message: `Return ${returnNumber} has been submitted`,
            data: { returnId: ret.id, returnNumber },
        });
        return this.toResponse(ret);
    }
    async updateStatus(id, dto, userId) {
        const ret = await this.returnRepo.findById(id);
        if (!ret)
            throw new exceptions_1.BusinessException('Return request not found', 'RETURN_001');
        const validTransitions = {
            REQUESTED: ['APPROVED', 'REJECTED'],
            APPROVED: ['PICKUP_SCHEDULED', 'CANCELLED'],
            PICKUP_SCHEDULED: ['PICKED_UP', 'CANCELLED'],
            PICKED_UP: ['WAREHOUSE_RECEIVED'],
            WAREHOUSE_RECEIVED: ['INSPECTION'],
            INSPECTION: ['REFUND_INITIATED', 'REJECTED'],
            REFUND_INITIATED: ['REFUND_COMPLETED'],
        };
        const allowed = validTransitions[ret.status] ?? [];
        if (!allowed.includes(dto.status))
            throw new exceptions_1.BusinessException(`Cannot transition from ${ret.status} to ${dto.status}`, 'RETURN_005');
        const updated = await this.returnRepo.update(id, {
            status: dto.status,
            adminNotes: dto.adminNotes,
            updatedBy: userId,
        });
        if (dto.status === 'REFUND_COMPLETED') {
            await this.workflow.restoreInventory(ret.orderId, userId);
            await this.workflow.transition(ret.orderId, 'RETURN_COMPLETED', userId, 'Return completed');
        }
        else if (dto.status === 'APPROVED') {
            await this.workflow.transition(ret.orderId, 'RETURN_APPROVED', userId, 'Return approved');
        }
        await this.prisma.orderTimeline.create({
            data: {
                orderId: ret.orderId,
                status: `RETURN_${dto.status}`,
                message: `Return ${ret.returnNumber}: ${dto.status}`,
                createdBy: userId,
            },
        });
        const notifMap = {
            APPROVED: 'Return Approved',
            REJECTED: 'Return Rejected',
            PICKUP_SCHEDULED: 'Pickup Scheduled',
            REFUND_INITIATED: 'Refund Initiated',
            REFUND_COMPLETED: 'Refund Completed',
        };
        const notifTitle = notifMap[dto.status];
        if (notifTitle) {
            await this.notificationService.create({
                userId: ret.createdBy || userId,
                type: 'ORDER_RETURNED',
                title: notifTitle,
                message: `Return ${ret.returnNumber}: ${notifTitle.toLowerCase()}`,
                data: {
                    returnId: id,
                    returnNumber: ret.returnNumber,
                    status: dto.status,
                },
            });
        }
        const actionMap = {
            APPROVED: 'RETURN_APPROVED',
            REJECTED: 'RETURN_REJECTED',
            REFUND_COMPLETED: 'RETURN_COMPLETED',
            REFUND_INITIATED: 'REFUND_INITIATED',
        };
        await this.auditService.log({
            action: actionMap[dto.status] ?? 'RETURN_STATUS_UPDATED',
            module: 'returns',
            resource: 'return_request',
            resourceId: id,
            userId,
            oldValue: { status: ret.status },
            newValue: { status: dto.status },
        });
        return this.toResponse(updated);
    }
};
exports.ReturnRequestService = ReturnRequestService;
exports.ReturnRequestService = ReturnRequestService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [return_request_repository_1.ReturnRequestRepository,
        audit_service_1.AuditService,
        notification_service_1.NotificationService,
        prisma_service_1.PrismaService,
        order_workflow_service_1.OrderWorkflowService])
], ReturnRequestService);
//# sourceMappingURL=return-request.service.js.map