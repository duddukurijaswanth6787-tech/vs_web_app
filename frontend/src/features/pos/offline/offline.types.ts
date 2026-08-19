import { CompletePosSalePayload, PosCartItem, PosCustomerInfo, PosPaymentMethod } from '../pos.types';

export type PendingSaleStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'NEEDS_REVIEW' | 'FAILED';

export interface StockShortage {
  variantId: string;
  productName: string;
  variantTitle?: string;
  requested: number;
  available: number;
}

/** A sale that was completed at the register while the backend was unreachable, queued locally for sync. */
export interface PendingSale {
  localId: string;
  /** Client-generated order number; doubles as the idempotency key sent to the server on sync. */
  clientOrderNumber: string;
  payload: CompletePosSalePayload;
  /** Snapshot used to render the offline receipt without a server round-trip. */
  receipt: {
    items: PosCartItem[];
    customer?: PosCustomerInfo;
    paymentMethod: PosPaymentMethod;
    subtotal: number;
    discountTotal: number;
    taxTotal: number;
    grandTotal: number;
    cashierName?: string;
  };
  status: PendingSaleStatus;
  createdAt: string;
  lastAttemptAt?: string;
  attempts: number;
  errorMessage?: string;
  shortages?: StockShortage[];
  syncedOrderNumber?: string;
}

export interface CachedScanResult {
  key: string;
  productId: string;
  productName: string;
  variantId?: string;
  sku?: string;
  barcode?: string;
  variantTitle?: string;
  price: number;
  availableStock: number;
  primaryImage?: string;
  cachedAt: string;
}
