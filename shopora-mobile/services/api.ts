import axios from 'axios';

// Update API_BASE_URL to point to your computer's local IP or backend host
export const API_BASE_URL = 'http://192.168.1.23:4000/api/v1';

export const posApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface PosMobileCartItem {
  productId: string;
  productName: string;
  variantId?: string;
  sku?: string;
  variantTitle?: string;
  quantity: number;
  unitPrice: number;
  primaryImage?: string;
  availableStock?: number;
}

export interface PosMobileCustomer {
  fullName?: string;
  phone?: string;
  email?: string;
}

export const posMobileService = {
  /**
   * Scan barcode or SKU code
   */
  async scanBarcode(barcode: string) {
    const res = await posApiClient.post('/pos/scan', { barcode });
    return res.data.data;
  },

  /**
   * Create Mobile-to-Desktop Checkout Handoff Session
   */
  async createCheckoutSession(payload: {
    items: PosMobileCartItem[];
    customer?: PosMobileCustomer;
    notes?: string;
    deviceId?: string;
  }) {
    const res = await posApiClient.post('/pos/checkout-sessions', payload);
    return res.data.data;
  },

  /**
   * Complete Sale directly on phone
   */
  async completeSale(payload: {
    sessionId?: string;
    items?: PosMobileCartItem[];
    paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'CREDIT' | 'SPLIT';
    amountPaid: number;
    customer?: PosMobileCustomer;
    notes?: string;
  }) {
    const res = await posApiClient.post('/pos/sales/complete', payload);
    return res.data.data;
  },

  /**
   * Add new stock (Inventory replenishment)
   */
  async addStock(payload: {
    variantId: string;
    quantity: number;
    location?: string;
    supplier?: string;
    notes?: string;
  }) {
    const res = await posApiClient.post('/inventory/stock-in', payload);
    return res.data;
  },
};
