import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
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
  OpenPosShiftDto,
  ClosePosShiftDto,
  DEFAULT_TERMINAL_ID,
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

    const availableStock = variantMatch.inventory
      ? Math.max(
          0,
          variantMatch.inventory.availableQuantity -
            (variantMatch.inventory.reservedQuantity ?? 0),
        )
      : 0;
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
    // Idempotent replay: an offline sale can be retried (e.g. the network
    // dropped after the server committed but before the client saw the
    // response). Detect that by the client-supplied order number and
    // return the existing order instead of creating a duplicate.
    if (dto.clientOrderNumber) {
      const existing = await this.repository.findOrderByOrderNumber(
        dto.clientOrderNumber,
      );
      if (existing) {
        return {
          success: true,
          message: 'POS Sale completed successfully',
          order: {
            orderId: existing.id,
            orderNumber: existing.orderNumber,
            channel: existing.channel,
            paymentMethod: existing.paymentMethod,
            status: existing.status,
            grandTotal: Number(existing.grandTotal),
            itemsCount: existing.items.length,
            createdAt: existing.createdAt,
          },
          printReady: true,
        };
      }
    }

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

    // A sale is attributed to a shift by terminalId + time window, so a sale
    // billed with no shift open falls outside every X/Z report and its cash
    // is never expected at close -- the drawer comes up over and nobody can
    // say why. This rule used to live only in the web POS screen, which left
    // the mobile app and any direct API call free to bill without one. It
    // belongs here, on the path all of them share.
    //
    // Offline sales stay exempt: shift state cannot be checked without the
    // backend, and refusing to bill during an outage defeats the offline
    // queue. Those replay through isOfflineSync.
    if (!dto.isOfflineSync) {
      const terminalId = dto.terminalId || DEFAULT_TERMINAL_ID;
      const openShift = await this.repository.findOpenShift(
        cashierId,
        terminalId,
      );
      if (!openShift) {
        throw new BusinessException(
          `No open shift on ${terminalId}. Open a shift before billing so cash sales can be reconciled at close.`,
          'POS_SHIFT_REQUIRED',
        );
      }
    }

    // Offline sync: stock may have moved while this terminal was
    // disconnected (another terminal or the online store could have sold
    // the same variant in the meantime). Validate before creating the
    // order instead of letting inventory go negative silently.
    if (dto.isOfflineSync) {
      const variantIds = itemsToProcess
        .map((i) => i.variantId)
        .filter((id): id is string => Boolean(id));
      const inventoryMap =
        await this.repository.findInventoryQuantities(variantIds);
      const shortages = itemsToProcess
        .filter((i) => i.variantId)
        .map((i) => {
          const inv = inventoryMap.get(i.variantId!);
          if (!inv || inv.allowBackorder) return null;
          if (inv.availableQuantity < i.quantity) {
            return {
              variantId: i.variantId!,
              productName: i.productName,
              variantTitle: i.variantTitle,
              requested: i.quantity,
              available: inv.availableQuantity,
            };
          }
          return null;
        })
        .filter((s): s is NonNullable<typeof s> => s !== null);

      if (shortages.length > 0) {
        throw new BusinessException(
          'Insufficient stock to sync this offline sale',
          'POS_STOCK_CONFLICT',
          { shortages },
        );
      }
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

    // 2. Generate unique order number (offline syncs replay the client's
    // own order number so retries hit the idempotent-replay path above
    // instead of creating a duplicate order)
    const orderNumber =
      dto.clientOrderNumber || (await this.workflow.generateOrderNumber());

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

    // 4. Deduct inventory immediately. deductInventory is atomic and
    // all-or-nothing (see order-workflow.service.ts), so a concurrent sale
    // that already claimed the stock makes this throw rather than let the
    // order go through with stock it doesn't actually have. The order row
    // was already committed by createPosOrder above, so on that failure we
    // compensate by cancelling it instead of leaving a confirmed sale with
    // no stock behind it, then surface the conflict to the terminal.
    try {
      await this.workflow.deductInventory(order.id, cashierId);
    } catch (err) {
      await this.workflow.transition(
        order.id,
        'CANCELLED',
        cashierId,
        'Auto-cancelled: insufficient stock at sale completion',
      );
      throw err;
    }

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

  async openShift(cashierId: string, dto: OpenPosShiftDto) {
    const existing = await this.repository.findOpenShift(
      cashierId,
      dto.terminalId,
    );
    if (existing) {
      throw new BadRequestException(
        `You already have an open shift on ${dto.terminalId} since ${existing.openedAt.toLocaleString()}. Close it before opening a new one.`,
      );
    }
    const shift = await this.repository.createShift({
      terminalId: dto.terminalId,
      cashierId,
      openingCash: dto.openingCash,
      notes: dto.notes,
    });
    await this.auditService.log({
      action: 'POS_SHIFT_OPENED',
      module: 'pos',
      resource: 'pos_shift',
      resourceId: shift.id,
      userId: cashierId,
      newValue: { terminalId: dto.terminalId, openingCash: dto.openingCash },
    });
    return shift;
  }

  async getCurrentShift(cashierId: string, terminalId?: string) {
    return this.repository.findOpenShift(cashierId, terminalId);
  }

  async closeShift(shiftId: string, cashierId: string, dto: ClosePosShiftDto) {
    const shift = await this.repository.findShiftById(shiftId);
    if (!shift) throw new NotFoundException('Shift not found');
    if (shift.status !== 'OPEN') {
      throw new BadRequestException('This shift is already closed');
    }

    const { cashSales, cashRefunds } =
      await this.repository.getCashMovementForWindow(
        shift.terminalId,
        shift.openedAt,
        new Date(),
      );
    const closingCashExpected =
      Number(shift.openingCash) + cashSales - cashRefunds;
    const variance = dto.closingCashCounted - closingCashExpected;

    const closed = await this.repository.closeShift(shiftId, {
      closingCashExpected,
      closingCashCounted: dto.closingCashCounted,
      variance,
      notes: dto.notes,
    });

    await this.auditService.log({
      action: 'POS_SHIFT_CLOSED',
      module: 'pos',
      resource: 'pos_shift',
      resourceId: shiftId,
      userId: cashierId,
      newValue: {
        closingCashExpected,
        closingCashCounted: dto.closingCashCounted,
        variance,
      },
    });

    return closed;
  }

  async listShifts(params: {
    page?: number;
    limit?: number;
    status?: string;
    terminalId?: string;
    cashierId?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const { data, total } = await this.repository.listShifts({
      page,
      limit,
      status: params.status,
      terminalId: params.terminalId,
      cashierId: params.cashierId,
    });
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
    };
  }

  async getShiftReport(shiftId: string) {
    const shift = await this.repository.findShiftById(shiftId);
    if (!shift) throw new NotFoundException('Shift not found');

    const windowEnd = shift.closedAt || new Date();
    const breakdown = await this.repository.getShiftSalesBreakdown(
      shift.terminalId,
      shift.openedAt,
      windowEnd,
    );

    return {
      shift,
      reportType: shift.status === 'OPEN' ? 'X_REPORT' : 'Z_REPORT',
      generatedAt: new Date(),
      windowStart: shift.openedAt,
      windowEnd,
      ...breakdown,
    };
  }

  async getPosDaySummary(dateStr?: string) {
    const date = dateStr ? new Date(dateStr) : new Date();
    const from = new Date(date);
    from.setHours(0, 0, 0, 0);
    const to = new Date(date);
    to.setHours(23, 59, 59, 999);
    return this.repository.getPosDaySummary(from, to);
  }
}
