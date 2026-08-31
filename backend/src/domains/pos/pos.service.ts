import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { PosRepository } from './pos.repository';
import { computePosTotals } from './pos-totals';
import { allocateTenders } from './pos-tenders';
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
  PosCashMovementDto,
  CreatePosReturnDto,
  PosRefundMethodType,
} from './pos.types';

@Injectable()
export class PosService {
  private readonly logger = new Logger(PosService.name);

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
    // Defaults to withholding cost price: a caller that has not said who it
    // is does not get margin data.
    isOwnerOrManager = false,
  ): Promise<BarcodeScanResultResponse> {
    const variantMatch = await this.repository.findVariantByBarcode(
      dto.barcode,
    );

    if (!variantMatch) {
      throw new NotFoundException(
        `No product variant found for barcode or SKU "${dto.barcode}"`,
      );
    }

    return this.toScanResult(variantMatch, isOwnerOrManager);
  }

  /**
   * Builds a scan result from a variant row.
   *
   * Shared by the barcode scan and the name search so stock, price and the GST
   * rate are derived once. A second mapping is where the flat-5% bug would
   * come back.
   */
  private toScanResult(
    variantMatch: any,
    isOwnerOrManager: boolean,
  ): BarcodeScanResultResponse {
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
            .map((av: any) => av.option?.label || av.value)
            .filter((val: unknown): val is string => Boolean(val))
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
      // The till used to hardcode 5% GST because the scan never told it the
      // real rate. The shop already sets this per product and the online
      // checkout already honours it; now the counter can too.
      taxPercent: Number(variantMatch.product?.taxPercentage ?? 0),
      // MRP for the printed tag. There is no separate mrp column: basePrice is
      // the list price and salePrice the discounted one, so basePrice is what
      // a customer would be charged without an offer.
      mrp: Number(variantMatch.product?.basePrice ?? price),
      // Required on a GST invoice.
      hsnCode: variantMatch.product?.hsnCode ?? undefined,
    };
  }

  /**
   * Finds sellable items by typed name or SKU, for the till's search box.
   *
   * The counter could only add a product by scanning it, so an item whose
   * sticker had peeled off could not be sold at all.
   */
  async searchProducts(
    query: string,
    isOwnerOrManager = false,
    limit = 10,
  ): Promise<BarcodeScanResultResponse[]> {
    const rows = await this.repository.searchVariantsByName(query, limit);
    return rows.map((row) => this.toScanResult(row, isOwnerOrManager));
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

    // Priced from each product's own GST rate, like the sale it becomes. A
    // handoff session that quoted a flat 5% would show the customer one figure
    // on the phone and charge another at the till.
    const sessionTaxRates = await this.repository.findProductTaxRates(
      dto.items.map((i) => i.productId).filter(Boolean),
    );
    const sessionTotals = computePosTotals(
      dto.items.map((item) => ({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount,
        taxPercent: sessionTaxRates.get(item.productId) ?? 0,
      })),
      dto.discountTotal || 0,
    );
    const subtotal = sessionTotals.subtotal;
    const taxTotal = sessionTotals.taxTotal;
    const grandTotal = sessionTotals.grandTotal;
    // A phone handoff is picked up in a minute or two; a cart parked at the
    // counter has to survive until the customer comes back from trying
    // something on, so it gets the rest of the trading day.
    const expiresAt = new Date(
      Date.now() + (dto.hold ? 12 * 60 : 30) * 60 * 1000,
    );

    const session = await this.repository.createCheckoutSession(
      sessionId,
      handoffToken,
      cashierId,
      dto,
      subtotal,
      taxTotal,
      grandTotal,
      expiresAt,
      dto.hold
        ? CheckoutSessionStatus.DRAFT
        : CheckoutSessionStatus.WAITING_FOR_WEB,
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
      session.status !== CheckoutSessionStatus.IN_PROGRESS_ON_WEB &&
      // A cart parked at the till is resumed through this same path.
      session.status !== CheckoutSessionStatus.DRAFT
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

  /** Carts parked at this till, newest first, for the counter to pick back up. */
  async listHeldSessions(deviceId?: string) {
    const sessions = await this.repository.findHeldSessions(deviceId);
    return sessions.map((session) => ({
      sessionId: session.sessionId,
      handoffToken: session.handoffToken,
      deviceId: session.deviceId,
      customer: session.customer as unknown as PosCustomerInfoDto | undefined,
      itemsCount: Array.isArray(session.cart) ? session.cart.length : 0,
      grandTotal: Number(session.grandTotal),
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    }));
  }

  /** Drop a parked cart the customer never came back for. */
  async cancelHeldSession(sessionId: string) {
    const session = await this.repository.findCheckoutSessionById(sessionId);
    if (!session) {
      throw new NotFoundException(`No held cart found for ${sessionId}`);
    }
    if (session.status === CheckoutSessionStatus.COMPLETED) {
      throw new BadRequestException(
        `${sessionId} has already been billed and cannot be discarded.`,
      );
    }
    await this.repository.updateCheckoutSessionStatus(
      sessionId,
      CheckoutSessionStatus.CANCELLED,
    );
    return { success: true, sessionId };
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
            // Change was already handed over when this sale first went
            // through; a replay must not tell the till to open the drawer.
            changeDue: 0,
            tenders: undefined,
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
      // Checked against the terminal, not the cashier, because that is how
      // the takings are counted: the cash goes into this register's drawer
      // whoever rang it up. A cashier covering a register someone else opened
      // is billing into a real, reconciled shift.
      const openShift =
        await this.repository.findOpenShiftForTerminal(terminalId);
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

    // GST is worked out here, from the rate on each product, rather than
    // trusting whatever the till sent. Two reasons: a client that computes its
    // own tax can be wrong or tampered with, and the mobile app already
    // installed on the shop's phones still sends a flat 5% -- recomputing
    // server-side corrects those bills without waiting for a new APK.
    const taxRates = await this.repository.findProductTaxRates(
      itemsToProcess.map((i) => i.productId).filter(Boolean),
    );
    const totals = computePosTotals(
      itemsToProcess.map((i) => ({
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discountAmount: i.discountAmount,
        taxPercent: taxRates.get(i.productId) ?? 0,
      })),
      discountTotal,
    );
    const subtotal = totals.subtotal;
    const calculatedTax = totals.taxTotal;
    const grandTotal = totals.grandTotal;
    discountTotal = totals.discountTotal;

    if (taxTotal && Math.abs(taxTotal - calculatedTax) > 0.01) {
      this.logger.warn(
        `Till sent tax ${taxTotal} but the products' own rates give ${calculatedTax}; billing the calculated figure.`,
      );
    }

    // Split tenders are validated against the total the server just worked
    // out, never the one the till sent -- otherwise a tampered payload could
    // settle a Rs.5000 bill with Rs.100 of tenders.
    let tenderAllocations:
      | { method: string; amount: number }[]
      | undefined;
    let changeDue = 0;
    if (dto.splitPayments?.length) {
      try {
        const split = allocateTenders(dto.splitPayments, grandTotal);
        tenderAllocations = split.allocations;
        changeDue = split.changeDue;
      } catch (err) {
        throw new BadRequestException(
          err instanceof Error ? err.message : 'Invalid split payment',
        );
      }
    }

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
      payments: tenderAllocations,
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
      // Only ever non-zero on a split bill; the single-tender path works its
      // own change out at the till.
      changeDue,
      tenders: tenderAllocations,
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

  /**
   * Rebuilds the original receipt for a past sale, marked "DUPLICATE COPY".
   *
   * Loads the order rather than trusting the till to re-send line data --
   * that would let a tampered replay produce a "receipt" with new items.
   * Every reprint is audit-logged: an untraceable reprint is a well-known
   * way to backdate GST invoices.
   */
  async reprintReceipt(orderNumber: string, cashierId: string) {
    const order = await this.repository.findOrderForReprint(orderNumber);
    if (!order) {
      throw new NotFoundException(
        `No sale found for order number ${orderNumber}`,
      );
    }
    if (order.channel !== 'POS_SHOPORA') {
      throw new BadRequestException(
        `${orderNumber} is a ${order.channel} order, not a POS sale, so it has no over-the-counter receipt to reprint.`,
      );
    }

    const shipping = order.addresses?.find((a) => a.addressType === 'SHIPPING');
    // Prefer the first payment method as "the" payment method for the header;
    // a split bill shows every tender in the payments list below the total.
    const primaryPayment = order.payments?.[0];

    const dto: PreviewReceiptDto = {
      orderNumber: order.orderNumber,
      grandTotal: Number(order.grandTotal),
      discountTotal: Number(order.discountTotal),
      taxTotal: Number(order.taxTotal),
      paymentMethod: (primaryPayment?.method || order.paymentMethod) ?? 'CASH',
      isReprint: true,
      items: order.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        variantId: i.variantId ?? undefined,
        sku: i.sku,
        variantTitle: i.variantTitle ?? undefined,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        discountAmount: Number(i.discountAmount),
        taxAmount: Number(i.taxAmount),
      })),
      customer: shipping
        ? {
            fullName: shipping.fullName,
            phone: shipping.phone,
            state: shipping.state,
          }
        : undefined,
    };

    const [html, escpos] = await Promise.all([
      this.printerService.generateHtmlInvoiceReceipt(dto),
      this.printerService.buildEscPosInvoiceReceipt(dto),
    ]);

    await this.auditService.log({
      action: 'POS_RECEIPT_REPRINTED',
      module: 'pos',
      resource: 'order',
      resourceId: order.id,
      userId: cashierId,
      newValue: { orderNumber: order.orderNumber },
    });

    return {
      orderNumber: order.orderNumber,
      html,
      escposBase64: escpos.toString('base64'),
    };
  }

  async previewReceipt(dto: PreviewReceiptDto) {
    const html = await this.printerService.generateHtmlInvoiceReceipt(dto);
    const escposBuffer =
      await this.printerService.buildEscPosInvoiceReceipt(dto);
    return {
      orderNumber: dto.orderNumber,
      html,
      escposBase64: escposBuffer.toString('base64'),
    };
  }

  /**
   * A past sale, with each line's returnable quantity worked out, so the till
   * can show what is actually still takeable back.
   */
  async lookupSaleForReturn(orderNumber: string) {
    const found = await this.repository.findSaleForReturn(orderNumber.trim());
    if (!found) {
      throw new NotFoundException(`No sale found for ${orderNumber}`);
    }

    const { order, returnedByItem } = found;
    if (order.channel !== 'POS_SHOPORA') {
      // A refund is tied to a drawer through its order's terminal, and an
      // online order has no terminal -- paying that out at the till would
      // take cash the shift never expects to be missing.
      throw new BusinessException(
        `${orderNumber} was not sold in store. Online orders are returned through Admin → Returns.`,
        'POS_RETURN_NOT_IN_STORE',
      );
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      soldAt: order.createdAt,
      paymentMethod: order.paymentMethod,
      grandTotal: Number(order.grandTotal),
      customerPhone: order.customer?.phone ?? undefined,
      items: order.items.map((i) => {
        const returned = returnedByItem.get(i.id) ?? 0;
        return {
          orderItemId: i.id,
          productName: i.productName,
          variantTitle: i.variantTitle ?? undefined,
          sku: i.sku,
          quantity: i.quantity,
          alreadyReturned: returned,
          returnableQuantity: Math.max(i.quantity - returned, 0),
          unitRefund: this.unitRefundValue(i),
        };
      }),
    };
  }

  /**
   * What one unit of a line is worth back to the customer.
   *
   * Taken from the line's own totals rather than the list price, so a
   * discount given at the till is not refunded as if it had been paid, and
   * tax collected on the line does go back.
   */
  private unitRefundValue(item: {
    quantity: number;
    unitPrice: any;
    discountAmount: any;
    taxAmount: any;
  }): number {
    if (item.quantity <= 0) return 0;
    const lineTotal =
      Number(item.unitPrice) * item.quantity -
      Number(item.discountAmount ?? 0) +
      Number(item.taxAmount ?? 0);
    return Math.max(lineTotal / item.quantity, 0);
  }

  /**
   * Takes goods back over the counter: restocks them, refunds the customer,
   * and records both against the register so the drawer still reconciles.
   */
  async createReturn(cashierId: string, dto: CreatePosReturnDto) {
    const found = await this.repository.findSaleForReturn(
      dto.orderNumber.trim(),
    );
    if (!found) {
      throw new NotFoundException(`No sale found for ${dto.orderNumber}`);
    }
    const { order, returnedByItem } = found;

    if (order.channel !== 'POS_SHOPORA') {
      throw new BusinessException(
        `${dto.orderNumber} was not sold in store. Online orders are returned through Admin → Returns.`,
        'POS_RETURN_NOT_IN_STORE',
      );
    }

    const terminalId = dto.terminalId || DEFAULT_TERMINAL_ID;
    // Cash for a refund comes out of a drawer, so there has to be an open
    // shift to take it from -- otherwise the payout lands outside every
    // report and the drawer reads short at close with nothing to explain it.
    const openShift =
      await this.repository.findOpenShiftForTerminal(terminalId);
    if (!openShift) {
      throw new BusinessException(
        `No open shift on ${terminalId}. Open a shift before refunding so the payout is reconciled at close.`,
        'POS_SHIFT_REQUIRED',
      );
    }

    const itemsById = new Map(order.items.map((i) => [i.id, i]));
    const priced: {
      orderItemId: string;
      variantId: string | null;
      quantity: number;
    }[] = [];
    let refundAmount = 0;

    for (const line of dto.items) {
      const item = itemsById.get(line.orderItemId);
      if (!item) {
        throw new BusinessException(
          `Item ${line.orderItemId} is not part of ${order.orderNumber}`,
          'POS_RETURN_ITEM_NOT_ON_SALE',
        );
      }
      const returnable = item.quantity - (returnedByItem.get(item.id) ?? 0);
      if (line.quantity > returnable) {
        // Without this the same item could be refunded repeatedly, paying out
        // more than the customer ever handed over.
        throw new BusinessException(
          `Only ${returnable} of ${item.productName} can still be returned on ${order.orderNumber}`,
          'POS_RETURN_QUANTITY_EXCEEDED',
        );
      }
      refundAmount += this.unitRefundValue(item) * line.quantity;
      priced.push({
        orderItemId: item.id,
        variantId: item.variantId,
        quantity: line.quantity,
      });
    }

    if (priced.length === 0) {
      throw new BusinessException(
        'Select at least one item to return',
        'POS_RETURN_EMPTY',
      );
    }

    const payment = order.payments[0];
    if (!payment) {
      throw new BusinessException(
        `No payment recorded against ${order.orderNumber}, so there is nothing to refund`,
        'POS_RETURN_NO_PAYMENT',
      );
    }

    let refundMethod: string = dto.refundMethod;
    if (dto.refundMethod === PosRefundMethodType.ORIGINAL) {
      if (!order.paymentMethod) {
        // The drawer is reconciled from the refund's method, so guessing here
        // would either take cash the shift never expects to be missing or
        // hide a payout that did leave the till. Make the cashier say.
        throw new BusinessException(
          `${order.orderNumber} has no recorded payment method. Choose how to refund instead.`,
          'POS_RETURN_METHOD_UNKNOWN',
        );
      }
      refundMethod = order.paymentMethod;
    }

    const stamp = Date.now().toString(36).toUpperCase();
    const { returnRequest, refund } = await this.repository.createPosReturn({
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: payment.id,
      returnNumber: `RET-${order.orderNumber}-${stamp}`,
      refundNumber: `REF-${order.orderNumber}-${stamp}`,
      reason: dto.reason,
      notes: dto.notes,
      refundMethod,
      refundAmount: Math.round(refundAmount * 100) / 100,
      cashierId,
      items: priced,
      restock: (tx) =>
        this.workflow.restockReturnedItems(tx, {
          orderId: order.id,
          orderNumber: order.orderNumber,
          items: priced,
          userId: cashierId,
          reason: `Returned at ${terminalId} against ${order.orderNumber}`,
        }),
    });

    await this.auditService.log({
      action: 'POS_RETURN_COMPLETED',
      module: 'pos',
      resource: 'return_request',
      resourceId: returnRequest.id,
      userId: cashierId,
      newValue: {
        orderNumber: order.orderNumber,
        terminalId,
        shiftId: openShift.id,
        refundMethod,
        refundAmount: Number(refund.amount),
        items: priced,
      },
    });

    return {
      success: true,
      returnNumber: returnRequest.returnNumber,
      refundNumber: refund.refundNumber,
      refundMethod,
      refundAmount: Number(refund.amount),
      orderNumber: order.orderNumber,
      terminalId,
      itemsReturned: priced.reduce((sum, i) => sum + i.quantity, 0),
    };
  }

  async openShift(cashierId: string, dto: OpenPosShiftDto) {
    // One open shift per terminal, whoever opened it. A shift's takings are
    // every POS sale on its terminal within its window, so two overlapping
    // shifts on one terminal would each be charged with the other's sales and
    // both drawers would read over.
    const existing = await this.repository.findOpenShiftForTerminal(
      dto.terminalId,
    );
    if (existing) {
      const mine = existing.cashierId === cashierId;
      const who = mine
        ? 'You already have'
        : `${[existing.cashier?.firstName, existing.cashier?.lastName].filter(Boolean).join(' ') || 'Another cashier'} already has`;
      throw new BadRequestException(
        `${who} an open shift on ${dto.terminalId} since ${existing.openedAt.toLocaleString()}. Close it before opening a new one.`,
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

  /**
   * Records cash moved in or out of the open drawer at a terminal.
   *
   * Tied to the shift rather than the terminal so the movement lands in the
   * count the cashier who made it has to answer for at close.
   */
  async recordCashMovement(
    cashierId: string,
    terminalId: string,
    dto: PosCashMovementDto,
  ) {
    const shift = await this.repository.findOpenShiftForTerminal(
      terminalId || DEFAULT_TERMINAL_ID,
    );
    if (!shift) {
      throw new BadRequestException(
        'No shift is open at this terminal, so there is no drawer to move cash in or out of.',
      );
    }

    const amount = Math.round((Number(dto.amount) || 0) * 100) / 100;
    if (amount <= 0) {
      throw new BadRequestException('Cash movement amount must be positive.');
    }

    const movement = await this.repository.createCashMovement({
      shiftId: shift.id,
      terminalId: shift.terminalId,
      cashierId,
      direction: dto.direction,
      amount,
      reason: dto.reason.trim(),
    });

    await this.auditService.log({
      action: 'POS_CASH_MOVEMENT',
      module: 'pos',
      resource: 'pos_shift',
      resourceId: shift.id,
      userId: cashierId,
      newValue: {
        direction: dto.direction,
        amount,
        reason: dto.reason,
        terminalId: shift.terminalId,
      },
    });

    const totals = await this.repository.sumCashMovementsForShift(shift.id);
    return {
      id: movement.id,
      shiftId: shift.id,
      direction: movement.direction,
      amount: Number(movement.amount),
      reason: movement.reason,
      createdAt: movement.createdAt,
      shiftTotals: totals,
    };
  }

  /** Every drawer movement recorded against a shift, newest first. */
  async listCashMovements(shiftId: string) {
    const movements =
      await this.repository.findCashMovementsForShift(shiftId);
    const totals = await this.repository.sumCashMovementsForShift(shiftId);
    return {
      movements: movements.map((m) => ({
        id: m.id,
        direction: m.direction,
        amount: Number(m.amount),
        reason: m.reason,
        createdAt: m.createdAt,
      })),
      ...totals,
    };
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
    // Petty cash paid out and floats added in move the drawer just as much as
    // a sale does. Leaving them out made every such shift close on a variance
    // the cashier could not explain.
    const { cashIn, cashOut } = await this.repository.sumCashMovementsForShift(
      shift.id,
    );
    const closingCashExpected =
      Number(shift.openingCash) + cashSales - cashRefunds + cashIn - cashOut;
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
    const [breakdown, cashMovements, cashFromSales] = await Promise.all([
      this.repository.getShiftSalesBreakdown(
        shift.terminalId,
        shift.openedAt,
        windowEnd,
      ),
      this.repository.sumCashMovementsForShift(shift.id),
      this.repository.getCashMovementForWindow(
        shift.terminalId,
        shift.openedAt,
        windowEnd,
      ),
    ]);

    // What the drawer should hold right now, by the same arithmetic the close
    // uses -- so the cashier can check the count before committing to it.
    const expectedCash =
      Number(shift.openingCash) +
      cashFromSales.cashSales -
      cashFromSales.cashRefunds +
      cashMovements.cashIn -
      cashMovements.cashOut;

    return {
      shift,
      reportType: shift.status === 'OPEN' ? 'X_REPORT' : 'Z_REPORT',
      generatedAt: new Date(),
      windowStart: shift.openedAt,
      windowEnd,
      openingCash: Number(shift.openingCash),
      cashSales: cashFromSales.cashSales,
      cashRefunds: cashFromSales.cashRefunds,
      cashIn: cashMovements.cashIn,
      cashOut: cashMovements.cashOut,
      expectedCash: Math.round(expectedCash * 100) / 100,
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
