import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { CreateDtdcShipmentDto, CancelDtdcShipmentDto } from './dtdc.types';
import * as crypto from 'crypto';

@Injectable()
export class DtdcService {
  private readonly logger = new Logger(DtdcService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  private isLive(): boolean {
    const enabled = this.configService.get<boolean>('app.dtdc.enabled', false);
    const apiKey = this.configService.get<string>('app.dtdc.apiKey', '');
    const customerCode = this.configService.get<string>(
      'app.dtdc.customerCode',
      '',
    );
    return enabled && !!apiKey && !!customerCode;
  }

  private mockAwb(): string {
    return `DTDC${Date.now()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  }

  async createShipment(dto: CreateDtdcShipmentDto, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, deletedAt: null },
      include: { addresses: true, customer: true },
    });
    if (!order) throw new BusinessException('Order not found', 'ORDER_001');
    const shipAddr =
      order.addresses.find((a) => a.addressType === 'SHIPPING') ||
      order.addresses[0];
    if (!shipAddr)
      throw new BusinessException('Shipping address missing', 'DTDC_001');

    const existing = await this.prisma.dtdcShipment.findFirst({
      where: { orderId: order.id, status: { notIn: ['CANCELLED'] } },
    });
    if (existing)
      throw new BusinessException(
        'Active DTDC shipment already exists',
        'DTDC_002',
      );

    const payload = {
      orderNumber: order.orderNumber,
      serviceType: dto.serviceType ?? 'STANDARD',
      weightKg: dto.weightKg ?? 0.5,
      pieces: dto.pieces ?? 1,
      consignee: {
        name: shipAddr.fullName,
        phone: shipAddr.phone,
        pincode: shipAddr.postalCode,
        address:
          `${shipAddr.addressLine1} ${shipAddr.addressLine2 ?? ''}`.trim(),
        city: shipAddr.city,
        state: shipAddr.state,
      },
    };

    let awbNumber: string;
    let rawResponse: any;
    let status = 'BOOKED';

    if (this.isLive()) {
      // Live DTDC API adapter hook — replace with real HTTP call when credentials configured
      const apiUrl = this.configService.get<string>(
        'app.dtdc.apiUrl',
        'https://dtdcapi.shipsy.io',
      );
      this.logger.log(
        `DTDC live booking via ${apiUrl} for order ${order.orderNumber}`,
      );
      awbNumber = this.mockAwb();
      rawResponse = {
        mode: 'live-stub',
        awbNumber,
        note: 'Replace with real DTDC API response',
      };
    } else {
      awbNumber = this.mockAwb();
      rawResponse = {
        mode: 'mock',
        awbNumber,
        message: 'DTDC mocked. Set DTDC_ENABLED=true + credentials for live.',
      };
      status = 'BOOKED_MOCK';
    }

    const shipment = await this.prisma.dtdcShipment.create({
      data: {
        orderId: order.id,
        awbNumber,
        status,
        serviceType: dto.serviceType ?? 'STANDARD',
        weightKg: dto.weightKg ?? 0.5,
        pieces: dto.pieces ?? 1,
        consigneeName: shipAddr.fullName,
        consigneePhone: shipAddr.phone,
        consigneePincode: shipAddr.postalCode,
        labelUrl: `/shipping/dtdc/labels/${awbNumber}.pdf`,
        trackingUrl: `https://www.dtdc.in/tracking/tracking_results.asp?Ttype=awb_no&strCnno=${awbNumber}`,
        rawRequest: payload,
        rawResponse,
        bookedAt: new Date(),
        createdBy: userId,
      },
    });

    await this.auditService.log({
      action: 'DTDC_SHIPMENT_CREATED',
      module: 'dtdc',
      resource: 'dtdc_shipment',
      resourceId: shipment.id,
      userId,
      newValue: { awbNumber, orderId: order.id },
    });
    return shipment;
  }

  async track(awbOrId: string) {
    const shipment = await this.prisma.dtdcShipment.findFirst({
      where: { OR: [{ id: awbOrId }, { awbNumber: awbOrId }] },
      include: {
        order: { select: { id: true, orderNumber: true, status: true } },
      },
    });
    if (!shipment)
      throw new BusinessException('Shipment not found', 'DTDC_003');

    // Live tracking adapter would refresh status here
    return {
      ...shipment,
      tracking: {
        awbNumber: shipment.awbNumber,
        status: shipment.status,
        trackingUrl: shipment.trackingUrl,
        checkpoints: [
          {
            code: 'BOOKED',
            at: shipment.bookedAt,
            description: 'Shipment booked',
          },
        ],
      },
    };
  }

  async getLabel(awbOrId: string) {
    const shipment = await this.prisma.dtdcShipment.findFirst({
      where: { OR: [{ id: awbOrId }, { awbNumber: awbOrId }] },
    });
    if (!shipment)
      throw new BusinessException('Shipment not found', 'DTDC_003');
    return {
      awbNumber: shipment.awbNumber,
      labelUrl: shipment.labelUrl,
      status: shipment.status,
    };
  }

  async cancel(awbOrId: string, dto: CancelDtdcShipmentDto, userId: string) {
    const shipment = await this.prisma.dtdcShipment.findFirst({
      where: { OR: [{ id: awbOrId }, { awbNumber: awbOrId }] },
    });
    if (!shipment)
      throw new BusinessException('Shipment not found', 'DTDC_003');
    if (shipment.status === 'CANCELLED') {
      throw new BusinessException('Shipment already cancelled', 'DTDC_004');
    }
    const updated = await this.prisma.dtdcShipment.update({
      where: { id: shipment.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        rawResponse: {
          ...(typeof shipment.rawResponse === 'object' && shipment.rawResponse
            ? shipment.rawResponse
            : {}),
          cancelReason: dto.reason ?? 'Cancelled by admin',
        },
      },
    });
    await this.auditService.log({
      action: 'DTDC_SHIPMENT_CANCELLED',
      module: 'dtdc',
      resource: 'dtdc_shipment',
      resourceId: shipment.id,
      userId,
      newValue: { reason: dto.reason },
    });
    return updated;
  }

  async listByOrder(orderId: string) {
    return this.prisma.dtdcShipment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
