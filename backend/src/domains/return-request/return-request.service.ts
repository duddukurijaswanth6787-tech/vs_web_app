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

    const orderItemMap = new Map(order.items.map((i) => [i.id, i]));
    for (const item of dto.items) {
      const orderItem = orderItemMap.get(item.orderItemId);
      if (!orderItem)
        throw new BusinessException(
          `Order item ${item.orderItemId} not found`,
          'RETURN_003',
        );
      if (item.quantity > orderItem.quantity)
        throw new BusinessException(
          'Return quantity exceeds order item quantity',
          'RETURN_004',
        );
    }

    const returnNumber = await this.returnRepo.generateReturnNumber();
    const ret = await this.returnRepo.create({
      order: { connect: { id: dto.orderId } },
      returnNumber,
      reason: dto.reason,
      refundPreference: (dto as any).refundPreference,
      createdBy: userId,
      items: {
        create: dto.items.map((i) => ({
          orderItem: { connect: { id: i.orderItemId } },
          quantity: i.quantity,
          reason: i.reason,
        })),
      },
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

    await this.workflow.transition(
      dto.orderId,
      'RETURN_REQUESTED',
      userId,
      `Return requested: ${returnNumber}`,
    );

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

  async updateStatus(id: string, dto: UpdateReturnStatusDto, userId: string) {
    const ret = await this.returnRepo.findById(id);
    if (!ret)
      throw new BusinessException('Return request not found', 'RETURN_001');

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

    const updated = await this.returnRepo.update(id, {
      status: dto.status,
      adminNotes: dto.adminNotes,
      updatedBy: userId,
    });

    if (dto.status === 'REFUND_COMPLETED') {
      await this.workflow.restoreInventory(ret.orderId, userId);
      await this.workflow.transition(
        ret.orderId,
        'RETURN_COMPLETED',
        userId,
        'Return completed',
      );
    } else if (dto.status === 'APPROVED') {
      await this.workflow.transition(
        ret.orderId,
        'RETURN_APPROVED',
        userId,
        'Return approved',
      );
    }

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
