export interface InvoiceItemResponse {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxAmount: number;
  discountAmount: number;
}

export interface AddressDto {
  label?: string;
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  landmark?: string;
  latitude?: string | number;
  longitude?: string | number;
  [key: string]: unknown;
}

export interface InvoiceResponse {
  id: string;
  orderId: string;
  orderNumber?: string;
  channel?: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  currency: string;
  billingAddress?: AddressDto;
  shippingAddress?: AddressDto;
  items?: InvoiceItemResponse[];
  notes?: string;
  createdAt: string;
}

export interface CreateInvoiceDto {
  orderId: string;
  billingAddress?: AddressDto;
  shippingAddress?: AddressDto;
  notes?: string;
}

export interface InvoiceQueryDto {
  orderId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceListResponse {
  data: InvoiceResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
