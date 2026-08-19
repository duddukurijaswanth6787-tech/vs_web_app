import { posApiClient, unwrap } from './api';

/**
 * Customer shopping client -- the same authenticated session the staff
 * screens use (posApiClient carries whatever account is currently signed
 * in), pointed at the storefront-facing endpoints the Next.js web store
 * already uses. Any account can shop; there's no separate "customer app" --
 * signing in with a customer account and opening the Shop tab is the whole
 * flow.
 */

// ─── Catalog ─────────────────────────────────────────────────────────────────

export interface ShopProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface ShopProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  basePrice: number;
  salePrice?: number;
  primaryImageUrl?: string;
  images?: ShopProductImage[];
  isPublished: boolean;
}

export interface ShopProductListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const shopCatalogService = {
  /** GET /products -- filtered to what a customer should actually see. */
  async listProducts(params: { search?: string; page?: number; limit?: number } = {}): Promise<{
    data: ShopProduct[];
    meta: ShopProductListMeta;
  }> {
    const res = await posApiClient.get('/products', {
      params: {
        isPublished: true,
        visibility: 'VISIBLE',
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        ...(params.search ? { search: params.search } : {}),
      },
    });
    return unwrap<{ data: ShopProduct[]; meta: ShopProductListMeta }>(res);
  },

  /** GET /products/:id */
  async getProduct(id: string): Promise<ShopProduct> {
    const res = await posApiClient.get(`/products/${id}`);
    return unwrap<ShopProduct>(res);
  },
};

// ─── Cart ────────────────────────────────────────────────────────────────────

export interface ShopCartItem {
  id: string;
  cartId: string;
  productId: string;
  productName?: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface ShopCart {
  id: string;
  status: string;
  items?: ShopCartItem[];
  itemCount: number;
  subtotal: number;
  totalSavings: number;
}

export const shopCartService = {
  /** GET /cart */
  async getCart(): Promise<ShopCart> {
    const res = await posApiClient.get('/cart');
    return unwrap<ShopCart>(res);
  },

  /** POST /cart/items */
  async addItem(dto: { productId: string; variantId?: string; quantity?: number }): Promise<ShopCart> {
    const res = await posApiClient.post('/cart/items', dto);
    return unwrap<ShopCart>(res);
  },

  /** PATCH /cart/items/:itemId */
  async updateQuantity(itemId: string, quantity: number): Promise<ShopCart> {
    const res = await posApiClient.patch(`/cart/items/${itemId}`, { quantity });
    return unwrap<ShopCart>(res);
  },

  /** DELETE /cart/items/:itemId */
  async removeItem(itemId: string): Promise<ShopCart> {
    const res = await posApiClient.delete(`/cart/items/${itemId}`);
    return unwrap<ShopCart>(res);
  },
};

// ─── Addresses ───────────────────────────────────────────────────────────────

export interface ShopAddress {
  id: string;
  label?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefaultShipping?: boolean;
}

export const shopAddressService = {
  /** GET /me/addresses */
  async listAddresses(): Promise<ShopAddress[]> {
    const res = await posApiClient.get('/me/addresses');
    const payload = unwrap<any>(res);
    return Array.isArray(payload) ? payload : (payload?.data ?? []);
  },

  /** POST /me/addresses */
  async createAddress(dto: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    label?: string;
  }): Promise<ShopAddress> {
    const res = await posApiClient.post('/me/addresses', { country: 'IN', label: 'Home', ...dto });
    return unwrap<ShopAddress>(res);
  },
};

// ─── Checkout ────────────────────────────────────────────────────────────────

export interface ShopCheckoutPreview {
  subtotal: number;
  discount?: number;
  discountTotal?: number;
  shipping?: number;
  shippingCharge?: number;
  tax?: number;
  taxTotal?: number;
  total?: number;
  grandTotal?: number;
}

export interface ShopOrderPlaced {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
}

export const shopCheckoutService = {
  /** POST /checkout/preview */
  async preview(addressId: string): Promise<ShopCheckoutPreview> {
    const res = await posApiClient.post('/checkout/preview', { addressId });
    return unwrap<ShopCheckoutPreview>(res);
  },

  /** POST /checkout/place-order */
  async placeOrder(addressId: string, notes?: string): Promise<ShopOrderPlaced> {
    const res = await posApiClient.post('/checkout/place-order', { addressId, notes });
    return unwrap<ShopOrderPlaced>(res);
  },
};

// ─── Orders ──────────────────────────────────────────────────────────────────

export interface ShopOrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: number;
  createdAt: string;
  itemsCount?: number;
}

export const shopOrdersService = {
  /** GET /me/orders */
  async listOrders(): Promise<ShopOrderSummary[]> {
    const res = await posApiClient.get('/me/orders');
    const payload = unwrap<any>(res);
    return Array.isArray(payload) ? payload : (payload?.data ?? []);
  },
};
