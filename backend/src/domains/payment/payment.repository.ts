import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    orderId?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const { orderId, status, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.PaymentWhereInput = {};
    if (orderId) where.orderId = orderId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
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
    return this.prisma.payment.findUnique({
      where: { id },
      include: { transactions: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async findByOrderId(orderId: string) {
    return this.prisma.payment.findMany({
      where: { orderId },
      include: { transactions: { orderBy: { createdAt: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: Prisma.PaymentCreateInput) {
    return this.prisma.payment.create({
      data,
      include: { transactions: true },
    });
  }

  async update(id: string, data: Prisma.PaymentUpdateInput) {
    return this.prisma.payment.update({ where: { id }, data });
  }

  /**
   * Guarded `UPDATE ... WHERE status <> 'CAPTURED'` so two concurrent
   * capture attempts for the same payment (a retried verify call racing a
   * webhook delivery, or Razorpay's documented webhook-retry behaviour)
   * can't both win: only the first to reach the row actually updates it,
   * the second matches zero rows instead of re-running the whole
   * confirm-order/deduct-stock/notify flow a second time. Returns the
   * number of rows affected (0 or 1) so the caller can skip that flow.
   */
  async markCapturedIfNotAlready(
    id: string,
    data: Prisma.PaymentUpdateManyMutationInput,
  ): Promise<number> {
    const result = await this.prisma.payment.updateMany({
      where: { id, status: { not: 'CAPTURED' } },
      data,
    });
    return result.count;
  }

  async createTransaction(data: Prisma.PaymentTransactionCreateInput) {
    return this.prisma.paymentTransaction.create({ data });
  }

  async generatePaymentNumber(): Promise<string> {
    const count = await this.prisma.payment.count();
    return `PAY${String(count + 1).padStart(8, '0')}`;
  }
}
