import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { OrderWorkflowService } from './order-workflow.service';

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
        this.logger.error(
          `Initial order sweep failed: ${err.message}`,
          err.stack,
        ),
      );
    }, 5000);

    // Recurring check every 60 seconds
    this.timer = setInterval(() => {
      this.sweepExpiredOrders().catch((err) =>
        this.logger.error(
          `Periodic order sweep failed: ${err.message}`,
          err.stack,
        ),
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

    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: 'PENDING',
        channel: 'ONLINE_STORE',
        createdAt: { lte: cutoff },
        payments: {
          none: {
            OR: [
              { status: { in: ['CAPTURED', 'COMPLETED'] } },
              { method: 'COD' },
            ],
          },
        },
      },
      select: { id: true, orderNumber: true },
    });
    const cancelledOrderNumbers: string[] = [];
    for (const order of expiredOrders) {
      try {
        if (await this.workflow.expireOrder(order.id, cutoff))
          cancelledOrderNumbers.push(order.orderNumber);
      } catch (err: any) {
        this.logger.error(
          'Failed to expire order ' + order.orderNumber + ': ' + err.message,
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
