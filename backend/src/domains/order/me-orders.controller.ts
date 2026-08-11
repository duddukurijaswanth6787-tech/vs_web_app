import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { OrderQueryDto } from './order.types';
import { CancellationService } from '@domains/cancellation/cancellation.service';
import { InvoiceService } from '@domains/invoice/invoice.service';
import { AuditService } from '@domains/audit/audit.service';
import { PrismaService } from '@database/prisma.service';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Me / Orders')
@Controller('me/orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MeOrdersController {
  constructor(
    private readonly orderService: OrderService,
    private readonly cancellationService: CancellationService,
    private readonly invoiceService: InvoiceService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private async resolveCustomerId(userId: string): Promise<string | null> {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    return profile?.id ?? null;
  }

  @Get()
  @ApiOperation({ summary: 'Get current customer orders' })
  async findAll(
    @Query() query: OrderQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const customerId = await this.resolveCustomerId(user.sub);
    if (!customerId) return ResponseBuilder.success({ data: [], meta: {} });
    return ResponseBuilder.success(
      await this.orderService.findByCustomerId(customerId, query),
    );
  }

  @Get(':orderNumber')
  @ApiOperation({ summary: 'Get current customer order by order number' })
  async findByOrderNumber(
    @Param('orderNumber') orderNumber: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const order = await this.orderService.findByOrderNumber(orderNumber);
    const customerId = await this.resolveCustomerId(user.sub);
    if (order.customerId !== customerId)
      return ResponseBuilder.success(null, 'Order not found');
    return ResponseBuilder.success(order);
  }

  @Get(':orderNumber/tracking')
  @ApiOperation({ summary: 'Get order tracking information' })
  async tracking(
    @Param('orderNumber') orderNumber: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const order = await this.orderService.findByOrderNumber(orderNumber);
    const customerId = await this.resolveCustomerId(user.sub);
    if (order.customerId !== customerId)
      return ResponseBuilder.success(null, 'Order not found');

    await this.auditService.log({
      action: 'TRACKING_VIEWED',
      module: 'orders',
      resource: 'order',
      resourceId: order.id,
      userId: user.sub,
    });

    const timeline = (order.timeline || []).map((t: any) => ({
      status: t.status,
      time: t.createdAt ? new Date(t.createdAt).toISOString() : '',
    }));

    return ResponseBuilder.success({
      orderNumber: order.orderNumber,
      status: order.status,
      carrier: null,
      trackingNumber: null,
      trackingUrl: '',
      estimatedDelivery: '',
      currentStatus: order.status,
      timeline,
    });
  }

  @Get(':orderNumber/invoice')
  @ApiOperation({ summary: 'Get order invoice' })
  async invoice(
    @Param('orderNumber') orderNumber: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const order = await this.orderService.findByOrderNumber(orderNumber);
    const customerId = await this.resolveCustomerId(user.sub);
    if (order.customerId !== customerId)
      return ResponseBuilder.success(null, 'Order not found');

    const invoices = await this.invoiceService.findByOrderId(order.id);
    if (invoices.length > 0) {
      const inv = invoices[0];
      await this.auditService.log({
        action: 'INVOICE_VIEWED',
        module: 'orders',
        resource: 'invoice',
        resourceId: inv.id,
        userId: user.sub,
      });
      return ResponseBuilder.success({
        downloadUrl: null,
        fileName: null,
        mimeType: null,
        invoice: inv,
      });
    }

    const [userRec, payments] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { firstName: true, lastName: true, email: true, phone: true },
      }),
      this.prisma.payment.findMany({
        where: { orderId: order.id },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { method: true, status: true },
      }),
    ]);

    const billing = (order.addresses || []).find(
      (a: any) => a.addressType === 'BILLING',
    );
    const shipping = (order.addresses || []).find(
      (a: any) => a.addressType === 'SHIPPING',
    );
    const payment = payments[0];

    await this.auditService.log({
      action: 'INVOICE_VIEWED',
      module: 'orders',
      resource: 'order',
      resourceId: order.id,
      userId: user.sub,
    });

    return ResponseBuilder.success({
      downloadUrl: null,
      fileName: null,
      mimeType: null,
      invoice: {
        invoiceNumber: '',
        invoiceDate: order.createdAt
          ? new Date(order.createdAt).toISOString()
          : '',
        orderNumber: order.orderNumber,
        customer: {
          name: userRec
            ? `${userRec.firstName}${userRec.lastName ? ' ' + userRec.lastName : ''}`
            : '',
          email: userRec?.email ?? '',
          phone: userRec?.phone ?? '',
        },
        billingAddress: billing
          ? {
              fullName: billing.fullName,
              phone: billing.phone,
              addressLine1: billing.addressLine1,
              addressLine2: billing.addressLine2 ?? '',
              city: billing.city,
              state: billing.state,
              country: billing.country,
              postalCode: billing.postalCode,
            }
          : null,
        shippingAddress: shipping
          ? {
              fullName: shipping.fullName,
              phone: shipping.phone,
              addressLine1: shipping.addressLine1,
              addressLine2: shipping.addressLine2 ?? '',
              city: shipping.city,
              state: shipping.state,
              country: shipping.country,
              postalCode: shipping.postalCode,
            }
          : null,
        items: (order.items || []).map((i: any) => ({
          productName: i.productName,
          sku: i.sku,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
          taxAmount: i.taxAmount,
          discountAmount: i.discountAmount,
        })),
        subtotal: order.subtotal,
        tax: order.taxTotal ?? 0,
        shipping: order.shippingCharge ?? 0,
        discount: order.discountTotal ?? 0,
        wallet: 0,
        total: order.grandTotal,
        paymentMethod: payment?.method ?? '',
        paymentStatus: payment?.status ?? '',
        currency: order.currency ?? 'INR',
      },
    });
  }

  @Post(':orderNumber/cancel')
  @ApiOperation({ summary: 'Cancel current customer order' })
  async cancel(
    @Param('orderNumber') orderNumber: string,
    @Body() body: { reason: string },
    @CurrentUser() user: JwtPayload,
  ) {
    const order = await this.orderService.findByOrderNumber(orderNumber);
    const customerId = await this.resolveCustomerId(user.sub);
    if (order.customerId !== customerId)
      return ResponseBuilder.success(null, 'Order not found');
    return ResponseBuilder.success(
      await this.cancellationService.create(user.sub, {
        orderId: order.id,
        reason: body.reason,
      }),
      'Cancellation requested',
    );
  }
}
