export type QuotationStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACCEPTED'
  | 'CONVERTED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface QuotationItem {
  id: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  variantTitle?: string | null;
  sku: string;
  quantity: number;
  unitPrice: string | number;
  discountPercent: string | number;
  discountAmount: string | number;
  taxPercent: string | number;
  taxAmount: string | number;
  totalPrice: string | number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  status: QuotationStatus;
  subtotal: string | number;
  discountTotal: string | number;
  taxTotal: string | number;
  grandTotal: string | number;
  currency: string;
  notes?: string | null;
  termsText?: string | null;
  validUntil?: string | null;
  convertedOrderId?: string | null;
  convertedAt?: string | null;
  createdAt: string;
  items: QuotationItem[];
}

export interface QuotationLineInput {
  productId: string;
  variantId?: string;
  productName: string;
  variantTitle?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
}

export interface CreateQuotationInput {
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  items: QuotationLineInput[];
  notes?: string;
  termsText?: string;
  validUntil?: string;
  status?: QuotationStatus;
}

export interface QuotationListResponse {
  data: Quotation[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
  };
}

export const STATUS_STYLES: Record<QuotationStatus, string> = {
  DRAFT: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  SENT: 'bg-blue-50 text-blue-700 border-blue-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CONVERTED: 'bg-violet-50 text-violet-700 border-violet-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  EXPIRED: 'bg-amber-50 text-amber-800 border-amber-200',
};

/** Prisma returns Decimal as a string; every total must survive that. */
export const money = (v: string | number | null | undefined): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export const formatMoney = (v: string | number | null | undefined): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(money(v));
