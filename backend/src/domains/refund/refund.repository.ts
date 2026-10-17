import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';
import type { Refund } from '@prisma/client';
import { randomBytes } from 'crypto';
import { BusinessException } from '@common/exceptions';

@Injectable()
export class RefundRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    orderId?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const { orderId, status, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.RefundWhereInput = {};
    if (orderId) where.orderId = orderId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.refund.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.refund.count({ where }),
    ]);
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async findById(id: string) {
    return this.prisma.refund.findUnique({ where: { id } });
  }

  async findByOrderId(orderId: string) {
    return this.prisma.refund.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.RefundCreateInput) {
    const paymentId = data.payment.connect!.id!;
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "payments" WHERE id = ${paymentId} FOR UPDATE`;
      const payment = await tx.payment.findUniqueOrThrow({
        where: { id: paymentId },
        include: { refunds: true },
      });
      const allocated = payment.refunds
        .filter((r) => r.status !== 'REJECTED')
        .reduce((sum, r) => sum + Number(r.amount), 0);
      if (allocated + Number(data.amount) > Number(payment.amount) + 0.001)
        throw new BusinessException(
          'The remaining payment balance is less than this refund.',
          'REFUND_003',
        );
      return tx.refund.create({ data });
    });
  }

  async update(id: string, data: Prisma.RefundUpdateInput) {
    return this.prisma.refund.update({ where: { id }, data });
  }

  async processStatus(
    id: string,
    action: (refund: Refund, tx: Prisma.TransactionClient) => Promise<Refund>,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const initial = await tx.refund.findUnique({ where: { id } });
        if (!initial)
          throw new BusinessException('Refund not found', 'REFUND_001');
        await tx.$queryRaw`SELECT id FROM "payments" WHERE id = ${initial.paymentId} FOR UPDATE`;
        const current = await tx.refund.findUniqueOrThrow({ where: { id } });
        return action(current, tx);
      },
      { timeout: 20000 },
    );
  }

  async findPaymentById(paymentId: string) {
    return this.prisma.payment.findUnique({ where: { id: paymentId } });
  }

  async generateRefundNumber(): Promise<string> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `REF-${dateStr}-${randomBytes(6).toString('hex').toUpperCase()}`;
  }
}
