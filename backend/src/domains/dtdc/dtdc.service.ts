import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { CreateDtdcShipmentDto, CancelDtdcShipmentDto } from './dtdc.types';

@Injectable()
export class DtdcService {
  constructor(
    private readonly prisma: PrismaService,
    _configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async createShipment(_dto: CreateDtdcShipmentDto, _userId: string) {
    throw new BusinessException(
      'Automatic DTDC booking is not connected. Book with the courier and record its real waybill on the order.',
      'DTDC_NOT_CONFIGURED',
    );
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
