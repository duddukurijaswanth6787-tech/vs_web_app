import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { NotificationService } from '@domains/notification/notification.service';
import { OrderWorkflowService } from '@domains/order/order-workflow.service';
import { ReturnRequestRepository } from './return-request.repository';
import {
  CreateReturnDto,
  UpdateReturnStatusDto,
  ReturnQueryDto,
  ReturnRequestResponse,
  ReturnItemResponse,
} from './return-request.types';
import { PrismaService } from '@database/prisma.service';
import { OrderLifecycleService } from '@domains/order/order-lifecycle.service';

@Injectable()
export class ReturnRequestService {
  constructor(
    private readonly returnRepo: ReturnRequestRepository,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
    private readonly workflow: OrderWorkflowService,
  ) {}

  private async getSetting(key: string, defaultValue: string): Promise<string> {
    const setting = await this.prisma.appSetting.findUnique({ where: { key } });
    return setting?.value ?? defaultValue;
  }

  private toResponse(r: any): ReturnRequestResponse {
    return {
      id: r.id,
      orderId: r.orderId,
      returnNumber: r.returnNumber,
      reason: r.reason,
      status: r.status,
      refundPreference: r.refundPreference ?? undefined,
      adminNotes: r.adminNotes ?? undefined,
      items: r.items?.map((i: any): ReturnItemResponse => ({
        id: i.id,
        orderItemId: i.orderItemId,
        quantity: i.quantity,
        reason: i.reason ?? undefined,
        images: i.images?.map((img: any) => ({
          id: img.id,
          url: img.url,
          displayOrder: img.displayOrder,
        })),
      })),
      createdAt: r.createdAt,
    };
  }

  async findAll(query: ReturnQueryDto, customerId?: string) {
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

  async findById(id: string) {
    const ret = await this.returnRepo.findById(id);
    if (!ret)
      throw new BusinessException('Return request not found', 'RETURN_001');
    return this.toResponse(ret);
  }

  async create(userId: string, dto: CreateReturnDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { items: true },
    });
    if (!order) throw new BusinessException('Order not found', 'ORDER_001');

    // Customers call POST /returns directly (no ownership-checked proxy
    // like orders has via /me/orders), so this is the only place that
    // stops someone from filing a return against an order they don't own.
    const customerProfile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    if (!customerProfile || order.customerId !== customerProfile.id) {
      throw new BusinessException('Order not found', 'ORDER_001');
    }

    if (!this.workflow.canReturn(order.status))
      throw new BusinessException(
        'Order must be delivered before requesting a return',
        'RETURN_002',
      );

    // ponytail: return window check using order timeline
    const deliveredEntry = await this.prisma.orderTimeline.findFirst({
      where: { orderId: dto.orderId, status: 'DELIVERED' },
      orderBy: { createdAt: 'desc' },
    });
    if (deliveredEntry) {
      const returnWindowDays = Number(
        await this.getSetting('return_window_days', '30'),
      );
      const deadline = new Date(deliveredEntry.createdAt);
      deadline.setDate(deadline.getDate() + returnWindowDays);
      if (new Date() > deadline)
        throw new BusinessException('Return window has expired', 'RETURN_006');
    }

    const itemsToProcess = dto.items?.length
      ? dto.items
      : order.items.map((i) => ({
          orderItemId: i.id,
          quantity: i.quantity,
          reason: dto.reason,
        }));

    const orderItemMap = new Map(order.items.map((i) => [i.id, i]));
    const seenItems = new Set<string>();
    for (const item of itemsToProcess) {
      if (seenItems.has(item.orderItemId))
        throw new BusinessException(
          'Select each returned item only once.',
          'RETURN_004',
        );
      seenItems.add(item.orderItemId);
      const orderItem = orderItemMap.get(item.orderItemId);
      if (!orderItem)
        throw new BusinessException(
          `Order item ${item.orderItemId} not found`,
          'RETURN_003',
        );
      if (
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > orderItem.quantity
      )
        throw new BusinessException(
          'Return quantity exceeds order item quantity',
          'RETURN_004',
        );
    }

    const returnNumber = await this.returnRepo.generateReturnNumber();
    const lifecycle = new OrderLifecycleService(this.prisma);
    const ret = await this.prisma.$transaction(async (tx) => {
      const currentOrder = await lifecycle.lockedOrder(tx, dto.orderId);
      if (!this.workflow.canReturn(currentOrder.status))
        throw new BusinessException(
          'A return is already active or this order cannot be returned.',
          'RETURN_002',
        );
      const previousItems = await tx.returnItem.findMany({
        where: {
          returnRequest: {
            orderId: dto.orderId,
            status: { notIn: ['REJECTED', 'CANCELLED'] },
          },
        },
      });
      for (const item of itemsToProcess) {
        const alreadyReturned = previousItems
          .filter((i) => i.orderItemId === item.orderItemId)
          .reduce((sum, i) => sum + i.quantity, 0);
        const original = currentOrder.items.find(
          (i) => i.id === item.orderItemId,
        );
        if (!original || alreadyReturned + item.quantity > original.quantity)
          throw new BusinessException(
            'Return quantity exceeds the remaining purchased quantity.',
            'RETURN_004',
          );
      }
      const created = await tx.returnRequest.create({
        data: {
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
        },
        include: { items: true },
      });
      await lifecycle.transitionTx(
        tx,
        dto.orderId,
        'RETURN_REQUESTED',
        userId,
        `Return requested: ${returnNumber}`,
      );
      return created;
    });

    // ponytail: store images on return items if provided
    const images = (dto as any).images as string[] | undefined;
    if (images?.length) {
      for (const item of ret.items) {
        for (let i = 0; i < images.length; i++) {
          await this.prisma.returnItemImage.create({
            data: { returnItemId: item.id, url: images[i], displayOrder: i },
          });
        }
      }
    }

    await this.auditService
      .log({
        action: 'RETURN_REQUESTED',
        module: 'returns',
        resource: 'return_request',
        resourceId: ret.id,
        userId,
        newValue: { orderId: dto.orderId, returnNumber },
      })
      .catch(() => {});

    await this.notificationService
      .create({
        userId,
        type: 'ORDER_RETURNED',
        title: 'Return Requested',
        message: `Return ${returnNumber} has been submitted`,
        data: { returnId: ret.id, returnNumber },
      })
      .catch(() => {});

    return this.toResponse(ret);
  }

  async updateStatus(id: string, dto: UpdateReturnStatusDto, userId: string) {
    const ret = await this.returnRepo.findById(id);
    if (!ret)
      throw new BusinessException('Return request not found', 'RETURN_001');
    if (ret.status === dto.status) return this.toResponse(ret);

    const validTransitions: Record<string, string[]> = {
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
      throw new BusinessException(
        `Cannot transition from ${ret.status} to ${dto.status}`,
        'RETURN_005',
      );

    const updated = await this.prisma.$transaction(async (tx) => {
      const lifecycle = new OrderLifecycleService(this.prisma);
      await lifecycle.lockedOrder(tx, ret.orderId);
      const current = await tx.returnRequest.findUniqueOrThrow({
        where: { id },
        include: { items: { include: { orderItem: true } } },
      });
      if (current.status === dto.status) return current;
      if (!(validTransitions[current.status] ?? []).includes(dto.status))
        throw new BusinessException(
          'Return changed. Refresh before continuing.',
          'RETURN_005',
        );
      if (dto.status === 'REFUND_COMPLETED') {
        const refunds = await tx.refund.findMany({
          where: { orderId: ret.orderId, status: 'COMPLETED' },
        });
        const prior = await tx.returnItem.findMany({
          where: {
            returnRequest: {
              orderId: ret.orderId,
              status: 'REFUND_COMPLETED',
              id: { not: id },
            },
          },
          include: { orderItem: true },
        });
        const refundRequired = [...prior, ...current.items].reduce(
          (sum, item) =>
            sum +
            (Math.max(
              0,
              Number(item.orderItem.totalPrice) -
                Number(item.orderItem.discountAmount),
            ) *
              item.quantity) /
              item.orderItem.quantity,
          0,
        );
        const refunded = refunds.reduce(
          (sum, refund) => sum + Number(refund.amount),
          0,
        );
        if (Math.round(refunded * 100) < Math.round(refundRequired * 100))
          throw new BusinessException(
            'Complete the refund for all returned items before closing this return.',
            'RETURN_REFUND_PENDING',
          );
        await this.workflow.restockReturnedItems(tx, {
          orderId: ret.orderId,
          orderNumber: ret.returnNumber,
          items: current.items.map((i) => ({
            variantId: i.orderItem.variantId,
            quantity: i.quantity,
          })),
          userId,
        });
        await lifecycle.transitionTx(
          tx,
          ret.orderId,
          'RETURN_COMPLETED',
          userId,
          'Returned items received and refund completed',
        );
      } else if (dto.status === 'APPROVED')
        await lifecycle.transitionTx(
          tx,
          ret.orderId,
          'RETURN_APPROVED',
          userId,
          'Return approved',
        );
      else if (dto.status === 'REJECTED')
        await lifecycle.transitionTx(
          tx,
          ret.orderId,
          'RETURN_REJECTED',
          userId,
          'Return declined',
        );
      else if (dto.status === 'CANCELLED')
        await lifecycle.transitionTx(
          tx,
          ret.orderId,
          'RETURN_REJECTED',
          userId,
          'Return cancelled',
        );
      return tx.returnRequest.update({
        where: { id },
        data: {
          status: dto.status,
          adminNotes: dto.adminNotes,
          updatedBy: userId,
        },
        include: { items: true },
      });
    });

    // ponytail: timeline + notification for every status change
    await this.prisma.orderTimeline.create({
      data: {
        orderId: ret.orderId,
        status: `RETURN_${dto.status}`,
        message: `Return ${ret.returnNumber}: ${dto.status}`,
        createdBy: userId,
      },
    });

    const notifMap: Record<string, string> = {
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

    const actionMap: Record<string, string> = {
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
}
