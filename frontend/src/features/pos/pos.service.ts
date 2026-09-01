import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  PosCartItem,
  PosCustomerInfo,
  ScanBarcodeResult,
  CheckoutSessionData,
  CompletePosSalePayload,
  PosSaleResult,
  BatchStickersPayload,
  BatchStickersResponse,
  PreviewReceiptPayload,
  PreviewReceiptResponse,
  PosCustomerLookupResult,
  PosShift,
  OpenShiftPayload,
  CloseShiftPayload,
  ShiftReport,
  PosDaySummary,
  ShiftListResponse,
  ReturnableSale,
  CreateReturnPayload,
  PosReturnResult,
  CreateExchangePayload,
  PosExchangeResult,
  HeldSession,
  PosCashMovement,
  PosCashMovementList,
} from './pos.types';

export const posService = {
  /**
   * Scan Barcode or SKU for instant product/variant lookup
   */
  async scanBarcode(barcode: string, wholesale = false): Promise<ScanBarcodeResult> {
    const res = await apiClient.post<StandardResponse<ScanBarcodeResult>>(
      '/pos/scan',
      { barcode },
      { params: wholesale ? { wholesale: 'true' } : undefined },
    );
    return res.data.data!;
  },

  /** Record cash paid into or out of the drawer (petty cash, banking). */
  async recordCashMovement(
    terminalId: string,
    payload: { direction: 'IN' | 'OUT'; amount: number; reason: string },
  ): Promise<PosCashMovement> {
    const res = await apiClient.post<StandardResponse<PosCashMovement>>(
      '/pos/shifts/cash-movements',
      payload,
      { params: { terminalId } },
    );
    return res.data.data!;
  },

  /** Every drawer movement recorded against a shift. */
  async listCashMovements(shiftId: string): Promise<PosCashMovementList> {
    const res = await apiClient.get<StandardResponse<PosCashMovementList>>(
      `/pos/shifts/${shiftId}/cash-movements`,
    );
    return res.data.data ?? { movements: [], cashIn: 0, cashOut: 0, net: 0 };
  },

  /** Product tiles for a category, for the till's quick-buy grid. */
  async listByCategory(categoryId: string, wholesale = false, limit = 24): Promise<ScanBarcodeResult[]> {
    const res = await apiClient.get<StandardResponse<ScanBarcodeResult[]>>('/pos/products/by-category', {
      params: { categoryId, limit, ...(wholesale ? { wholesale: 'true' } : {}) },
    });
    return res.data.data ?? [];
  },

  /** Look up a customer's loyalty balance and rupee equivalent. */
  async lookupLoyaltyBalance(customerId: string): Promise<{ customerId: string; pointsBalance: number; tier: string; pointValueRupees: number; rupeeEquivalent: number; isActive: boolean }> {
    const res = await apiClient.get<StandardResponse<{ customerId: string; pointsBalance: number; tier: string; pointValueRupees: number; rupeeEquivalent: number; isActive: boolean }>>(
      '/pos/loyalty/balance',
      { params: { customerId } },
    );
    return res.data.data!;
  },

  /** Look up a gift card's remaining balance for the till. */
  async lookupGiftCardBalance(code: string): Promise<{ code: string; balance: number; status: string }> {
    const res = await apiClient.post<StandardResponse<{ code: string; balance: number; status: string }>>(
      '/pos/gift-cards/balance',
      { code },
    );
    return res.data.data!;
  },

  /**
   * Validate a coupon against the current cart. Read-only preview -- the
   * usage isn't booked until the sale completes.
   */
  async validateCoupon(payload: {
    code: string;
    items: Array<{ productId: string; productName: string; quantity: number; unitPrice: number; discountAmount?: number }>;
    discountTotal?: number;
  }): Promise<{ code: string; discountAmount: number; message: string }> {
    const res = await apiClient.post<StandardResponse<{ code: string; discountAmount: number; message: string }>>(
      '/pos/coupons/validate',
      payload,
    );
    return res.data.data!;
  },

  /**
   * Reprint a past sale's tax invoice. The receipt is stamped "DUPLICATE COPY"
   * so it can't be passed off as the original.
   */
  async reprintReceipt(orderNumber: string): Promise<{ orderNumber: string; html: string; escposBase64: string }> {
    const res = await apiClient.get<StandardResponse<{ orderNumber: string; html: string; escposBase64: string }>>(
      '/pos/receipts/reprint',
      { params: { orderNumber } },
    );
    return res.data.data!;
  },

  /** Carts parked at this till, waiting to be picked back up. */
  async listHeldSessions(terminalId?: string): Promise<HeldSession[]> {
    const res = await apiClient.get<StandardResponse<HeldSession[]>>('/pos/checkout-sessions/held', {
      params: terminalId ? { terminalId } : undefined,
    });
    return res.data.data ?? [];
  },

  /** Discard a parked cart the customer never came back for. */
  async discardHeldSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/pos/checkout-sessions/${sessionId}`);
  },

  /**
   * Find sellable products by typed name or SKU.
   *
   * Returns the same shape as scanBarcode, so the till builds the cart line
   * one way whichever route the item came in by.
   */
  async searchProducts(query: string, limit = 8, wholesale = false): Promise<ScanBarcodeResult[]> {
    const res = await apiClient.get<StandardResponse<ScanBarcodeResult[]>>('/pos/products/search', {
      params: { q: query, limit, ...(wholesale ? { wholesale: 'true' } : {}) },
    });
    return res.data.data ?? [];
  },

  /**
   * Create a mobile-to-desktop handoff checkout session
   */
  async createCheckoutSession(payload: {
    items: PosCartItem[];
    customer?: PosCustomerInfo;
    notes?: string;
    shopId?: string;
    deviceId?: string;
    discountTotal?: number;
    /** Park the cart at this till instead of handing it to a phone. */
    hold?: boolean;
  }): Promise<CheckoutSessionData> {
    const res = await apiClient.post<StandardResponse<CheckoutSessionData>>('/pos/checkout-sessions', payload);
    return res.data.data!;
  },

  /**
   * Adopt handoff session on desktop web POS using 6-digit PIN or token
   */
  async adoptHandoffSession(handoffToken: string): Promise<CheckoutSessionData> {
    const res = await apiClient.post<StandardResponse<CheckoutSessionData>>('/pos/checkout-sessions/adopt', {
      handoffToken,
    });
    return res.data.data!;
  },

  /**
   * Complete POS sale (processes payment, updates DB, deducts stock & triggers print)
   */
  async completeSale(payload: CompletePosSalePayload): Promise<PosSaleResult> {
    const res = await apiClient.post<StandardResponse<PosSaleResult>>('/pos/sales/complete', payload);
    return res.data.data!;
  },

  /**
   * Generate batch sticker labels HTML & TSPL payload
   */
  async generateBatchStickers(payload: BatchStickersPayload): Promise<BatchStickersResponse> {
    const res = await apiClient.post<StandardResponse<BatchStickersResponse>>('/pos/barcodes/batch-stickers', payload);
    return res.data.data!;
  },

  /**
   * Preview thermal receipt (HTML & ESC/POS Base64)
   */
  async previewReceipt(payload: PreviewReceiptPayload): Promise<PreviewReceiptResponse> {
    const res = await apiClient.post<StandardResponse<PreviewReceiptResponse>>('/pos/printers/preview-receipt', payload);
    return res.data.data!;
  },

  /**
   * Lookup Customer & Order History by Phone
   */
  async lookupCustomer(phone: string): Promise<PosCustomerLookupResult> {
    const res = await apiClient.get<StandardResponse<PosCustomerLookupResult>>('/pos/customers/lookup', {
      params: { phone },
    });
    return res.data.data!;
  },

  /**
   * Open a new till/shift with a starting cash float
   */
  async openShift(payload: OpenShiftPayload): Promise<PosShift> {
    const res = await apiClient.post<StandardResponse<PosShift>>('/pos/shifts/open', payload);
    return res.data.data!;
  },

  /**
   * Look up an in-store sale and what is still returnable on it.
   */
  async lookupSaleForReturn(orderNumber: string): Promise<ReturnableSale> {
    const res = await apiClient.get<StandardResponse<ReturnableSale>>('/pos/returns/lookup', {
      params: { orderNumber },
    });
    return res.data.data!;
  },

  /**
   * Take goods back at the counter: restock, refund, and record it.
   */
  async createExchange(payload: CreateExchangePayload): Promise<PosExchangeResult> {
    const res = await apiClient.post<StandardResponse<PosExchangeResult>>('/pos/exchanges', payload);
    return res.data.data!;
  },

  async createReturn(payload: CreateReturnPayload): Promise<PosReturnResult> {
    const res = await apiClient.post<StandardResponse<PosReturnResult>>('/pos/returns', payload);
    return res.data.data!;
  },

  /**
   * Get the current logged-in cashier's open shift (null if none)
   */
  async getCurrentShift(terminalId?: string): Promise<PosShift | null> {
    const res = await apiClient.get<StandardResponse<PosShift | null>>('/pos/shifts/current', {
      params: { terminalId },
    });
    return res.data.data ?? null;
  },

  /**
   * Close a shift: count cash, compute variance
   */
  async closeShift(shiftId: string, payload: CloseShiftPayload): Promise<PosShift> {
    const res = await apiClient.post<StandardResponse<PosShift>>(`/pos/shifts/${shiftId}/close`, payload);
    return res.data.data!;
  },

  /**
   * List shifts (till reconciliation history)
   */
  async listShifts(params: { page?: number; limit?: number; status?: string; terminalId?: string; cashierId?: string }): Promise<ShiftListResponse> {
    const res = await apiClient.get<StandardResponse<ShiftListResponse>>('/pos/shifts', { params });
    return res.data.data!;
  },

  /**
   * Get the X-Report (open shift) or Z-Report (closed shift) for a shift
   */
  async getShiftReport(shiftId: string): Promise<ShiftReport> {
    const res = await apiClient.get<StandardResponse<ShiftReport>>(`/pos/shifts/${shiftId}/report`);
    return res.data.data!;
  },

  /**
   * Day-level POS summary: payment split, terminal & cashier performance, returns
   */
  async getPosDaySummary(date?: string): Promise<PosDaySummary> {
    const res = await apiClient.get<StandardResponse<PosDaySummary>>('/pos/analytics/summary', {
      params: { date },
    });
    return res.data.data!;
  },
};
