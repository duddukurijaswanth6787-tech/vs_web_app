import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { PrismaService } from '@database/prisma.service';
import { ShippingRepository } from './shipping.repository';
import { generateCode128Svg } from './barcode.util';
import {
  CreateShippingMethodDto,
  CreateShippingZoneDto,
  CalculateShippingDto,
  BulkShippingLabelDto,
  ShippingMethodResponse,
  ShippingZoneResponse,
  ShippingCalculationResponse,
  BulkShippingLabelsResponse,
  ShippingLabelOrderData,
} from './shipping.types';

@Injectable()
export class ShippingService {
  constructor(
    private readonly shippingRepository: ShippingRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  private toMethodResponse(m: any): ShippingMethodResponse {
    return {
      id: m.id,
      name: m.name,
      code: m.code,
      description: m.description ?? undefined,
      estimatedDays: m.estimatedDays,
      isActive: m.isActive,
    };
  }

  private toZoneResponse(z: any): ShippingZoneResponse {
    return {
      id: z.id,
      methodId: z.methodId,
      name: z.name,
      countries: z.countries,
      states: z.states,
      rateType: z.rateType,
      rate: Number(z.rate),
      freeAbove: z.freeAbove ? Number(z.freeAbove) : undefined,
    };
  }

  async getMethods(): Promise<ShippingMethodResponse[]> {
    const methods = await this.shippingRepository.findMethods();
    return methods.map((m) => this.toMethodResponse(m));
  }

  async createMethod(
    dto: CreateShippingMethodDto,
    userId: string,
  ): Promise<ShippingMethodResponse> {
    const existing = await this.shippingRepository.findMethodByCode(dto.code);
    if (existing)
      throw new BusinessException(
        'Shipping method code already exists',
        'SHIPPING_001',
      );
    const method = await this.shippingRepository.createMethod({
      name: dto.name,
      code: dto.code,
      description: dto.description,
      estimatedDays: dto.estimatedDays,
    });
    await this.auditService.log({
      action: 'SHIPPING_METHOD_CREATED',
      module: 'shipping',
      resource: 'shipping_method',
      resourceId: method.id,
      userId,
      newValue: { name: dto.name, code: dto.code },
    });
    return this.toMethodResponse(method);
  }

  async getZones(methodId: string): Promise<ShippingZoneResponse[]> {
    const zones = await this.shippingRepository.findZones(methodId);
    return zones.map((z) => this.toZoneResponse(z));
  }

  async createZone(
    dto: CreateShippingZoneDto,
    userId: string,
  ): Promise<ShippingZoneResponse> {
    const method = await this.shippingRepository.findMethodById(dto.methodId);
    if (!method)
      throw new BusinessException('Shipping method not found', 'SHIPPING_002');
    const zone = await this.shippingRepository.createZone({
      method: { connect: { id: dto.methodId } },
      name: dto.name,
      countries: dto.countries,
      states: dto.states,
      pincodes: dto.pincodes,
      rateType: dto.rateType,
      rate: dto.rate,
      freeAbove: dto.freeAbove,
      maxWeight: dto.maxWeight,
    });
    await this.auditService.log({
      action: 'SHIPPING_ZONE_CREATED',
      module: 'shipping',
      resource: 'shipping_zone',
      resourceId: zone.id,
      userId,
      newValue: { name: dto.name, methodId: dto.methodId },
    });
    return this.toZoneResponse(zone);
  }

  async calculateShipping(
    dto: CalculateShippingDto,
  ): Promise<ShippingCalculationResponse> {
    const method = await this.shippingRepository.findMethodByCode(
      dto.methodCode,
    );
    if (!method)
      throw new BusinessException('Shipping method not found', 'SHIPPING_002');
    const zone = await this.shippingRepository.findMatchingZone(
      method.id,
      dto.country,
      dto.state,
      dto.pincode,
    );
    if (!zone)
      throw new BusinessException(
        'No shipping zone found for the given location',
        'SHIPPING_003',
      );

    let rate = Number(zone.rate);
    let freeShipping = false;

    if (zone.rateType === 'WEIGHT' && dto.weight) {
      rate = rate * dto.weight;
    }

    if (
      zone.freeAbove &&
      dto.orderAmount &&
      dto.orderAmount >= Number(zone.freeAbove)
    ) {
      rate = 0;
      freeShipping = true;
    }

    return {
      methodCode: method.code,
      methodName: method.name,
      rate,
      estimatedDelivery: method.estimatedDays,
      freeShipping,
    };
  }

  async getEstimatedDelivery(methodCode: string): Promise<string> {
    const method = await this.shippingRepository.findMethodByCode(methodCode);
    if (!method)
      throw new BusinessException('Shipping method not found', 'SHIPPING_002');
    return method.estimatedDays;
  }

  /**
   * Bulk generate thermal 4x6 / A4 shipping barcode labels for selected orders
   */
  async generateBulkShippingLabels(
    dto: BulkShippingLabelDto,
  ): Promise<BulkShippingLabelsResponse> {
    const { orderIds, format = '4x6' } = dto;
    if (!orderIds || !orderIds.length) {
      throw new BusinessException('At least one order ID is required', 'SHIPPING_004');
    }

    const orders = await this.prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        customer: {
          include: {
            user: true,
          },
        },
        addresses: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!orders.length) {
      throw new BusinessException('No valid orders found for label generation', 'SHIPPING_005');
    }

    const defaultSender = {
      name: "Vasanthi's Signature",
      address: 'Plot 42, Road No 36, Jubilee Hills, Hyderabad, Telangana - 500033',
      phone: '+91 98765 43210',
      gstin: '36ABCDE1234F1Z5',
    };

    const labelOrders: ShippingLabelOrderData[] = orders.map((o) => {
      const shippingAddress =
        o.addresses.find((a) => a.addressType === 'SHIPPING') ||
        o.addresses[0] ||
        null;

      const custName =
        shippingAddress?.fullName ||
        `${o.customer?.user?.firstName || ''} ${o.customer?.user?.lastName || ''}`.trim() ||
        'Customer';

      const custPhone =
        shippingAddress?.phone ||
        o.customer?.phone ||
        o.customer?.user?.phone ||
        '+91 00000 00000';

      const isCod =
        o.paymentMethod === 'CASH' ||
        o.paymentMethod === 'PAY_ON_DELIVERY' ||
        o.payments?.[0]?.paymentMethod === 'CASH' ||
        o.payments?.[0]?.paymentMethod === 'PAY_ON_DELIVERY';

      const totalAmount = Number(o.grandTotal);
      const waybillNumber =
        o.waybillNumber ||
        `DEL${o.orderNumber.replace(/[^0-9]/g, '').slice(-9).padStart(9, '1') || Date.now().toString().slice(-9)}`;

      const courierPartner = o.courierPartner || 'Delhivery Surface / Express';

      const items = o.items.map((it) => ({
        sku: it.sku || it.product?.sku || 'SKU-GEN',
        name: it.productName || it.product?.name || 'Item',
        variant: it.variantTitle || it.variant?.title || undefined,
        quantity: it.quantity,
        price: Number(it.unitPrice),
      }));

      const totalWeightGrams = 500 * Math.max(1, o.items.length);
      const barcodeSvg = generateCode128Svg(waybillNumber, { height: 42, barWidth: 1.8, includeText: true });

      return {
        orderId: o.id,
        orderNumber: o.orderNumber,
        orderDate: o.createdAt.toISOString().split('T')[0],
        waybillNumber,
        courierPartner,
        paymentMode: isCod ? 'COD' : 'PREPAID',
        codAmount: isCod ? totalAmount : 0,
        totalAmount,
        recipient: {
          name: custName,
          phone: custPhone,
          addressLine1: shippingAddress?.addressLine1 || 'Store Pickup / Counter Sale',
          addressLine2: shippingAddress?.addressLine2 || undefined,
          city: shippingAddress?.city || 'Hyderabad',
          state: shippingAddress?.state || 'Telangana',
          postalCode: shippingAddress?.postalCode || '500001',
          landmark: shippingAddress?.landmark || undefined,
        },
        sender: defaultSender,
        items,
        totalWeightGrams,
        barcodeSvg,
      };
    });

    const html = this.buildPrintableLabelsHtml(labelOrders, format);

    return {
      count: labelOrders.length,
      format,
      orders: labelOrders,
      html,
    };
  }

  private buildPrintableLabelsHtml(
    labels: ShippingLabelOrderData[],
    format: '4x6' | 'A4',
  ): string {
    const isThermal = format === '4x6';

    const labelPages = labels
      .map(
        (lbl, idx) => `
      <div class="label-box">
        <!-- Header -->
        <div class="label-header">
          <div class="brand">
            <div class="brand-title">${lbl.sender.name.toUpperCase()}</div>
            <div class="brand-sub">${lbl.courierPartner}</div>
          </div>
          <div class="routing-box">
            <div class="routing-city">${lbl.recipient.city.toUpperCase()}</div>
            <div class="routing-pin">${lbl.recipient.postalCode}</div>
          </div>
        </div>

        <!-- AWB Barcode Box -->
        <div class="barcode-container">
          ${lbl.barcodeSvg}
        </div>

        <!-- Meta Grid -->
        <div class="meta-row">
          <div class="meta-col">
            <span class="lbl-dim">Order Number:</span>
            <span class="lbl-val font-mono">${lbl.orderNumber}</span>
          </div>
          <div class="meta-col">
            <span class="lbl-dim">Order Date:</span>
            <span class="lbl-val">${lbl.orderDate}</span>
          </div>
          <div class="meta-col text-right">
            <span class="lbl-dim">Weight:</span>
            <span class="lbl-val">${lbl.totalWeightGrams}g</span>
          </div>
        </div>

        <!-- Payment Mode Box -->
        <div class="payment-banner ${lbl.paymentMode === 'COD' ? 'cod' : 'prepaid'}">
          ${
            lbl.paymentMode === 'COD'
              ? `COLLECT CASH ON DELIVERY: ₹${lbl.codAmount.toLocaleString('en-IN')}`
              : `PREPAID - DO NOT COLLECT CASH (Total: ₹${lbl.totalAmount.toLocaleString('en-IN')})`
          }
        </div>

        <!-- Addresses Box -->
        <div class="address-section">
          <div class="deliver-to">
            <div class="section-badge">DELIVER TO (RECIPIENT):</div>
            <div class="cust-name">${lbl.recipient.name}</div>
            <div class="cust-address">
              ${lbl.recipient.addressLine1}
              ${lbl.recipient.addressLine2 ? `<br>${lbl.recipient.addressLine2}` : ''}
              ${lbl.recipient.landmark ? `<br>Landmark: ${lbl.recipient.landmark}` : ''}
              <br><strong>${lbl.recipient.city}, ${lbl.recipient.state} - ${lbl.recipient.postalCode}</strong>
            </div>
            <div class="cust-phone"><strong>Phone:</strong> ${lbl.recipient.phone}</div>
          </div>

          <div class="return-to">
            <div class="section-badge">RETURN / DISPATCHED FROM:</div>
            <div class="sender-name">${lbl.sender.name}</div>
            <div class="sender-address">${lbl.sender.address}</div>
            <div class="sender-meta">Phone: ${lbl.sender.phone} | GSTIN: ${lbl.sender.gstin}</div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="items-table-container">
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 20%;">SKU</th>
                <th style="width: 55%;">Product Item</th>
                <th style="width: 10%; text-align: center;">Qty</th>
                <th style="width: 15%; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${lbl.items
                .map(
                  (it) => `
                <tr>
                  <td class="font-mono text-xs">${it.sku}</td>
                  <td>${it.name}${it.variant ? ` (${it.variant})` : ''}</td>
                  <td style="text-align: center;">${it.quantity}</td>
                  <td style="text-align: right;">₹${it.price.toLocaleString('en-IN')}</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div class="label-footer">
          <div>Package ${idx + 1} of ${labels.length}</div>
          <div>VASANTHISSIGNATURE.IN · OFFICIAL DISPATCH</div>
        </div>
      </div>
    `,
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Shipping Labels (${labels.length} Orders) - Vasanthi's Signature</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f0f0f0; padding: ${isThermal ? '0' : '20px'}; color: #000; }
    
    @page {
      size: ${isThermal ? '4in 6in' : 'A4 portrait'};
      margin: ${isThermal ? '0' : '10mm'};
    }

    @media print {
      body { background: #fff; padding: 0; }
      .no-print { display: none !important; }
      .label-box {
        page-break-after: always;
        break-after: page;
        box-shadow: none !important;
        border: 2px solid #000 !important;
        margin: 0 auto !important;
      }
    }

    .toolbar {
      max-width: 800px;
      margin: 0 auto 16px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #fff;
      padding: 12px 20px;
      border-radius: 10px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    .btn {
      background: #111;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      font-size: 13px;
    }
    .btn:hover { background: #333; }

    .labels-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .label-box {
      width: ${isThermal ? '3.85in' : '100%'};
      max-width: 500px;
      min-height: ${isThermal ? '5.8in' : 'auto'};
      background: #fff;
      border: 2px solid #000;
      padding: 12px;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-size: 11px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .label-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #000;
      padding-bottom: 6px;
    }
    .brand-title { font-size: 14px; font-weight: 900; letter-spacing: 0.5px; }
    .brand-sub { font-size: 10px; color: #444; font-weight: 600; margin-top: 2px; }
    .routing-box { text-align: right; }
    .routing-city { font-size: 16px; font-weight: 900; }
    .routing-pin { font-size: 14px; font-family: monospace; font-weight: bold; }

    .barcode-container {
      margin: 8px 0;
      text-align: center;
      border-bottom: 1px dashed #000;
      padding-bottom: 6px;
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      padding: 4px 0;
      border-bottom: 1px solid #000;
    }
    .meta-col { display: flex; flex-direction: column; }
    .lbl-dim { color: #555; font-size: 9px; }
    .lbl-val { font-weight: bold; }
    .font-mono { font-family: monospace; }
    .text-right { text-align: right; }

    .payment-banner {
      font-size: 11px;
      font-weight: 900;
      text-align: center;
      padding: 6px;
      margin: 6px 0;
      border: 2px solid #000;
      letter-spacing: 0.5px;
    }
    .payment-banner.cod { background: #000; color: #fff; }
    .payment-banner.prepaid { background: #eee; color: #000; }

    .address-section {
      border: 1px solid #000;
      margin-bottom: 6px;
    }
    .deliver-to {
      padding: 6px 8px;
      border-bottom: 1px dashed #000;
    }
    .return-to {
      padding: 6px 8px;
      background: #fafafa;
    }
    .section-badge {
      font-size: 8.5px;
      font-weight: 900;
      color: #555;
      margin-bottom: 2px;
      letter-spacing: 0.5px;
    }
    .cust-name { font-size: 12px; font-weight: bold; }
    .cust-address { font-size: 10.5px; line-height: 1.35; margin-top: 2px; }
    .cust-phone { font-size: 10.5px; margin-top: 3px; }
    .sender-name { font-size: 10.5px; font-weight: bold; }
    .sender-address { font-size: 9.5px; color: #333; line-height: 1.25; }
    .sender-meta { font-size: 9px; color: #555; margin-top: 2px; }

    .items-table-container {
      margin-bottom: 6px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
    }
    .items-table th {
      background: #eee;
      border-top: 1px solid #000;
      border-bottom: 1px solid #000;
      padding: 3px 4px;
      text-align: left;
    }
    .items-table td {
      padding: 3px 4px;
      border-bottom: 1px solid #eee;
    }

    .label-footer {
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      color: #555;
      border-top: 1px solid #000;
      padding-top: 4px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <div>
      <strong>Print Preview</strong>: ${labels.length} Shipping Labels (${isThermal ? '4x6 Thermal Label' : 'A4 Sheet'})
    </div>
    <div style="display:flex; gap:10px;">
      <button class="btn" onclick="window.print()">🖨️ Print Labels Now</button>
      <button class="btn" style="background:#555;" onclick="window.close()">Close Window</button>
    </div>
  </div>

  <div class="labels-wrapper">
    ${labelPages}
  </div>

  <script>
    window.onload = function() {
      // Auto-trigger print dialog if opened in popup
      if (window.opener) {
        setTimeout(function() { window.print(); }, 400);
      }
    };
  </script>
</body>
</html>`;
  }
}

