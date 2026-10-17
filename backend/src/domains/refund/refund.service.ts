import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { PaymentService } from '@domains/payment/payment.service';
import { RefundRepository } from './refund.repository';
import {
  CreateRefundDto,
  UpdateRefundDto,
  RefundQueryDto,
  RefundResponse,
  RefundStatus,
} from './refund.types';

const VALID_TRANSITIONS: Record<string, string[]> = {
  REQUESTED: [RefundStatus.APPROVED, RefundStatus.REJECTED],
  APPROVED: [RefundStatus.COMPLETED],
};

@Injectable()
export class RefundService {
  constructor(
    private readonly refundRepository: RefundRepository,
    private readonly auditService: AuditService,
    private readonly paymentService: PaymentService,
  ) {}

  private toResponse(r: any): RefundResponse {
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

  async findAll(query: RefundQueryDto) {
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

  async findById(id: string) {
    const refund = await this.refundRepository.findById(id);
    if (!refund) throw new BusinessException('Refund not found', 'REFUND_001');

    return this.toResponse(refund);
  }

  async findByOrderId(orderId: string) {
    const refunds = await this.refundRepository.findByOrderId(orderId);
    return refunds.map((r) => this.toResponse(r));
  }

  async create(userId: string, dto: CreateRefundDto) {
    const payment = await this.refundRepository.findPaymentById(dto.paymentId);
    if (!payment)
      throw new BusinessException('Payment not found', 'REFUND_002');
    if (
      payment.orderId !== dto.orderId ||
      !['CAPTURED', 'COMPLETED'].includes(payment.status) ||
      dto.amount <= 0
    ) {
      throw new BusinessException(
        'Select a received payment belonging to this order and a positive refund amount.',
        'REFUND_INVALID_PAYMENT',
      );
    }
    if (Number(payment.amount) < dto.amount) {
      throw new BusinessException(
        'Refund amount exceeds payment amount',
        'REFUND_003',
      );
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

  async updateStatus(id: string, dto: UpdateRefundDto, userId: string) {
    if (!dto.status)
      throw new BusinessException('Status is required', 'REFUND_004');
    const requestedStatus = dto.status;

    const updated = await this.refundRepository.processStatus(
      id,
      async (refund, tx) => {
        if (
          refund.status === dto.status ||
          (dto.status === RefundStatus.APPROVED &&
            refund.status === RefundStatus.COMPLETED &&
            refund.transactionId)
        )
          return refund;

        const allowed = VALID_TRANSITIONS[refund.status];
        if (!allowed?.includes(requestedStatus)) {
          throw new BusinessException(
            `Cannot transition from ${refund.status} to ${dto.status}`,
            'REFUND_005',
          );
        }

        const payment = await tx.payment.findUniqueOrThrow({
          where: { id: refund.paymentId },
        });
        let transactionId = refund.transactionId || dto.transactionId;
        let finalStatus: string = dto.status!;

        // Approving a refund actually moves the money -- calls Razorpay's
        // refund API right here rather than just recording a status change, so
        // "approved" and "money sent" can't drift apart. If Razorpay confirms
        // the refund instantly it's marked COMPLETED immediately; otherwise it
        // stays APPROVED until the refund.processed webhook (handled in
        // PaymentService.handleWebhook) or a manual admin completion.
        if (
          dto.status === RefundStatus.APPROVED &&
          payment.provider === 'razorpay'
        ) {
          const result = await this.paymentService.refundPayment(
            refund.paymentId,
            Number(refund.amount),
            refund.id,
          );
          transactionId = result.razorpayRefundId;
          finalStatus =
            result.status === 'processed'
              ? RefundStatus.COMPLETED
              : RefundStatus.APPROVED;
        }
        if (dto.status === RefundStatus.COMPLETED) {
          if (!transactionId?.trim())
            throw new BusinessException(
              'Record the refund transaction reference before completing it.',
              'REFUND_REFERENCE_REQUIRED',
            );
          if (payment.provider === 'razorpay')
            await this.paymentService.confirmRefund(
              refund.paymentId,
              transactionId,
              Number(refund.amount),
            );
        }

        return tx.refund.update({
          where: { id },
          data: {
            status: finalStatus,
            adminNotes: dto.adminNotes,
            transactionId,
            updatedBy: userId,
          },
        });
      },
    );

    if (updated.status === RefundStatus.COMPLETED) {
      await this.auditService
        .log({
          action: 'REFUND_COMPLETED',
          module: 'refund',
          resource: 'Refund',
          resourceId: id,
          userId,
        })
        .catch(() => {});
    }

    return this.toResponse(updated);
  }
}
