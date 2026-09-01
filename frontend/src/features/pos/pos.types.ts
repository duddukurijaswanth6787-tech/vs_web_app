export type PosPaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'CREDIT' | 'SPLIT';

/** SMALL 50x25mm (barcode only), MEDIUM 75x40mm (adds a QR), LARGE 100x50mm (full branded design with QR). */
export type LabelSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export const LABEL_SIZE_OPTIONS: { value: LabelSize; title: string; dimensions: string; description: string }[] = [
  { value: 'SMALL', title: 'Small', dimensions: '50 × 25mm', description: 'Compact garment tag — barcode + SKU + price only' },
  { value: 'MEDIUM', title: 'Medium', dimensions: '75 × 40mm', description: 'Adds a scannable QR code alongside the barcode' },
  { value: 'LARGE', title: 'Large', dimensions: '100 × 50mm', description: 'Full branded design — logo, SKU badge, barcode & QR' },
];

export interface PosCartItem {
  productId: string;
  productName: string;
  variantId?: string;
  sku?: string;
  variantTitle?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxAmount?: number;
  primaryImage?: string;
  availableStock?: number;
  /** GST for this line, from Product.taxPercentage via the scan. The till
   *  used to apply a flat 5% to everything. */
  taxPercent?: number;
  /** List price, for the MRP line on a printed tag. */
  mrp?: number;
  /** Required on a GST invoice. */
  hsnCode?: string;
}

export interface PosCustomerInfo {
  fullName?: string;
  phone?: string;
  email?: string;
}

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
  /** GST rate for this product; the till bills at this rate per line. */
  taxPercent?: number;
  /** List price, printed as MRP on the tag. */
  mrp?: number;
  /** Required on a GST invoice. */
  hsnCode?: string;
}

export interface CheckoutSessionData {
  id: string;
  sessionId: string;
  handoffToken: string;
  status: 'WAITING_FOR_WEB' | 'IN_PROGRESS_ON_WEB' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  items: PosCartItem[];
  customer?: PosCustomerInfo;
  expiresAt: string;
  createdAt: string;
}

export interface CompletePosSalePayload {
  sessionId?: string;
  items?: PosCartItem[];
  paymentMethod: PosPaymentMethod;
  amountPaid: number;
  /** Set when paymentMethod is SPLIT: one entry per tender the customer paid with. */
  splitPayments?: { method: PosPaymentMethod; amount: number }[];
  /** Promo code applied at the till. Server validates and books usage. */
  couponCode?: string;
  customer?: PosCustomerInfo;
  terminalId?: string;
  shopId?: string;
  notes?: string;
  discountTotal?: number;
  taxTotal?: number;
  /** Idempotency key for offline-queued sales; replaying it returns the already-created order instead of duplicating it. */
  clientOrderNumber?: string;
  /** True when syncing from the offline queue; triggers a server-side stock-sufficiency check before the order is created. */
  isOfflineSync?: boolean;
}

export interface PosSaleResult {
  success: boolean;
  message: string;
  order: {
    orderId: string;
    orderNumber: string;
    channel: string;
    paymentMethod: string;
    status: string;
    grandTotal: number;
    itemsCount: number;
    /** Change owed back on a split bill, worked out server-side. */
    changeDue?: number;
    createdAt: string;
  };
  printReady: boolean;
}

export interface PosCustomerLookupResult extends PosCustomerInfo {
  found?: boolean;
  ordersCount?: number;
  totalSpent?: number;
  recentOrders?: PosCustomerOrderSummary[];
}

export interface PosCustomerOrderSummary {
  orderId: string;
  orderNumber: string;
  grandTotal: number;
  paymentMethod?: string;
  status: string;
  createdAt: string;
  items?: PosCustomerOrderItem[];
}

export interface PosCustomerOrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface BatchStickersPayload {
  productName: string;
  variantTitle?: string;
  sku: string;
  barcode: string;
  price: number;
  /** MRP for the "incl. of all taxes" line on the sticker. Optional. */
  mrp?: number;
  /** HSN code for the sticker footer. Optional. */
  hsnCode?: string;
  quantity: number;
  storeName?: string;
  labelSize?: LabelSize;
}

export interface BatchStickersResponse {
  quantity: number;
  barcode: string;
  sku: string;
  html: string;
  tspl: string;
}

export interface PreviewReceiptPayload {
  orderNumber: string;
  grandTotal: number;
  items: PosCartItem[];
  customer?: PosCustomerInfo;
  paymentMethod?: string;
  discountTotal?: number;
  taxTotal?: number;
  cashierName?: string;
  transactionId?: string;
}

export interface PreviewReceiptResponse {
  orderNumber: string;
  html: string;
  escposBase64: string;
}

export interface PosShift {
  id: string;
  terminalId: string;
  cashierId: string;
  status: 'OPEN' | 'CLOSED';
  openingCash: number;
  closingCashExpected?: number | null;
  closingCashCounted?: number | null;
  variance?: number | null;
  notes?: string | null;
  openedAt: string;
  closedAt?: string | null;
  cashier?: { id: string; firstName: string; lastName?: string };
}

export interface OpenShiftPayload {
  terminalId: string;
  openingCash: number;
  notes?: string;
}

export interface CloseShiftPayload {
  closingCashCounted: number;
  notes?: string;
}

export interface ShiftReport {
  shift: PosShift;
  reportType: 'X_REPORT' | 'Z_REPORT';
  generatedAt: string;
  windowStart: string;
  windowEnd: string;
  openingCash: number;
  cashSales: number;
  cashRefunds: number;
  /** Petty cash added to the drawer during the shift. */
  cashIn: number;
  /** Petty cash taken out of the drawer during the shift. */
  cashOut: number;
  /** What the drawer should hold, by the same arithmetic the close uses. */
  expectedCash: number;
  byMethod: Array<{ method: string; revenue: number; count: number }>;
  orderCount: number;
  refundsCount: number;
  refundsAmount: number;
}

export interface PosDaySummary {
  totalRevenue: number;
  totalOrders: number;
  byMethod: Array<{ method: string; revenue: number; count: number }>;
  byTerminal: Array<{
    terminalId: string;
    revenue: number;
    orderCount: number;
    refundsCount: number;
    refundsAmount: number;
  }>;
  byCashier: Array<{
    cashierId: string;
    cashierName: string;
    revenue: number;
    orderCount: number;
  }>;
  totalRefundsCount: number;
  totalRefundsAmount: number;
}

export interface ShiftListResponse {
  data: PosShift[];
  meta: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrevious: boolean };
}

// ─── Returns (over the counter) ──────────────────────────

export type PosRefundMethod = 'CASH' | 'UPI' | 'CARD' | 'ORIGINAL';

export interface ReturnableSaleItem {
  orderItemId: string;
  productName: string;
  variantTitle?: string;
  sku: string;
  quantity: number;
  alreadyReturned: number;
  returnableQuantity: number;
  /** What one unit is worth back, net of the line's discount and tax. */
  unitRefund: number;
}

export interface ReturnableSale {
  orderId: string;
  orderNumber: string;
  soldAt: string;
  paymentMethod: string;
  grandTotal: number;
  customerPhone?: string;
  items: ReturnableSaleItem[];
}

export interface CreateReturnPayload {
  orderNumber: string;
  items: { orderItemId: string; quantity: number }[];
  refundMethod: PosRefundMethod;
  reason: string;
  terminalId?: string;
  notes?: string;
}

export interface PosReturnResult {
  success: boolean;
  returnNumber: string;
  refundNumber: string;
  refundMethod: string;
  refundAmount: number;
  orderNumber: string;
  terminalId: string;
  itemsReturned: number;
}

/** New items being sold as part of an exchange. */
export interface ExchangeNewItem {
  productId: string;
  productName: string;
  variantId?: string;
  sku?: string;
  variantTitle?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxAmount?: number;
}

export interface CreateExchangePayload {
  originalOrderNumber: string;
  returnItems: { orderItemId: string; quantity: number }[];
  newItems: ExchangeNewItem[];
  refundMethod: PosRefundMethod;
  paymentMethod: PosPaymentMethod;
  reason: string;
  terminalId?: string;
  notes?: string;
  customer?: PosCustomerInfo;
}

export interface PosExchangeResult {
  success: boolean;
  originalOrderNumber: string;
  newOrderNumber: string;
  returnNumber: string;
  refundNumber: string;
  refundAmount: number;
  refundMethod: string;
  newSaleTotal: number;
  paymentMethod: string;
  /** Positive = customer owes the shop; negative = shop owes them. */
  netDue: number;
  terminalId: string;
}

/** A cart parked at the till, listed so the counter can pick it back up. */
export interface HeldSession {
  sessionId: string;
  handoffToken: string;
  deviceId?: string;
  customer?: PosCustomerInfo;
  itemsCount: number;
  grandTotal: number;
  expiresAt: string;
  createdAt: string;
}

/** Cash moved in or out of the drawer for something other than a sale. */
export interface PosCashMovement {
  id: string;
  direction: 'IN' | 'OUT';
  amount: number;
  reason: string;
  createdAt: string;
}

export interface PosCashMovementList {
  movements: PosCashMovement[];
  cashIn: number;
  cashOut: number;
  net: number;
}
