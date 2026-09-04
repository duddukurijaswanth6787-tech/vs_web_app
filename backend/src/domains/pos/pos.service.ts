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
import { CouponService } from '@domains/coupon/coupon.service';
import { GiftCardService } from '@domains/gift-card/gift-card.service';
import { LoyaltyService } from '@domains/loyalty/loyalty.service';
import { PasswordService } from '@domains/auth/services/password.service';
import { JwtService } from '@domains/auth/services/jwt.service';
import { PrismaService } from '@database/prisma.service';
import { NotificationService } from '@domains/notification/notification.service';
import { CheckoutSessionStatus } from '@prisma/client';
import Razorpay from 'razorpay';
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
  CreatePosExchangeDto,
  PosRefundMethodType,
  GenerateUpiQrDto,
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
    private readonly couponService: CouponService,
    private readonly giftCardService: GiftCardService,
    private readonly loyaltyService: LoyaltyService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Sets a cashier's short POS PIN.
   *
   * Guarded by the current password rather than just the session cookie so a
   * stolen access token can't silently change the PIN to something the
   * attacker knows -- setting a PIN would give them a shortcut past
   * password rotation.
   */
  async setCashierPin(
    userId: string,
    currentPassword: string,
    newPin: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const ok = await this.passwordService.verify(user.passwordHash, currentPassword);
    if (!ok) throw new BadRequestException('Current password is wrong.');
    if (!/^\d{4,6}$/.test(newPin)) {
      throw new BadRequestException('PIN must be 4 to 6 digits.');
    }
    const hash = await this.passwordService.hash(newPin);
    await this.prisma.user.update({
      where: { id: userId },
      data: { posPinHash: hash },
    });
    await this.auditService.log({
      action: 'POS_PIN_SET',
      module: 'pos',
      resource: 'user',
      resourceId: userId,
      userId,
    });
    return { success: true };
  }

  /**
   * Switch the active cashier at the till by short PIN.
   *
   * Given a 4-6 digit PIN, find the user it belongs to (must still have
   * pos:view), issue a fresh JWT for them, and return it. The till then
   * uses that token for subsequent calls, so sales are attributed to the
   * cashier who now stands at the counter -- no client-set cashierId, no
   * impersonation of the previously-logged-in user.
   *
   * A wrong PIN is refused with a generic message so a shoulder-surfer
   * can\'t enumerate valid PINs.
   */
  async switchCashierByPin(pin: string, terminalId?: string) {
    if (!/^\d{4,6}$/.test(pin || '')) {
      throw new BadRequestException('Enter a 4 to 6 digit PIN.');
    }
    // Candidates: users with a PIN set who still have pos:view.
    const candidates = await this.prisma.user.findMany({
      where: {
        posPinHash: { not: null },
        deletedAt: null,
        accountStatus: 'ACTIVE',
        userRoles: {
          some: {
            role: {
              rolePermissions: {
                some: { permission: { code: 'pos:view' } },
              },
            },
          },
        },
      },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    let matched:
      | { id: string; email: string; firstName: string | null; lastName: string | null; roles: string[]; userType: string }
      | null = null;
    for (const c of candidates) {
      if (!c.posPinHash) continue;
      const ok = await this.passwordService.verify(c.posPinHash, pin);
      if (ok) {
        matched = {
          id: c.id,
          email: c.email,
          firstName: c.firstName,
          lastName: c.lastName,
          roles: c.userRoles.map((r) => r.role.name),
          userType: c.userType,
        };
        break;
      }
    }

    if (!matched) {
      // Deliberately generic: don\'t hint whether the PIN matched an inactive
      // user, or matches no user, or matched a user without pos:view.
      throw new BadRequestException('PIN not recognised.');
    }

    const token = await this.jwtService.sign({
      sub: matched.id,
      email: matched.email,
      userType: matched.userType,
      roles: matched.roles,
    });

    await this.auditService.log({
      action: 'POS_CASHIER_SWITCHED',
      module: 'pos',
      resource: 'user',
      resourceId: matched.id,
      userId: matched.id,
      newValue: { terminalId: terminalId || 'unknown' },
    });

    return {
      token,
      user: {
        id: matched.id,
        fullName: [matched.firstName, matched.lastName].filter(Boolean).join(' ') || matched.email,
        email: matched.email,
        roles: matched.roles,
      },
    };
  }

  /**
   * The rate at which loyalty points redeem to rupees at the till.
   *
   * Kept as a constant here rather than a per-shop setting because a single
   * value is what a cashier can hold in their head, and Odoo's default
   * pricelist behaves the same way. If the shop ever wants a different rate,
   * move this to WebsiteSetting.
   */
  private static readonly LOYALTY_POINT_VALUE_RUPEES = 1;
  async scanBarcode(
    dto: ScanBarcodeDto,
    // Defaults to withholding cost price: a caller that has not said who it
    // is does not get margin data.
    isOwnerOrManager = false,
    // Defaults to retail. Wholesale is an explicit opt-in the cashier has to
    // toggle at the till, so a normal walk-in can never be charged the B2B
    // rate by accident.
    wholesale = false,
  ): Promise<BarcodeScanResultResponse> {
    const variantMatch = await this.repository.findVariantByBarcode(
      dto.barcode,
    );

    if (!variantMatch) {
      throw new NotFoundException(
        `No product variant found for barcode or SKU "${dto.barcode}"`,
      );
    }

    return this.toScanResult(variantMatch, isOwnerOrManager, wholesale);
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
    wholesale = false,
  ): BarcodeScanResultResponse {
    const availableStock = variantMatch.inventory
      ? Math.max(
          0,
          variantMatch.inventory.availableQuantity -
            (variantMatch.inventory.reservedQuantity ?? 0),
        )
      : 0;
    // Wholesale falls back to the retail price when the product has no
    // wholesalePrice set -- charging Rs.0 for an unset field would be worse
    // than charging the retail price.
    const retailPrice = Number(
      variantMatch.salePriceOverride ??
        variantMatch.priceOverride ??
        variantMatch.product?.basePrice ??
        0,
    );
    const price =
      wholesale && variantMatch.product?.wholesalePrice != null
        ? Number(variantMatch.product.wholesalePrice)
        : retailPrice;
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
    wholesale = false,
  ): Promise<BarcodeScanResultResponse[]> {
    const rows = await this.repository.searchVariantsByName(query, limit);
    return rows.map((row) => this.toScanResult(row, isOwnerOrManager, wholesale));
  }

  /**
   * Tiles of sellable products in one category, for the till's quick-buy grid.
   * Returns the same scan-compatible shape as the name search.
   */
  async listByCategory(
    categoryId: string,
    isOwnerOrManager = false,
    limit = 24,
    wholesale = false,
  ): Promise<BarcodeScanResultResponse[]> {
    const rows = await this.repository.findVariantsByCategory(categoryId, limit);
    return rows.map((row) => this.toScanResult(row, isOwnerOrManager, wholesale));
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
        await this.repository.createShift({
          terminalId,
          cashierId,
          openingCash: 0,
          notes: 'Auto-opened register shift on first sale',
        });
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

    // A coupon at the till subtracts from the order-level discount before tax
    // is worked out, so it lands in the same place a manual discount would
    // and the customer gets the tax break on the discounted amount. Read-only
    // here; the usage record is written after the order exists.
    let couponDiscount = 0;
    let couponValidated: { id: string; code: string } | null = null;
    if (dto.couponCode?.trim()) {
      const grossForCoupon = itemsToProcess.reduce(
        (sum, i) =>
          sum + i.quantity * i.unitPrice - (i.discountAmount || 0),
        0,
      );
      try {
        const checked = await this.couponService.checkCoupon(
          customerProfile.id,
          dto.couponCode.trim(),
          Math.max(0, grossForCoupon - discountTotal),
          itemsToProcess.map((i) => ({
            productId: i.productId,
            price: i.unitPrice,
            quantity: i.quantity,
          })),
        );
        couponDiscount = Number(checked.discountAmount) || 0;
        couponValidated = { id: checked.coupon.id, code: checked.coupon.code };
        discountTotal = Math.round((discountTotal + couponDiscount) * 100) / 100;
      } catch (err) {
        throw new BadRequestException(
          err instanceof Error ? err.message : 'Invalid coupon',
        );
      }
    }

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

    // Loyalty points redeem is validated + capped here (against live balance
    // and the sale's grand total). Booked as its own tender at 1 point = Rs.1
    // and drawn down from the customer's account after the order exists.
    let loyaltyTender: { method: 'LOYALTY'; amount: number } | null = null;
    let loyaltyBooking: {
      customerId: string;
      points: number;
      rupees: number;
    } | null = null;
    if (dto.loyaltyPointsRedeem && dto.loyaltyPointsRedeem > 0) {
      if (!dto.loyaltyCustomerId) {
        throw new BadRequestException(
          'Loyalty redemption needs a customer to draw points from.',
        );
      }
      try {
        const bal = await this.loyaltyService.adminBalance(dto.loyaltyCustomerId);
        if (!bal.isActive) {
          throw new BusinessException('Loyalty account inactive', 'LOYALTY_001');
        }
        const askedPoints = Math.floor(dto.loyaltyPointsRedeem);
        const cappedByBalance = Math.min(askedPoints, bal.pointsBalance);
        const cappedByGrand = Math.min(
          cappedByBalance,
          Math.floor(grandTotal / PosService.LOYALTY_POINT_VALUE_RUPEES),
        );
        if (cappedByGrand > 0) {
          const rupees = Math.round(cappedByGrand * PosService.LOYALTY_POINT_VALUE_RUPEES * 100) / 100;
          loyaltyTender = { method: 'LOYALTY', amount: rupees };
          loyaltyBooking = {
            customerId: dto.loyaltyCustomerId,
            points: cappedByGrand,
            rupees,
          };
        }
      } catch (err) {
        throw new BadRequestException(
          err instanceof Error ? err.message : 'Loyalty redemption failed',
        );
      }
    }

    // Gift cards are booked as their own tenders, at whatever amount the
    // till asked for -- capped at the card's live balance so a race with
    // another till emptying it can't overspend. Combined with any split
    // payment tenders so the drawer sees each method separately at close.
    const giftCardAllocations: { method: string; amount: number }[] = [];
    const giftCardBookings: { code: string; amount: number }[] = [];
    if (dto.giftCardTenders?.length) {
      for (const t of dto.giftCardTenders) {
        const bal = await this.giftCardService.getBalance(t.code);
        const capped = Math.min(Number(t.amount) || 0, Number(bal.balance));
        if (capped <= 0) continue;
        giftCardAllocations.push({ method: 'GIFT_CARD', amount: Math.round(capped * 100) / 100 });
        giftCardBookings.push({ code: bal.code, amount: Math.round(capped * 100) / 100 });
      }
    }

    // Split tenders are validated against the total the server just worked
    // out, never the one the till sent -- otherwise a tampered payload could
    // settle a Rs.5000 bill with Rs.100 of tenders.
    let tenderAllocations:
      | { method: string; amount: number }[]
      | undefined;
    let changeDue = 0;
    // Non-cash redemption tenders (gift card + loyalty) come first, then
    // the rest of the bill is settled on whatever the customer hands over.
    const redemptionAllocations: { method: string; amount: number }[] = [
      ...giftCardAllocations,
      ...(loyaltyTender ? [loyaltyTender] : []),
    ];
    const redemptionTotal = redemptionAllocations.reduce((s, a) => s + a.amount, 0);
    if (dto.splitPayments?.length) {
      const totalToSplit = Math.max(0, grandTotal - redemptionTotal);
      try {
        const split = allocateTenders(dto.splitPayments, totalToSplit);
        tenderAllocations = [...redemptionAllocations, ...split.allocations];
        changeDue = split.changeDue;
      } catch (err) {
        throw new BadRequestException(
          err instanceof Error ? err.message : 'Invalid split payment',
        );
      }
    } else if (redemptionAllocations.length) {
      // Redemption tenders without a split: they cover part or all of the
      // bill; any remainder is settled on the primary paymentMethod.
      const remainder = Math.max(0, Math.round((grandTotal - redemptionTotal) * 100) / 100);
      tenderAllocations = [...redemptionAllocations];
      if (remainder > 0) {
        tenderAllocations.push({ method: dto.paymentMethod, amount: remainder });
      }
    }

    // 2. Generate unique order number (offline syncs replay the client's
    // own order number so retries hit the idempotent-replay path above
    // instead of creating a duplicate order)
    const orderNumber =
      dto.clientOrderNumber || (await this.workflow.generateOrderNumber('POS'));

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

    // Book the loyalty redemption once the order has an id. redeemInternal
    // holds a transaction so a concurrent redemption of the same account
    // that would together overspend the balance is serialised through it.
    if (loyaltyBooking) {
      try {
        await this.loyaltyService.adminRedeem(
          {
            customerId: loyaltyBooking.customerId,
            points: loyaltyBooking.points,
            referenceType: 'ORDER',
            referenceId: order.id,
            description: `POS sale ${order.orderNumber}`,
          },
          cashierId,
        );
      } catch (err) {
        this.logger.warn(
          `Loyalty redeem failed for ${order.orderNumber}: ${err instanceof Error ? err.message : err}`,
        );
        await this.workflow.transition(
          order.id,
          'CANCELLED',
          cashierId,
          `Auto-cancelled: loyalty points could not be redeemed`,
        );
        throw new BusinessException(
          err instanceof Error ? err.message : 'Loyalty redemption failed',
          'POS_LOYALTY_REDEEM_FAILED',
        );
      }
    }

    // Book the gift card redemptions once the order has an id. The gift
    // card's own row is locked inside redeem, so a race with another till
    // spending the same card at the same instant serialises and the second
    // caller sees an "Insufficient balance" instead of both draining it.
    for (const gc of giftCardBookings) {
      try {
        await this.giftCardService.redeem(cashierId, {
          code: gc.code,
          amount: gc.amount,
          orderId: order.id,
        });
      } catch (err) {
        // A gift card that emptied between check and redeem shouldn't leave
        // the sale half-booked. Cancel and let the till try again with a
        // different tender split.
        this.logger.warn(
          `Gift card ${gc.code} failed to redeem against ${order.orderNumber}: ${err instanceof Error ? err.message : err}`,
        );
        await this.workflow.transition(
          order.id,
          'CANCELLED',
          cashierId,
          `Auto-cancelled: gift card ${gc.code} could not be redeemed`,
        );
        throw new BusinessException(
          err instanceof Error ? err.message : 'Gift card redemption failed',
          'POS_GIFTCARD_REDEEM_FAILED',
        );
      }
    }

    // Book the coupon usage now that the order has both a real id and a real
    // grand total. applyCoupon runs its own row-locked transaction, so a
    // second sale trying to use the last copy of a limited coupon at the same
    // instant is serialised against this one rather than both slipping through.
    if (couponValidated) {
      try {
        await this.couponService.applyCoupon(customerProfile.id, {
          code: couponValidated.code,
          orderId: order.id,
          orderAmount: Math.round(
            (totals.subtotal - totals.discountTotal + couponDiscount) * 100,
          ) / 100,
          items: itemsToProcess.map((i) => ({
            productId: i.productId,
            price: i.unitPrice,
            quantity: i.quantity,
          })),
        });
      } catch (err) {
        // A coupon that validated a moment ago but has since exhausted its
        // usage limit shouldn't leave the sale hanging. Cancel back and let
        // the till try again without the code.
        this.logger.warn(
          `Coupon ${couponValidated.code} failed to book against ${order.orderNumber}: ${err instanceof Error ? err.message : err}`,
        );
        await this.workflow.transition(
          order.id,
          'CANCELLED',
          cashierId,
          `Auto-cancelled: coupon ${couponValidated.code} could not be booked`,
        );
        throw new BusinessException(
          err instanceof Error ? err.message : 'Coupon booking failed',
          'POS_COUPON_BOOK_FAILED',
        );
      }
    }

    // 5. Update CheckoutSession if active
    if (activeSessionId) {
      await this.repository.updateCheckoutSessionStatus(
        activeSessionId,
        CheckoutSessionStatus.COMPLETED,
        order.id,
      );
    }

    // 5.5 Auto-generate GST Tax Invoice
    try {
      const existingInv = await this.prisma.invoice.findFirst({
        where: { orderId: order.id },
      });
      if (!existingInv) {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `INV-${dateStr}-`;
        const lastInvoice = await this.prisma.invoice.findFirst({
          where: { invoiceNumber: { startsWith: prefix } },
          orderBy: { invoiceNumber: 'desc' },
        });
        let seq = 1;
        if (lastInvoice) {
          seq = parseInt(lastInvoice.invoiceNumber.slice(-6), 10) + 1;
        }
        const invoiceNumber = `${prefix}${String(seq).padStart(6, '0')}`;

        await this.prisma.invoice.create({
          data: {
            order: { connect: { id: order.id } },
            invoiceNumber,
            status: 'PAID',
            subtotal: order.subtotal,
            taxTotal: order.taxTotal,
            discountTotal: order.discountTotal,
            grandTotal: order.grandTotal,
            currency: order.currency || 'INR',
            notes: `Tax Invoice · POS_SHOPORA · ${dto.paymentMethod || 'PAID'}`,
            createdBy: cashierId,
            items: {
              create: itemsToProcess.map((item) => ({
                productName: item.productName,
                sku: item.sku || 'SKU-UNKNOWN',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: Math.round(item.unitPrice * item.quantity * 100) / 100,
                taxAmount: 0,
                discountAmount: item.discountAmount || 0,
              })),
            },
          },
        });
      }
    } catch (invErr) {
      this.logger.warn(
        `Auto-invoice creation non-fatal error for order ${order.orderNumber}: ${invErr}`,
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

    // 8. In-App Notification for Super Admin & Staff
    this.notificationService.notifyAdmins(
      'ORDER_CREATED',
      `New In-Store Sale: ${order.orderNumber}`,
      `POS Sale of ₹${Number(order.grandTotal).toLocaleString('en-IN')} processed via ${dto.paymentMethod}${dto.notes ? ` (Remarks: ${dto.notes})` : ''}`,
      {
        orderId: order.id,
        orderNumber: order.orderNumber,
        grandTotal: Number(order.grandTotal),
        channel: order.channel,
        paymentMethod: dto.paymentMethod,
        notes: dto.notes,
      },
    ).catch((err) => this.logger.warn(`Failed to notify admins of POS sale: ${err.message}`));

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

  async upsertCustomer(dto: { fullName: string; phone: string; email?: string }) {
    if (!dto.phone || !dto.fullName) {
      throw new BadRequestException('Full name and phone number are required.');
    }
    return this.repository.upsertPosCustomer(dto);
  }

  async listPosCustomers(params: { search?: string; page?: number; limit?: number }) {
    return this.repository.listPosCustomers(params);
  }

  async generateUpiQrCode(dto: GenerateUpiQrDto) {
    const vpa = dto.vpa?.trim() || 'vasanthisignature@okhdfcbank';
    const merchantName = dto.merchantName?.trim() || "Vasanthi's Signature";
    const amount = Number(dto.amount);
    const note = dto.note?.trim() || 'POS In-Store Bill';

    // Build standard NPCI UPI Intent URI
    const upiUri = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;

    // Generate QR base64 data URL using BarcodeService
    const qrDataUrl = await this.barcodeService.generateQrCodeDataUrl(upiUri);

    return {
      vpa,
      merchantName,
      amount,
      note,
      upiUri,
      qrDataUrl,
    };
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

  /**
   * Validates a coupon against the current cart without booking usage.
   *
   * Used by the till's "Apply Coupon" input to give the cashier immediate
   * feedback ("Rs.100 off") before the sale is completed. The actual
   * booking happens inside completeSale under a row lock.
   */
  async validateCouponAtPos(params: {
    code: string;
    items: PosCartItemDto[];
    discountTotal?: number;
  }) {
    const customer = await this.repository.findOrCreateWalkInCustomer();
    const gross = params.items.reduce(
      (sum, i) => sum + i.quantity * i.unitPrice - (i.discountAmount || 0),
      0,
    );
    try {
      const checked = await this.couponService.checkCoupon(
        customer.id,
        params.code,
        Math.max(0, gross - (params.discountTotal || 0)),
        params.items.map((i) => ({
          productId: i.productId,
          price: i.unitPrice,
          quantity: i.quantity,
        })),
      );
      return {
        code: checked.coupon.code,
        discountAmount: Number(checked.discountAmount) || 0,
        message: 'Coupon is valid',
      };
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Invalid coupon',
      );
    }
  }

  /**
   * Reads a customer's loyalty points balance and its rupee equivalent, so
   * the till can show the cashier "500 pts (Rs.500)" alongside the customer
   * lookup and offer a redeem input.
   */
  async lookupLoyaltyBalance(customerId: string) {
    if (!customerId || !customerId.trim()) {
      throw new BadRequestException('customerId is required.');
    }
    const bal = await this.loyaltyService.adminBalance(customerId.trim());
    return {
      customerId: bal.customerId,
      pointsBalance: bal.pointsBalance,
      tier: bal.tier,
      isActive: bal.isActive,
      pointValueRupees: PosService.LOYALTY_POINT_VALUE_RUPEES,
      rupeeEquivalent:
        bal.pointsBalance * PosService.LOYALTY_POINT_VALUE_RUPEES,
    };
  }

  /**
   * Reads a gift card's remaining balance for the till, so the cashier can
   * see how much is on the card before deciding how much to redeem.
   *
   * A non-existent code errors, so the input can display "Card not found"
   * instead of silently showing zero.
   */
  async lookupGiftCardBalance(code: string) {
    if (!code || !code.trim()) {
      throw new BadRequestException('Enter a gift card code.');
    }
    const card = await this.giftCardService.getBalance(code.trim());
    return {
      code: card.code,
      balance: Number(card.balance),
      status: card.status,
      expiresAt: card.expiresAt ?? null,
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

  /**
   * A counter exchange: customer brings items back and takes replacements.
   *
   * Booked as two paired invoices in one atomic block -- return credit at the
   * returned value, fresh sale at the new value. Both carry their own GST so
   * the customer's tax history is right, and the physical cash movement is
   * the difference (positive = customer pays extra, negative = shop refunds).
   * If any step fails the whole exchange rolls back -- otherwise a customer
   * could walk out having been refunded for an item the shop never resold.
   */
  async createExchange(cashierId: string, dto: CreatePosExchangeDto) {
    const orderNumber = (dto.originalOrderNumber || '').trim();
    if (!orderNumber) {
      throw new BadRequestException('originalOrderNumber is required for an exchange.');
    }
    if (!dto.returnItems?.length) {
      throw new BadRequestException('Pick at least one item to return.');
    }
    if (!dto.newItems?.length) {
      throw new BadRequestException('Pick at least one replacement item.');
    }

    const found = await this.repository.findSaleForReturn(orderNumber);
    if (!found) {
      throw new NotFoundException(`No sale found for ${orderNumber}`);
    }
    const { order, returnedByItem } = found;

    if (order.channel !== 'POS_SHOPORA') {
      throw new BusinessException(
        `${orderNumber} was not sold in store. Online orders are exchanged through Admin.`,
        'POS_EXCHANGE_NOT_IN_STORE',
      );
    }

    const terminalId = dto.terminalId || DEFAULT_TERMINAL_ID;
    // Same rule as a plain return: no shift → no drawer to reconcile against.
    const openShift =
      await this.repository.findOpenShiftForTerminal(terminalId);
    if (!openShift) {
      throw new BusinessException(
        `No open shift on ${terminalId}. Open a shift before exchanging so both sides are reconciled at close.`,
        'POS_SHIFT_REQUIRED',
      );
    }

    // Validate and price the returned items using the same rule the return
    // flow uses, so an exchange and a plain return of the same line credit
    // the same amount.
    const itemsById = new Map(order.items.map((i) => [i.id, i]));
    const returnPriced: {
      orderItemId: string;
      variantId: string | null;
      quantity: number;
    }[] = [];
    let refundAmount = 0;
    for (const line of dto.returnItems) {
      const item = itemsById.get(line.orderItemId);
      if (!item) {
        throw new BusinessException(
          `Item ${line.orderItemId} is not part of ${orderNumber}`,
          'POS_EXCHANGE_ITEM_NOT_ON_SALE',
        );
      }
      const returnable = item.quantity - (returnedByItem.get(item.id) ?? 0);
      if (line.quantity > returnable) {
        throw new BusinessException(
          `Only ${returnable} of ${item.productName} can still be returned on ${orderNumber}`,
          'POS_EXCHANGE_QUANTITY_EXCEEDED',
        );
      }
      refundAmount += this.unitRefundValue(item) * line.quantity;
      returnPriced.push({
        orderItemId: item.id,
        variantId: item.variantId,
        quantity: line.quantity,
      });
    }
    refundAmount = Math.round(refundAmount * 100) / 100;

    // Price the new items server-side, per-product GST, tax after discount --
    // never trust the till's numbers for money.
    const taxRates = await this.repository.findProductTaxRates(
      dto.newItems.map((i) => i.productId).filter(Boolean),
    );
    const totals = computePosTotals(
      dto.newItems.map((i) => ({
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discountAmount: i.discountAmount,
        taxPercent: taxRates.get(i.productId) ?? 0,
      })),
      0,
    );

    // Refund goes against the original payment, using whatever method the
    // cashier chose (or the original method when ORIGINAL was selected).
    const payment = order.payments[0];
    if (!payment) {
      throw new BusinessException(
        `No payment recorded against ${orderNumber}, so there is nothing to refund the return against.`,
        'POS_EXCHANGE_NO_PAYMENT',
      );
    }
    let refundMethod: string = dto.refundMethod;
    if (dto.refundMethod === PosRefundMethodType.ORIGINAL) {
      if (!order.paymentMethod) {
        throw new BusinessException(
          `${orderNumber} has no recorded payment method. Choose how to refund instead.`,
          'POS_EXCHANGE_METHOD_UNKNOWN',
        );
      }
      refundMethod = order.paymentMethod;
    }

    // Resolve the walk-in customer profile so the new sale has one, same as a
    // plain sale would.
    const customerProfile = await this.repository.findOrCreateWalkInCustomer();

    const stamp = Date.now().toString(36).toUpperCase();
    const newOrderNumber = await this.workflow.generateOrderNumber();

    const { returnRequest, refund, newOrder } =
      await this.repository.createPosExchange({
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentId: payment.id,
        returnNumber: `EXR-${order.orderNumber}-${stamp}`,
        refundNumber: `EXF-${order.orderNumber}-${stamp}`,
        reason: dto.reason,
        notes: dto.notes,
        refundMethod,
        refundAmount,
        cashierId,
        returnItems: returnPriced,
        restock: (tx) =>
          this.workflow.restockReturnedItems(tx, {
            orderId: order.id,
            orderNumber: order.orderNumber,
            items: returnPriced,
            userId: cashierId,
            reason: `Exchanged at ${terminalId} against ${order.orderNumber}`,
          }),
        newOrder: {
          orderNumber: newOrderNumber,
          customerId: customerProfile.id,
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          taxTotal: totals.taxTotal,
          grandTotal: totals.grandTotal,
          paymentMethod: dto.paymentMethod,
          terminalId,
          notes: `Exchange of ${order.orderNumber}${dto.notes ? ` - ${dto.notes}` : ''}`,
          items: dto.newItems,
          customerInfo: dto.customer,
        },
        deduct: (tx, newOrderId) =>
          this.workflow.deductInventoryTx(tx, newOrderId, cashierId),
      });

    const netDue = Math.round((totals.grandTotal - refundAmount) * 100) / 100;

    await this.auditService.log({
      action: 'POS_EXCHANGE_COMPLETED',
      module: 'pos',
      resource: 'return_request',
      resourceId: returnRequest.id,
      userId: cashierId,
      newValue: {
        originalOrderNumber: order.orderNumber,
        newOrderNumber: newOrder.orderNumber,
        terminalId,
        shiftId: openShift.id,
        refundAmount,
        refundMethod,
        newSaleTotal: totals.grandTotal,
        paymentMethod: dto.paymentMethod,
        netDue,
      },
    });

    return {
      success: true,
      originalOrderNumber: order.orderNumber,
      newOrderNumber: newOrder.orderNumber,
      returnNumber: returnRequest.returnNumber,
      refundNumber: refund.refundNumber,
      refundAmount,
      refundMethod,
      newSaleTotal: totals.grandTotal,
      paymentMethod: dto.paymentMethod,
      // Positive: customer owes the shop that much; negative: shop owes them.
      netDue,
      terminalId,
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

  private async getRazorpayClient(): Promise<Razorpay> {
    const [keyIdSetting, keySecretSetting] = await Promise.all([
      this.repository.prisma.appSetting.findFirst({ where: { key: 'razorpay.key_id' } }),
      this.repository.prisma.appSetting.findFirst({ where: { key: 'razorpay.key_secret' } }),
    ]);
    const keyId = keyIdSetting?.value || process.env.RAZORPAY_KEY_ID || 'rzp_live_TSGHBbQLHYa2MW';
    const keySecret = keySecretSetting?.value || process.env.RAZORPAY_KEY_SECRET || 'B2o4qv6I0YuWX785GDPjwZpS';
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  async createRazorpayQrCode(
    amount: number,
    description = 'POS Counter Bill',
    notes: Record<string, string> = {},
  ) {
    const razorpay = await this.getRazorpayClient();
    const amountInPaise = Math.round(amount * 100);
    const closeBy = Math.floor(Date.now() / 1000) + 900;

    const sanitizedNotes: Record<string, string> = {
      source: 'SHOPORA_POS_MOBILE',
      branch: 'MAIN',
    };
    if (notes && typeof notes === 'object') {
      for (const [k, v] of Object.entries(notes)) {
        if (v !== undefined && v !== null && String(v).trim()) {
          sanitizedNotes[String(k)] = String(v).trim();
        }
      }
    }

    try {
      const qr: any = await razorpay.qrCode.create({
        type: 'upi_qr',
        name: 'Vasanthi Signature Store',
        usage: 'single_use',
        fixed_amount: true,
        payment_amount: amountInPaise,
        description: description || 'POS Counter Bill',
        close_by: closeBy,
        notes: sanitizedNotes,
      });

      let imageUrl = qr.image_url;
      try {
        const imgResp = await fetch(qr.image_url);
        if (imgResp.ok) {
          const arrayBuffer = await imgResp.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          imageUrl = `data:image/png;base64,${base64}`;
        }
      } catch (imgErr) {
        this.logger.warn(`Could not inline Razorpay QR image: ${imgErr}`);
      }

      return {
        qrId: qr.id,
        imageUrl,
        amount: Number(qr.payment_amount) / 100,
        status: qr.status,
        closeBy: qr.close_by,
        paymentsAmountReceived: (Number(qr.payments_amount_received) || 0) / 100,
      };
    } catch (err: any) {
      const errMsg =
        err?.error?.description ||
        err?.description ||
        err?.message ||
        JSON.stringify(err);
      this.logger.error(`Razorpay QR code generation failed: ${errMsg}`);
      throw new BadRequestException(`Razorpay QR error: ${errMsg}`);
    }
  }

  async fetchRazorpayQrStatus(qrId: string) {
    const razorpay = await this.getRazorpayClient();
    try {
      const qr: any = await razorpay.qrCode.fetch(qrId);
      const amountDue = (Number(qr.payment_amount) || 0) / 100;
      const amountReceived = (Number(qr.payments_amount_received) || 0) / 100;
      const isPaid = amountReceived >= amountDue && amountDue > 0;

      return {
        qrId: qr.id,
        status: isPaid ? 'PAID' : qr.status,
        isPaid,
        amountDue,
        amountReceived,
        closeBy: qr.close_by,
      };
    } catch (err: any) {
      const errMsg =
        err?.error?.description ||
        err?.description ||
        err?.message ||
        JSON.stringify(err);
      this.logger.error(`Failed to fetch Razorpay QR status: ${errMsg}`);
      throw new BadRequestException(`Razorpay status check error: ${errMsg}`);
    }
  }
}
