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
exports.CancellationService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const order_workflow_service_1 = require("../order/order-workflow.service");
const cancellation_repository_1 = require("./cancellation.repository");
const prisma_service_1 = require("../../database/prisma.service");
let CancellationService = class CancellationService {
    cancelRepo;
    auditService;
    prisma;
    workflow;
    constructor(cancelRepo, auditService, prisma, workflow) {
        this.cancelRepo = cancelRepo;
        this.auditService = auditService;
        this.prisma = prisma;
        this.workflow = workflow;
    }
    toResponse(c) {
        return {
            id: c.id,
            orderId: c.orderId,
            reason: c.reason,
            status: c.status,
            refundStatus: c.refundStatus,
            adminNotes: c.adminNotes ?? undefined,
            createdAt: c.createdAt,
        };
    }
    async findByOrderId(orderId) {
        const cancel = await this.cancelRepo.findByOrderId(orderId);
        if (!cancel)
            throw new exceptions_1.BusinessException('Cancellation not found', 'CANCEL_001');
        return this.toResponse(cancel);
    }
    async create(userId, dto) {
        const order = await this.prisma.order.findUnique({
            where: { id: dto.orderId },
        });
        if (!order)
            throw new exceptions_1.BusinessException('Order not found', 'ORDER_001');
        if (!this.workflow.canCancel(order.status))
            throw new exceptions_1.BusinessException('Cannot cancel order in current status', 'CANCEL_002');
        const existing = await this.cancelRepo.findByOrderId(dto.orderId);
        if (existing)
            throw new exceptions_1.BusinessException('Cancellation already exists', 'CANCEL_003');
        const cancel = await this.cancelRepo.create({
            order: { connect: { id: dto.orderId } },
            reason: dto.reason,
            createdBy: userId,
        });
        await this.workflow.transition(dto.orderId, 'CANCELLED', userId, `Cancelled: ${dto.reason}`);
        await this.workflow.releaseInventory(dto.orderId, userId);
        await this.auditService.log({
            action: 'ORDER_CANCELLED',
            module: 'cancellations',
            resource: 'cancellation_request',
            resourceId: cancel.id,
            userId,
            newValue: { orderId: dto.orderId },
        });
        return this.toResponse(cancel);
    }
    async update(id, dto, userId) {
        const cancel = await this.prisma.cancellationRequest.findUnique({
            where: { id },
        });
        if (!cancel)
            throw new exceptions_1.BusinessException('Cancellation not found', 'CANCEL_001');
        const updated = await this.cancelRepo.update(id, {
            ...dto,
            updatedBy: userId,
        });
        return this.toResponse(updated);
    }
};
exports.CancellationService = CancellationService;
exports.CancellationService = CancellationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cancellation_repository_1.CancellationRepository,
        audit_service_1.AuditService,
        prisma_service_1.PrismaService,
        order_workflow_service_1.OrderWorkflowService])
], CancellationService);
//# sourceMappingURL=cancellation.service.js.map