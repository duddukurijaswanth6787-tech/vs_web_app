import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { OrderWorkflowService } from './order-workflow.service';
import { Prisma } from '@prisma/client';

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { payments: true; items: true };
}>;

@Injectable()
export class OrderTimeoutService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderTimeoutService.name);
  private timer: NodeJS.Timeout | null = null;
  /** Checkout pending payment expiration timeout: 15 minutes */
  public readonly TIMEOUT_MINUTES = 15;

  constructor(
    private readonly prisma: PrismaService,
    private readonly workflow: OrderWorkflowService,
  ) {}

  onModuleInit() {
    this.logger.log(
      `OrderTimeoutService initialized. Auto-sweeping expired pending orders every 60s (Timeout: ${this.TIMEOUT_MINUTES}m)...`,
    );

    // Initial check on startup (delayed 5s to allow DB connection to stabilize)
    setTimeout(() => {
      this.sweepExpiredOrders().catch((err) =>
        this.logger.error(`Initial order sweep failed: ${err.message}`, err.stack),
      );
    }, 5000);

    // Recurring check every 60 seconds
    this.timer = setInterval(() => {
      this.sweepExpiredOrders().catch((err) =>
        this.logger.error(`Periodic order sweep failed: ${err.message}`, err.stack),
      );
    }, 60 * 1000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Sweeps and automatically cancels online orders whose payment remained PENDING
   * past the timeout threshold (default 15 minutes) or whose payment has FAILED,
   * restoring all reserved stock back into available inventory immediately.
   */
  async sweepExpiredOrders(timeoutMinutes = this.TIMEOUT_MINUTES): Promise<{
    sweptCount: number;
    cancelledOrderNumbers: string[];
  }> {
    const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    // Find all online orders created before the cutoff that are still PENDING and uncaptured
    const expiredOrders: OrderWithRelations[] = await this.prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lte: cutoff },
        channel: 'ONLINE_STORE',
        payments: {
          some: {
            status: 'PENDING',
          },
          none: {
            status: 'CAPTURED',
          },
        },
      },
      include: {
        payments: true,
        items: true,
      },
    });

    // Also find any PENDING orders whose payment is explicitly marked FAILED
    const failedPaymentOrders: OrderWithRelations[] = await this.prisma.order.findMany({
      where: {
        status: 'PENDING',
        payments: {
          some: { status: 'FAILED' },
          none: { status: 'CAPTURED' },
        },
      },
      include: {
        payments: true,
        items: true,
      },
    });

    // Merge and deduplicate
    const orderMap = new Map<string, OrderWithRelations>();
    for (const o of [...expiredOrders, ...failedPaymentOrders]) {
      orderMap.set(o.id, o);
    }

    const cancelledOrderNumbers: string[] = [];

    for (const order of orderMap.values()) {
      try {
        this.logger.warn(
          `[OrderTimeoutService] Auto-cancelling expired order ${order.orderNumber} (created ${order.createdAt.toISOString()}) -- releasing reserved stock.`,
        );

        // 1. Release reserved stock back to available inventory
        await this.workflow.releaseInventory(order.id, 'SYSTEM');

        // 2. Mark order as CANCELLED
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            cancelReason: `Online payment timed out (${timeoutMinutes} minutes window elapsed). Reserved stock automatically restored to available inventory.`,
            updatedBy: 'SYSTEM',
          },
        });

        // 3. Mark any PENDING payment records as FAILED
        for (const p of order.payments) {
          if (p.status === 'PENDING') {
            await this.prisma.payment.update({
              where: { id: p.id },
              data: {
                status: 'FAILED',
                metadata: {
                  ...(typeof p.metadata === 'object' && p.metadata !== null
                    ? (p.metadata as object)
                    : {}),
                  timeoutReason: `Customer payment window expired after ${timeoutMinutes} minutes`,
                  timedOutAt: new Date().toISOString(),
                },
              },
            });
          }
        }

        // 4. Log order timeline
        await this.prisma.orderTimeline.create({
          data: {
            orderId: order.id,
            status: 'CANCELLED',
            message: `Order auto-cancelled: Online payment timed out (${timeoutMinutes}m). Reserved inventory automatically released back to stock.`,
            createdBy: 'SYSTEM',
          },
        });

        cancelledOrderNumbers.push(order.orderNumber);
      } catch (err: any) {
        this.logger.error(
          `Failed to auto-cancel expired order ${order.orderNumber}: ${err.message}`,
          err.stack,
        );
      }
    }

    if (cancelledOrderNumbers.length > 0) {
      this.logger.log(
        `[OrderTimeoutService] Successfully swept and cancelled ${cancelledOrderNumbers.length} expired orders: ${cancelledOrderNumbers.join(', ')}`,
      );
    }

    return {
      sweptCount: cancelledOrderNumbers.length,
      cancelledOrderNumbers,
    };
  }
}
