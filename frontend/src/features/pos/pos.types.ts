export type PosPaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'CREDIT' | 'SPLIT';

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
  customer?: PosCustomerInfo;
  terminalId?: string;
  shopId?: string;
  notes?: string;
  discountTotal?: number;
  taxTotal?: number;
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
  quantity: number;
  storeName?: string;
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
}

export interface PreviewReceiptResponse {
  orderNumber: string;
  html: string;
  escposBase64: string;
}
