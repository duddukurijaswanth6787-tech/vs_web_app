import axios from 'axios';

/**
 * Backend base URL.
 *
 * Set EXPO_PUBLIC_API_BASE_URL in `.env` (see .env.example) so the same build can
 * point at a laptop on the LAN, the UAT deployment, or production without a code
 * change. The fallback is only a development convenience.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.23:4000/api/v1';

/** Origin without the `/api/v1` suffix — used by the websocket namespace. */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

export const posApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Session ─────────────────────────────────────────────────────────────────
// Held in memory for the life of the app process. A POS device signs in when the
// shift starts; closing the app signs out. Persisting this across restarts needs
// a storage dependency (@react-native-async-storage/async-storage) that this app
// does not currently ship.

let accessToken: string | null = null;
let currentUser: AuthUser | null = null;

export interface AuthUser {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  userType?: string;
}

export function getAccessToken() {
  return accessToken;
}

export function getCurrentUser() {
  return currentUser;
}

export function isAuthenticated() {
  return Boolean(accessToken);
}

export function clearSession() {
  accessToken = null;
  currentUser = null;
}

posApiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/**
 * Turn an axios failure into a message worth showing on a phone screen.
 * The API wraps errors as { message, errorCode }, sometimes with an array of
 * validation messages.
 */
export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const anyErr = err as any;
  const data = anyErr?.response?.data;
  const message = data?.message ?? data?.error;
  if (Array.isArray(message)) return message.join('\n');
  if (typeof message === 'string') return message;
  if (anyErr?.response?.status === 401) return 'Session expired. Please sign in again.';
  if (anyErr?.message === 'Network Error') {
    return `Cannot reach the server at ${API_BASE_URL}. Check EXPO_PUBLIC_API_BASE_URL.`;
  }
  if (anyErr instanceof Error) return anyErr.message;
  return fallback;
}

/** Every endpoint answers with { success, message, data } — this unwraps `data`. */
function unwrap<T>(res: { data?: { data?: T } }): T {
  return (res?.data?.data ?? res?.data) as T;
}

// ─── Types ───────────────────────────────────────────────────────────────────

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

export interface BrandOption {
  id: string;
  name: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  /** Absent for a top-level category. */
  parentId?: string;
}

/** A colour, its gallery, and the per-size stock the user typed. */
export interface ColorGroupDraft {
  id: string;
  name: string;
  hex: string;
  /** Local file URIs (from the camera/gallery) or already-hosted URLs. */
  images: string[];
  sizes: SizeRowDraft[];
}

export interface SizeRowDraft {
  size: string;
  stock: number;
  available: boolean;
  /** Low-stock warning threshold for this variant. */
  minStock?: number;
  /** Level at which the variant should be reordered. */
  reorderLevel?: number;
}

/** One created variant, with the barcode the backend assigned to it. */
export interface CreatedVariant {
  variantId: string;
  sku: string;
  barcode: string;
  title: string;
  color: string;
  size: string;
  stock: number;
  price: number;
}

export interface CreatedProductSummary {
  productId: string;
  name: string;
  brandName: string;
  basePrice: number;
  salePrice?: number;
  variants: CreatedVariant[];
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authService = {
  /**
   * POST /auth/login — stores the access token for every later request.
   * Product, variant and inventory writes are admin-only, so the POS device
   * must sign in with a staff account that holds those roles.
   */
  async login(email: string, password: string) {
    const res = await posApiClient.post('/auth/login', { email, password });
    const payload = unwrap<any>(res);
    const token = payload?.accessToken ?? payload?.access_token ?? payload?.token;
    if (!token) throw new Error('Login succeeded but no access token was returned.');
    accessToken = token;
    currentUser = payload?.user ?? null;
    return { token, user: currentUser };
  },

  logout() {
    clearSession();
  },
};

// ─── POS: scan, checkout handoff, sale ───────────────────────────────────────

export const posMobileService = {
  /** POST /pos/scan — resolve a barcode or SKU to a sellable variant. */
  async scanBarcode(barcode: string) {
    const res = await posApiClient.post('/pos/scan', { barcode });
    return unwrap<any>(res);
  },

  /** POST /pos/checkout-sessions — hand the cart to the desktop till. */
  async createCheckoutSession(payload: {
    items: PosMobileCartItem[];
    customer?: PosMobileCustomer;
    notes?: string;
    deviceId?: string;
  }) {
    const res = await posApiClient.post('/pos/checkout-sessions', payload);
    return unwrap<any>(res);
  },

  /** POST /pos/sales/complete — finish the sale on the phone. */
  async completeSale(payload: {
    sessionId?: string;
    items?: PosMobileCartItem[];
    paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'CREDIT' | 'SPLIT';
    amountPaid: number;
    customer?: PosMobileCustomer;
    notes?: string;
  }) {
    const res = await posApiClient.post('/pos/sales/complete', payload);
    return unwrap<any>(res);
  },

  /** GET /pos/customers/lookup — customer + order history by phone. */
  async lookupCustomer(phone: string) {
    const res = await posApiClient.get('/pos/customers/lookup', { params: { phone } });
    return unwrap<any>(res);
  },
};

// ─── Catalog: the same endpoints the admin ProductBuilder uses ────────────────

export const catalogService = {
  /** GET /brands — brandId is required when creating a product. */
  async listBrands(): Promise<BrandOption[]> {
    const res = await posApiClient.get('/brands', { params: { limit: 100 } });
    const payload = unwrap<any>(res);
    const rows = Array.isArray(payload) ? payload : (payload?.data ?? []);
    return rows
      .filter((b: any) => b?.id && b?.name)
      .map((b: any) => ({ id: b.id, name: b.name }));
  },

  /** GET /categories — parentId is kept so sub-categories can be filtered. */
  async listCategories(): Promise<CategoryOption[]> {
    const res = await posApiClient.get('/categories', { params: { limit: 200 } });
    const payload = unwrap<any>(res);
    const rows = Array.isArray(payload) ? payload : (payload?.data ?? []);
    return rows
      .filter((c: any) => c?.id && c?.name)
      .map((c: any) => ({ id: c.id, name: c.name, parentId: c.parentId ?? undefined }));
  },

  /** POST /products */
  async createProduct(dto: Record<string, unknown>) {
    const res = await posApiClient.post('/products', dto);
    return unwrap<any>(res);
  },


  /**
   * POST /storage/upload — multipart upload of a local photo.
   * React Native's FormData takes { uri, name, type } instead of a Blob.
   */
  async uploadImage(localUri: string, fileName: string): Promise<string> {
    const form = new FormData();
    form.append('file', {
      uri: localUri,
      name: fileName,
      type: guessMimeType(fileName, localUri),
    } as unknown as Blob);

    const res = await posApiClient.post('/storage/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    const payload = unwrap<any>(res);
    return payload?.url;
  },

  /** POST /media — attach an uploaded image to the product gallery. */
  async addMedia(dto: {
    productId: string;
    url: string;
    isPrimary?: boolean;
    displayOrder?: number;
    color?: string;
  }) {
    const res = await posApiClient.post('/media', dto);
    return unwrap<any>(res);
  },

  /** POST /products/:id/attributes — the dynamic registry values. */
  async assignAttributes(
    productId: string,
    attributes: { attributeId: string; value: string }[],
  ) {
    const res = await posApiClient.post(`/products/${productId}/attributes`, { attributes });
    return unwrap<any>(res);
  },

  /**
   * POST /variants — the backend assigns a unique SKU (when omitted) and always
   * assigns the barcode itself, so the label can only be printed after this call.
   */
  async createVariant(dto: {
    productId: string;
    sku?: string;
    title?: string;
    priceOverride?: number;
    salePriceOverride?: number;
    costPrice?: number;
    displayOrder?: number;
    isDefault?: boolean;
    attributeValues?: { attributeId: string; attributeOptionId?: string; value?: string }[];
  }) {
    const res = await posApiClient.post('/variants', dto);
    return unwrap<any>(res);
  },
};

// ─── Attributes (to tag variants with Size / Colour) ──────────────────────────

export interface AttributeDefinition {
  id: string;
  name: string;
  slug: string;
  isRequired?: boolean;
  options: { id: string; value: string; label?: string }[];
}

export const attributeService = {
  /**
   * GET /attributes — resolves the Size and Colour ids for variant tagging, and
   * supplies the dynamic registry (fabric, pattern, neck …) for the product.
   */
  async list(): Promise<AttributeDefinition[]> {
    const res = await posApiClient.get('/attributes', { params: { limit: 100 } });
    const payload = unwrap<any>(res);
    const rows = Array.isArray(payload) ? payload : (payload?.data ?? []);
    return rows.map((a: any) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      isRequired: Boolean(a.isRequired),
      options: (a.options ?? []).map((o: any) => ({
        id: o.id,
        value: o.value,
        label: o.label,
      })),
    }));
  },
};

/**
 * Build the attributeValues entries for one colour/size pair, matching the
 * seeded `color` and `size` attributes. Anything that cannot be matched is sent
 * as a free-text value, and a missing attribute is simply skipped — a variant
 * without attributes still scans and sells.
 */
export function buildVariantAttributes(
  attributes: AttributeDefinition[],
  color: string,
  size: string,
) {
  const entries: { attributeId: string; attributeOptionId?: string; value?: string }[] = [];

  const pick = (slug: string, value: string) => {
    const attr = attributes.find((a) => a.slug === slug || a.name.toLowerCase() === slug);
    if (!attr) return;
    const option = attr.options.find(
      (o) => o.value.toLowerCase().trim() === value.toLowerCase().trim(),
    );
    entries.push(
      option
        ? { attributeId: attr.id, attributeOptionId: option.id }
        : { attributeId: attr.id, value },
    );
  };

  if (color) pick('color', color);
  if (size) pick('size', size);
  return entries;
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export const inventoryService = {
  /** GET /inventory/variant/:variantId — returns null when none exists yet. */
  async findByVariant(variantId: string) {
    try {
      const res = await posApiClient.get(`/inventory/variant/${variantId}`);
      return unwrap<any>(res);
    } catch (err) {
      if ((err as any)?.response?.status === 404) return null;
      throw err;
    }
  },

  /** POST /inventory — open a stock record for a brand-new variant. */
  async create(dto: {
    variantId: string;
    availableQuantity?: number;
    minimumStock?: number;
    maximumStock?: number;
    reorderLevel?: number;
  }) {
    const res = await posApiClient.post('/inventory', dto);
    return unwrap<any>(res);
  },

  /** POST /inventory/:id/increase — replenish an existing stock record. */
  async increase(inventoryId: string, quantity: number, reason?: string) {
    const res = await posApiClient.post(`/inventory/${inventoryId}/increase`, {
      quantity,
      reason: reason ?? 'POS mobile stock-in',
    });
    return unwrap<any>(res);
  },

  /**
   * Set the opening stock for a variant, creating the inventory record when the
   * variant has none. Replaces the old `POST /inventory/stock-in` call, which
   * was never an endpoint on this API.
   */
  async stockIn(
    variantId: string,
    quantity: number,
    reason?: string,
    thresholds?: { minimumStock?: number; reorderLevel?: number },
  ) {
    const existing = await this.findByVariant(variantId);
    if (!existing?.id) {
      return this.create({ variantId, availableQuantity: quantity, ...thresholds });
    }
    if (quantity <= 0) return existing;
    return this.increase(existing.id, quantity, reason);
  },
};

// ─── Barcode labels ──────────────────────────────────────────────────────────

export const barcodeService = {
  /**
   * GET /pos/barcodes/generate — streams a PNG, so this returns a URL that an
   * <Image> can render directly rather than fetching the bytes.
   */
  imageUrl(code: string, opts?: { bcid?: string; scale?: number; height?: number }) {
    const params = new URLSearchParams({ code });
    if (opts?.bcid) params.set('bcid', opts.bcid);
    if (opts?.scale != null) params.set('scale', String(opts.scale));
    if (opts?.height != null) params.set('height', String(opts.height));
    return `${API_BASE_URL}/pos/barcodes/generate?${params.toString()}`;
  },

  /** POST /pos/barcodes/batch-stickers — printable HTML plus a TSPL payload. */
  async batchStickers(dto: {
    productName: string;
    variantTitle?: string;
    sku: string;
    barcode: string;
    price: number;
    quantity: number;
  }): Promise<{ quantity: number; barcode: string; sku: string; html: string; tspl: string }> {
    const res = await posApiClient.post('/pos/barcodes/batch-stickers', dto);
    return unwrap<any>(res);
  },
};

function guessMimeType(fileName: string, uri: string): string {
  const source = `${fileName}|${uri}`.toLowerCase();
  if (source.includes('.png')) return 'image/png';
  if (source.includes('.webp')) return 'image/webp';
  if (source.includes('.heic')) return 'image/heic';
  return 'image/jpeg';
}
