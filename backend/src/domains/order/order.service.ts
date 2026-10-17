import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { OrderRepository } from './order.repository';
import { OrderWorkflowService } from './order-workflow.service';
import { OrderQueryDto, OrderResponse } from './order.types';
import { getOrderState } from './order-state';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly workflow: OrderWorkflowService,
  ) {}

  private toResponse(
    o: any,
    includeRelations = false,
    includeAdminFields = false,
  ): OrderResponse {
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      customerId: o.customerId,
      status: o.status,
      ...getOrderState(o),
      subtotal: Number(o.subtotal),
      discountTotal: Number(o.discountTotal),
      taxTotal: Number(o.taxTotal),
      shippingCharge: Number(o.shippingCharge),
      grandTotal: Number(o.grandTotal),
      currency: o.currency,
      notes: o.notes ?? undefined,
      cancelReason: o.cancelReason ?? undefined,
      courierPartner: o.courierPartner ?? undefined,
      waybillNumber: o.waybillNumber ?? undefined,
      trackingUrl: o.trackingUrl ?? undefined,
      createdBy: o.createdBy ?? undefined,
      ...(includeAdminFields
        ? {
            channel: o.channel,
            terminalId: o.terminalId ?? undefined,
          }
        : {}),
      customer: o.customer
        ? {
            id: o.customer.id,
            phone: o.customer.phone ?? undefined,
            user: o.customer.user
              ? {
                  firstName: o.customer.user.firstName ?? undefined,
                  lastName: o.customer.user.lastName ?? undefined,
                  email: o.customer.user.email ?? undefined,
                  phone: o.customer.user.phone ?? undefined,
                }
              : undefined,
          }
        : undefined,
      items: o.items
        ? o.items.map((i: any) => ({
            id: i.id,
            productId: i.productId,
            productName: i.productName,
            variantId: i.variantId ?? undefined,
            variantTitle: i.variantTitle ?? undefined,
            sku: i.sku,
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
            totalPrice: Number(i.totalPrice),
            taxAmount: Number(i.taxAmount),
            discountAmount: Number(i.discountAmount),
          }))
        : undefined,
      addresses: o.addresses
        ? o.addresses.map((a: any) => ({
            id: a.id,
            addressType: a.addressType,
            fullName: a.fullName,
            phone: a.phone,
            addressLine1: a.addressLine1,
            addressLine2: a.addressLine2 ?? undefined,
            city: a.city,
            state: a.state,
            country: a.country,
            postalCode: a.postalCode,
            landmark: a.landmark ?? undefined,
          }))
        : undefined,
      timeline:
        includeRelations && o.timeline
          ? o.timeline.map((t: any) => ({
              id: t.id,
              status: t.status,
              message: t.message ?? undefined,
              createdBy: t.createdBy ?? undefined,
              createdAt: t.createdAt,
            }))
          : undefined,
      payments: o.payments
        ? o.payments.map((p: any) => ({
            id: p.id,
            paymentNumber: p.paymentNumber,
            provider: p.provider,
            method: p.method,
            amount: Number(p.amount),
            currency: p.currency,
            status: p.status,
            transactionId: p.transactionId ?? undefined,
            createdAt: p.createdAt,
          }))
        : undefined,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    };
  }

  async findAll(query: OrderQueryDto, includeAdminFields = false) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.orderRepository.findAll({
      search: query.search,
      channel: query.channel,
      view: query.view,
      status: query.status,
      customerId: query.customerId,
      startDate: query.startDate,
      endDate: query.endDate,
      page,
      limit,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    });
    return {
      data: result.data.map((o) =>
        this.toResponse(o, false, includeAdminFields),
      ),
      meta: result.meta,
    };
  }

  async findById(id: string, includeAdminFields = false) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new BusinessException('Order not found', 'ORDER_001');
    return this.toResponse(order, true, includeAdminFields);
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.orderRepository.findByOrderNumber(orderNumber);
    if (!order) throw new BusinessException('Order not found', 'ORDER_001');
    return this.toResponse(order, true);
  }

  async findByCustomerId(customerId: string, query: OrderQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.orderRepository.findByCustomerId(
      customerId,
      page,
      limit,
    );
    return {
      data: result.data.map((o) => this.toResponse(o)),
      meta: result.meta,
    };
  }

  async updateStatus(
    id: string,
    status: string,
    userId: string,
    message?: string,
  ) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new BusinessException('Order not found', 'ORDER_001');

    await this.workflow.transition(id, status, userId, message);

    return this.findById(id);
  }

  async assignCourier(
    id: string,
    dto: {
      courierPartner: string;
      waybillNumber?: string;
      trackingUrl?: string;
      message?: string;
    },
    userId: string,
  ): Promise<OrderResponse> {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new BusinessException('Order not found', 'ORDER_001');

    const waybill = dto.waybillNumber?.trim();
    if (!waybill) throw new BusinessException('Enter the actual waybill issued by the courier.', 'ORDER_WAYBILL_REQUIRED');
    await this.workflow.transition(id, 'SHIPPED', userId, dto.message || 'Handed to courier', {
      courierPartner: dto.courierPartner, waybillNumber: waybill, trackingUrl: dto.trackingUrl,
    });
    const updated = await this.orderRepository.findById(id);

    return this.toResponse(updated, true, true);
  }
}
