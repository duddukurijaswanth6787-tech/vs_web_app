import { PosMobileCartItem, PosMobileCustomer } from '../api';

/**
 * Mirrors the web POS's offline queue
 * (frontend/src/features/pos/offline/offline.types.ts), adapted to this
 * app's PosMobileCartItem/PosMobileCustomer types and to expo-sqlite storage.
 */

export type PendingSaleStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'NEEDS_REVIEW' | 'FAILED';

export type PosMobilePaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'CREDIT' | 'SPLIT';

export interface StockShortage {
  variantId: string;
  productName: string;
  variantTitle?: string;
  requested: number;
  available: number;
}

/** The subset of posMobileService.completeSale's payload the queue replays on sync. */
export interface CompleteSaleCorePayload {
  sessionId?: string;
  items?: PosMobileCartItem[];
  paymentMethod: PosMobilePaymentMethod;
  amountPaid: number;
  customer?: PosMobileCustomer;
  notes?: string;
  /**
   * Register the sale bills against. Captured when the sale is queued, not
   * when it syncs, so a sale rung up on this phone is still counted against
   * this phone's shift however long it waits offline.
   */
  terminalId?: string;
}

/** A sale that was completed on the phone while the backend was unreachable, queued locally for sync. */
export interface PendingSale {
  localId: string;
  /** Client-generated order number; doubles as the idempotency key sent to the server on sync. */
  clientOrderNumber: string;
  payload: CompleteSaleCorePayload;
  /** Snapshot used to render an offline confirmation without a server round-trip. */
  receipt: {
    items: PosMobileCartItem[];
    customer?: PosMobileCustomer;
    paymentMethod: PosMobilePaymentMethod;
    grandTotal: number;
  };
  status: PendingSaleStatus;
  createdAt: string;
  lastAttemptAt?: string;
  attempts: number;
  errorMessage?: string;
  shortages?: StockShortage[];
  syncedOrderNumber?: string;
}

/** The shape posMobileService.scanBarcode resolves to (POST /pos/scan). */
export interface ScanBarcodeResult {
  productId: string;
  productName: string;
  variantId?: string;
  sku?: string;
  barcode?: string;
  variantTitle?: string;
  price: number;
  costPrice?: number;
  availableStock: number;
  primaryImage?: string;
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
  costPrice?: number;
  availableStock: number;
  primaryImage?: string;
  cachedAt: string;
}

export type PendingStockInStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

/**
 * A stock-in (replenishment) submitted on the phone while the backend was
 * unreachable. Not present on the web POS -- the desktop till doesn't do
 * stock-in -- so this type has no web equivalent to mirror.
 */
export interface PendingStockIn {
  localId: string;
  /** Idempotency key sent as inventoryService.increase's clientRequestId on sync. */
  clientRequestId: string;
  variantId: string;
  quantity: number;
  reason?: string;
  thresholds?: { minimumStock?: number; reorderLevel?: number };
  /** Snapshot of the scanned variant so the queued row can be redisplayed without a re-scan. */
  variant: {
    productName: string;
    variantTitle?: string;
    sku?: string;
    barcode?: string;
    price?: number;
    availableStock?: number;
  };
  status: PendingStockInStatus;
  createdAt: string;
  lastAttemptAt?: string;
  attempts: number;
  errorMessage?: string;
}
