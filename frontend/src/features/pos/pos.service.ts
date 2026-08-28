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
} from './pos.types';

export const posService = {
  /**
   * Scan Barcode or SKU for instant product/variant lookup
   */
  async scanBarcode(barcode: string): Promise<ScanBarcodeResult> {
    const res = await apiClient.post<StandardResponse<ScanBarcodeResult>>('/pos/scan', { barcode });
    return res.data.data!;
  },

  /**
   * Find sellable products by typed name or SKU.
   *
   * Returns the same shape as scanBarcode, so the till builds the cart line
   * one way whichever route the item came in by.
   */
  async searchProducts(query: string, limit = 8): Promise<ScanBarcodeResult[]> {
    const res = await apiClient.get<StandardResponse<ScanBarcodeResult[]>>('/pos/products/search', {
      params: { q: query, limit },
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
