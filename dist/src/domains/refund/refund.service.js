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
exports.RefundService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const payment_service_1 = require("../payment/payment.service");
const refund_repository_1 = require("./refund.repository");
const refund_types_1 = require("./refund.types");
const VALID_TRANSITIONS = {
    REQUESTED: [refund_types_1.RefundStatus.APPROVED, refund_types_1.RefundStatus.REJECTED],
    APPROVED: [refund_types_1.RefundStatus.COMPLETED],
};
let RefundService = class RefundService {
    refundRepository;
    auditService;
    paymentService;
    constructor(refundRepository, auditService, paymentService) {
        this.refundRepository = refundRepository;
        this.auditService = auditService;
        this.paymentService = paymentService;
    }
    toResponse(r) {
        return {
            id: r.id,
            paymentId: r.paymentId,
            orderId: r.orderId,
            refundNumber: r.refundNumber,
            amount: Number(r.amount),
            reason: r.reason,
            status: r.status,
            method: r.method ?? undefined,
            transactionId: r.transactionId ?? undefined,
            adminNotes: r.adminNotes ?? undefined,
            createdAt: r.createdAt,
        };
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.refundRepository.findAll({
            orderId: query.orderId,
            status: query.status,
            page,
            limit,
        });
        return {
            data: result.data.map((r) => this.toResponse(r)),
            meta: result.meta,
        };
    }
    async findById(id) {
        const refund = await this.refundRepository.findById(id);
        if (!refund)
            throw new exceptions_1.BusinessException('Refund not found', 'REFUND_001');
        return this.toResponse(refund);
    }
    async findByOrderId(orderId) {
        const refunds = await this.refundRepository.findByOrderId(orderId);
        return refunds.map((r) => this.toResponse(r));
    }
    async create(userId, dto) {
        const payment = await this.refundRepository.findPaymentById(dto.paymentId);
        if (!payment)
            throw new exceptions_1.BusinessException('Payment not found', 'REFUND_002');
        if (Number(payment.amount) < dto.amount) {
            throw new exceptions_1.BusinessException('Refund amount exceeds payment amount', 'REFUND_003');
        }
        const refundNumber = await this.refundRepository.generateRefundNumber();
        const refund = await this.refundRepository.create({
            payment: { connect: { id: dto.paymentId } },
            order: { connect: { id: dto.orderId } },
            refundNumber,
            amount: dto.amount,
            reason: dto.reason,
            method: dto.method,
            createdBy: userId,
        });
        await this.auditService.log({
            action: 'REFUND_CREATED',
            module: 'refund',
            resource: 'Refund',
            resourceId: refund.id,
            userId,
        });
        return this.toResponse(refund);
    }
    async updateStatus(id, dto, userId) {
        if (!dto.status)
            throw new exceptions_1.BusinessException('Status is required', 'REFUND_004');
        const refund = await this.refundRepository.findById(id);
        if (!refund)
            throw new exceptions_1.BusinessException('Refund not found', 'REFUND_001');
        const allowed = VALID_TRANSITIONS[refund.status];
        if (!allowed?.includes(dto.status)) {
            throw new exceptions_1.BusinessException(`Cannot transition from ${refund.status} to ${dto.status}`, 'REFUND_005');
        }
        let transactionId = dto.transactionId;
        let finalStatus = dto.status;
        if (dto.status === refund_types_1.RefundStatus.APPROVED) {
            const result = await this.paymentService.refundPayment(refund.paymentId, Number(refund.amount));
            transactionId = result.razorpayRefundId;
            finalStatus = result.status === 'processed' ? refund_types_1.RefundStatus.COMPLETED : refund_types_1.RefundStatus.APPROVED;
        }
        const updated = await this.refundRepository.update(id, {
            status: finalStatus,
            adminNotes: dto.adminNotes,
            transactionId,
            updatedBy: userId,
        });
        if (finalStatus === refund_types_1.RefundStatus.COMPLETED) {
            await this.auditService.log({
                action: 'REFUND_COMPLETED',
                module: 'refund',
                resource: 'Refund',
                resourceId: id,
                userId,
            });
        }
        return this.toResponse(updated);
    }
};
exports.RefundService = RefundService;
exports.RefundService = RefundService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [refund_repository_1.RefundRepository,
        audit_service_1.AuditService,
        payment_service_1.PaymentService])
], RefundService);
//# sourceMappingURL=refund.service.js.map