import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PosRepository } from './pos.repository';
import { PosGateway } from './pos.gateway';
import { BarcodeService } from './barcode.service';
import { PrinterService } from './printer.service';
import { OrderWorkflowService } from '@domains/order/order-workflow.service';
import { AuditService } from '@domains/audit/audit.service';
import { CheckoutSessionStatus } from '@prisma/client';
import {
  ScanBarcodeDto,
  CreateCheckoutSessionDto,
  AdoptHandoffTokenDto,
  CompletePosSaleDto,
  BarcodeScanResultResponse,
  CheckoutSessionResponse,
  GenerateBarcodeImageDto,
  GenerateBatchStickersDto,
  PreviewReceiptDto,
  PosCartItemDto,
  PosCustomerInfoDto,
} from './pos.types';

@Injectable()
export class PosService {
  constructor(
    private readonly repository: PosRepository,
    private readonly gateway: PosGateway,
    private readonly barcodeService: BarcodeService,
    private readonly printerService: PrinterService,
    private readonly workflow: OrderWorkflowService,
    private readonly auditService: AuditService,
  ) {}
  async scanBarcode(
    dto: ScanBarcodeDto,
    isOwnerOrManager = true,
  ): Promise<BarcodeScanResultResponse> {
    const variantMatch = await this.repository.findVariantByBarcode(
      dto.barcode,
    );

    if (!variantMatch) {
      throw new NotFoundException(
        `No product variant found for barcode or SKU "${dto.barcode}"`,
      );
    }

    const availableStock = variantMatch.inventory?.availableQuantity ?? 0;
    const price = Number(
      variantMatch.salePriceOverride ??
        variantMatch.priceOverride ??
        variantMatch.product?.basePrice ??
        0,
    );
    const costPrice = isOwnerOrManager
      ? Number(variantMatch.costPrice ?? variantMatch.product?.costPrice ?? 0)
      : undefined;

    const primaryImage =
      variantMatch.media && variantMatch.media.length > 0
        ? variantMatch.media[0].url
        : variantMatch.product?.media && variantMatch.product.media.length > 0
          ? variantMatch.product.media[0].url
          : undefined;

    const variantTitle =
      variantMatch.title ||
      (variantMatch.attributeValues
        ? variantMatch.attributeValues
            .map((av) => av.option?.label || av.value)
            .filter((val): val is string => Boolean(val))
            .join(' / ')
        : undefined);

    return {
      productId: variantMatch.productId,
      productName:
        variantMatch.product?.name || variantMatch.title || 'Product',
      variantId: variantMatch.id,
      sku: variantMatch.sku,
      barcode: variantMatch.barcode,
      variantTitle,
      price,
      costPrice,
      availableStock,
      primaryImage,
    };
  }

  async createCheckoutSession(
    cashierId: string,
    dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSessionResponse> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'Cannot create checkout session with empty cart items',
      );
    }

    const randomNum = Math.floor(100000 + Math.random() * 900000).toString();
    const sessionId = `SHOP-${new Date().getFullYear()}-${randomNum}`;
    const handoffToken = `${randomNum.slice(0, 3)}-${randomNum.slice(3)}`;

    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const taxTotal = dto.taxTotal || Math.round(subtotal * 0.05 * 100) / 100;
    const discountTotal = dto.discountTotal || 0;
    const grandTotal =
      Math.round((subtotal + taxTotal - discountTotal) * 100) / 100;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const session = await this.repository.createCheckoutSession(
      sessionId,
      handoffToken,
      cashierId,
      dto,
      subtotal,
      taxTotal,
      grandTotal,
      expiresAt,
    );

    const responsePayload: CheckoutSessionResponse = {
      id: session.id,
      sessionId: session.sessionId,
      handoffToken: session.handoffToken,
      status: session.status,
      subtotal: Number(session.subtotal),
      discountTotal: Number(session.discountTotal),
      taxTotal: Number(session.taxTotal),
      grandTotal: Number(session.grandTotal),
      items: dto.items,
      customer: dto.customer,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    };

    return responsePayload;
  }

  async adoptHandoffSession(
    dto: AdoptHandoffTokenDto,
  ): Promise<CheckoutSessionResponse> {
    const session = await this.repository.findCheckoutSessionByToken(
      dto.handoffToken,
    );

    if (!session) {
      throw new NotFoundException(
        `Invalid or expired handoff token: ${dto.handoffToken}`,
      );
    }

    if (session.expiresAt < new Date()) {
      await this.repository.updateCheckoutSessionStatus(
        session.sessionId,
        CheckoutSessionStatus.EXPIRED,
      );
      throw new BadRequestException(
        'Checkout session has expired. Please re-initiate from mobile.',
      );
    }

    if (
      session.status !== CheckoutSessionStatus.WAITING_FOR_WEB &&
      session.status !== CheckoutSessionStatus.IN_PROGRESS_ON_WEB
    ) {
      throw new BadRequestException(
        `Checkout session is already in state: ${session.status}`,
      );
    }

    const updated = await this.repository.updateCheckoutSessionStatus(
      session.sessionId,
      CheckoutSessionStatus.IN_PROGRESS_ON_WEB,
    );

    const sessionPayload = {
      id: updated.id,
      sessionId: updated.sessionId,
      handoffToken: updated.handoffToken,
      status: updated.status,
      subtotal: Number(updated.subtotal),
      discountTotal: Number(updated.discountTotal),
      taxTotal: Number(updated.taxTotal),
      grandTotal: Number(updated.grandTotal),
      items: updated.cart as unknown as PosCartItemDto[],
      customer:
        (updated.customer as unknown as PosCustomerInfoDto) || undefined,
      expiresAt: updated.expiresAt,
      createdAt: updated.createdAt,
    };

    // Broadcast to WebSocket clients waiting on this session
    this.gateway.emitSessionAdopted(updated.sessionId, sessionPayload);

    return sessionPayload;
  }

  async completeSale(cashierId: string, dto: CompletePosSaleDto) {
    let itemsToProcess = dto.items || [];
    let customerInfo = dto.customer;
    let discountTotal = dto.discountTotal || 0;
    let taxTotal = dto.taxTotal || 0;
    let activeSessionId: string | null = null;

    // If initiated from a CheckoutSession, load session details
    if (dto.sessionId) {
      const session = await this.repository.findCheckoutSessionById(
        dto.sessionId,
      );
      if (!session) {
        throw new NotFoundException(
          `Checkout session ${dto.sessionId} not found`,
        );
      }
      activeSessionId = session.sessionId;
      if (!itemsToProcess || itemsToProcess.length === 0) {
        itemsToProcess = session.cart as unknown as PosCartItemDto[];
      }
      if (!customerInfo && session.customer) {
        customerInfo =
          (session.customer as unknown as PosCustomerInfoDto) || undefined;
      }
      discountTotal = discountTotal || Number(session.discountTotal);
      taxTotal = taxTotal || Number(session.taxTotal);
    }

    if (!itemsToProcess || itemsToProcess.length === 0) {
      throw new BadRequestException(
        'Cannot complete POS sale with an empty cart',
      );
    }

    // 1. Get Walk-in Customer profile if none supplied
    const customerProfile = await this.repository.findOrCreateWalkInCustomer();

    const subtotal = itemsToProcess.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0,
    );
    const calculatedTax = taxTotal || Math.round(subtotal * 0.05 * 100) / 100;
    const grandTotal =
      Math.round((subtotal + calculatedTax - discountTotal) * 100) / 100;

    // 2. Generate unique order number
    const orderNumber = await this.workflow.generateOrderNumber();

    // 3. Create POS Order in DB
    const order = await this.repository.createPosOrder({
      orderNumber,
      customerId: customerProfile.id,
      cashierId,
      subtotal,
      discountTotal,
      taxTotal: calculatedTax,
      grandTotal,
      paymentMethod: dto.paymentMethod,
      terminalId: dto.terminalId,
      notes: dto.notes,
      items: itemsToProcess,
      customerInfo,
    });

    // 4. Deduct inventory & log STOCK_OUT movement immediately
    await this.workflow.deductInventory(order.id);

    // 5. Update CheckoutSession if active
    if (activeSessionId) {
      await this.repository.updateCheckoutSessionStatus(
        activeSessionId,
        CheckoutSessionStatus.COMPLETED,
        order.id,
      );
    }

    const saleResult = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      channel: order.channel,
      paymentMethod: order.paymentMethod,
      status: order.status,
      grandTotal: Number(order.grandTotal),
      itemsCount: order.items.length,
      createdAt: order.createdAt,
    };

    // 6. Broadcast Real-time Events (Sale Completed & Print Invoice)
    this.gateway.emitSaleCompleted(activeSessionId, saleResult);
    this.gateway.emitTriggerPrint(dto.terminalId || 'COUNTER_1', {
      orderNumber: order.orderNumber,
      grandTotal: Number(order.grandTotal),
      items: itemsToProcess,
      customer: customerInfo,
      paymentMethod: dto.paymentMethod,
      timestamp: new Date().toISOString(),
    });

    // 7. Audit log
    await this.auditService.log({
      action: 'POS_SALE_COMPLETED',
      module: 'pos',
      resource: 'order',
      resourceId: order.id,
      userId: cashierId,
      newValue: {
        orderNumber: order.orderNumber,
        grandTotal: order.grandTotal,
        paymentMethod: dto.paymentMethod,
      },
    });

    return {
      success: true,
      message: 'POS Sale completed successfully',
      order: saleResult,
      printReady: true,
    };
  }

  async lookupCustomer(phone: string) {
    const result = await this.repository.findCustomerByPhone(phone);
    if (!result) {
      return {
        found: false,
        phone: (phone || '').replace(/\D/g, '').slice(-10),
        message: 'No registered customer found for this phone number',
      };
    }
    return result;
  }

  async generateBarcodeImage(dto: GenerateBarcodeImageDto): Promise<Buffer> {
    return this.barcodeService.generateBarcodeBuffer(
      dto.code,
      dto.bcid || 'code128',
      dto.scale || 2,
      dto.height || 10,
    );
  }

  async generateBatchStickers(dto: GenerateBatchStickersDto) {
    const html = await this.barcodeService.generateBatchStickersHtml(dto);
    const tspl = this.printerService.buildTsplStickerLabel(dto);
    return {
      quantity: dto.quantity,
      barcode: dto.barcode,
      sku: dto.sku,
      html,
      tspl,
    };
  }

  async previewReceipt(dto: PreviewReceiptDto) {
    const html = await this.printerService.generateHtmlInvoiceReceipt(dto);
    const escposBuffer = await this.printerService.buildEscPosInvoiceReceipt(dto);
    return {
      orderNumber: dto.orderNumber,
      html,
      escposBase64: escposBuffer.toString('base64'),
    };
  }
}
