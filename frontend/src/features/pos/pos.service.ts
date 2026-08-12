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
};
