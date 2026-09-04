export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantTitle?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxAmount: number;
  discountAmount: number;
}

export interface OrderAddressResponse {
  id: string;
  addressType: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  landmark?: string;
}

export interface OrderTimelineResponse {
  id: string;
  status: string;
  message?: string;
  createdBy?: string;
  createdAt: string;
}

export interface OrderResponse {
  id: string;
  orderNumber: string;
  customerId: string;
  status: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingCharge: number;
  grandTotal: number;
  currency: string;
  notes?: string;
  /** Admin-only: present only in admin API responses, not shown to customers. */
  channel?: string;
  paymentMethod?: string;
  terminalId?: string;
  courierPartner?: string;
  waybillNumber?: string;
  trackingUrl?: string;
  items?: OrderItemResponse[];
  addresses?: OrderAddressResponse[];
  timeline?: OrderTimelineResponse[];
  customer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  payments?: Array<{
    id: string;
    paymentNumber: string;
    provider: string;
    method: string;
    amount: number;
    currency: string;
    status: string;
    transactionId?: string;
    createdAt: string;
  }>;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignCourierDto {
  courierPartner: string;
  waybillNumber?: string;
  trackingUrl?: string;
  message?: string;
}

export interface OrderQueryDto {
  search?: string;
  channel?: string;
  status?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface OrderListResponse {
  data: OrderResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
