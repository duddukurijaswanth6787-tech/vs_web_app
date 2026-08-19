import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

/**
 * Backend base URL.
 *
 * Set EXPO_PUBLIC_API_BASE_URL in `.env` (see .env.example) so the same build can
 * point at a laptop on the LAN, or a specific deployment, without a code change.
 * The fallback points at the live production backend so the app works out of
 * the box for anyone who hasn't set up a `.env`.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://vsss-production.up.railway.app/api/v1';

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
// Kept in memory for fast sync reads (isAuthenticated/getAccessToken are called
// from render code), and mirrored to SecureStore (Keychain on iOS, Keystore-
// backed EncryptedSharedPreferences on Android) so a sign-in survives the app
// being closed and reopened. Call restoreSession() once at startup, before any
// screen checks isAuthenticated() -- see app/_layout.tsx.

const TOKEN_STORAGE_KEY = 'shopora_access_token';
const USER_STORAGE_KEY = 'shopora_current_user';

let accessToken: string | null = null;
let currentUser: AuthUser | null = null;

export interface AuthUser {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  userType?: string;
  roles?: string[];
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

async function persistSession() {
  try {
    if (accessToken) {
      await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, accessToken);
    }
    if (currentUser) {
      await SecureStore.setItemAsync(USER_STORAGE_KEY, JSON.stringify(currentUser));
    }
  } catch (e) {
    // Best-effort -- worst case the next app launch just asks to sign in again.
    console.error('Failed to persist session:', e);
  }
}

/** Reads a previously saved session back into memory. Call once at app startup. */
export async function restoreSession(): Promise<boolean> {
  try {
    const [token, userJson] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_STORAGE_KEY),
      SecureStore.getItemAsync(USER_STORAGE_KEY),
    ]);
    if (!token) return false;
    accessToken = token;
    currentUser = userJson ? (JSON.parse(userJson) as AuthUser) : null;
    return true;
  } catch (e) {
    console.error('Failed to restore session:', e);
    return false;
  }
}

export function clearSession() {
  accessToken = null;
  currentUser = null;
  SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY).catch(() => {});
  SecureStore.deleteItemAsync(USER_STORAGE_KEY).catch(() => {});
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
export function unwrap<T>(res: { data?: { data?: T } }): T {
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

export interface SizeChartOption {
  id: string;
  name: string;
  garmentType?: string;
  unit: string;
  rows: { size: string; measurements: Record<string, number | string> }[];
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
  /**
   * Already-uploaded fabric swatch photo for this colour (used as that
   * colour tab's icon/thumbnail on the storefront), distinct from `images`.
   */
  swatchUrl?: string;
}

export interface SizeRowDraft {
  size: string;
  stock: number;
  available: boolean;
  /** Low-stock warning threshold for this variant. */
  minStock?: number;
  /** Level at which the variant should be reordered. */
  reorderLevel?: number;
  /** User-typed SKU override; left blank lets the backend auto-generate one. */
  sku?: string;
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
   * POST /auth/login — stores the access token for every later request, then
   * loads the profile via GET /auth/me (the login response itself is just
   * tokens, no user object) so the app can tell a staff account from a
   * customer one and route accordingly.
   */
  async login(email: string, password: string) {
    const res = await posApiClient.post('/auth/login', { email, password });
    const payload = unwrap<any>(res);
    const token = payload?.accessToken ?? payload?.access_token ?? payload?.token;
    if (!token) throw new Error('Login succeeded but no access token was returned.');
    accessToken = token;
    currentUser = await this.fetchMe();
    await persistSession();
    return { token, user: currentUser };
  },

  /** GET /auth/me — refreshes the in-memory profile (roles, userType, etc). */
  async fetchMe(): Promise<AuthUser | null> {
    try {
      const meRes = await posApiClient.get('/auth/me');
      const me = unwrap<any>(meRes);
      currentUser = {
        id: me?.id,
        email: me?.email,
        firstName: me?.firstName,
        lastName: me?.lastName,
        userType: me?.userType,
        roles: me?.roles,
      };
      return currentUser;
    } catch {
      return null;
    }
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

  /**
   * POST /pos/sales/complete — finish the sale on the phone.
   * `clientOrderNumber` + `isOfflineSync` mirror the web POS's offline queue
   * contract: replaying the same clientOrderNumber returns the
   * already-created order instead of duplicating it, and isOfflineSync asks
   * the server to check stock is still sufficient before creating the order.
   */
  async completeSale(payload: {
    sessionId?: string;
    items?: PosMobileCartItem[];
    paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'CREDIT' | 'SPLIT';
    amountPaid: number;
    customer?: PosMobileCustomer;
    notes?: string;
    clientOrderNumber?: string;
    isOfflineSync?: boolean;
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

// ─── Dashboard: home screen stats ─────────────────────────────────────────────

export interface DashboardSummary {
  todayRevenue: number;
  todayOrders: number;
  todayItemsSold: number;
  lowStockCount: number;
}

export const dashboardService = {
  /** GET /dashboard/summary — today's sales, items sold, low-stock count. */
  async getSummary(): Promise<DashboardSummary> {
    const res = await posApiClient.get('/dashboard/summary');
    return unwrap<DashboardSummary>(res);
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
    // Backend caps `limit` at 100 (@Max(100) on CategoryQueryDto) — requesting
    // more than that fails validation outright.
    const res = await posApiClient.get('/categories', { params: { limit: 100 } });
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
    /** Shot type — Front, Back, Detail … */
    title?: string;
  }) {
    const res = await posApiClient.post('/media', dto);
    return unwrap<any>(res);
  },

  /** GET /size-charts — reusable measurement charts to attach to a product. */
  async listSizeCharts(): Promise<SizeChartOption[]> {
    const res = await posApiClient.get('/size-charts', {
      params: { limit: 100, status: 'ACTIVE' },
    });
    const payload = unwrap<any>(res);
    const rows = Array.isArray(payload) ? payload : (payload?.data ?? []);
    return rows.map((c: any) => ({
      id: c.id,
      name: c.name,
      garmentType: c.garmentType ?? undefined,
      unit: c.unit ?? 'inch',
      rows: c.rows ?? [],
    }));
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

  /**
   * POST /products/:id/color-groups/sync — binds each colour's variant ids
   * and media ids to a `colorAttributeOptionId`, so the storefront can group
   * images and sizes by colour. Mirrors the web ProductBuilder's call of the
   * same name (frontend/src/features/catalog/products/product.service.ts).
   */
  async syncColorGroups(
    productId: string,
    dto: {
      colorGroups: Array<{
        colorAttributeOptionId: string;
        label?: string;
        variantIds: string[];
        mediaIds: string[];
      }>;
    },
  ) {
    const res = await posApiClient.post(`/products/${productId}/color-groups/sync`, dto);
    return unwrap<any>(res);
  },
};

// ─── Coupons & Offers (attach existing promos to a product) ──────────────────

export interface CouponOption {
  id: string;
  code: string;
  name: string;
  type: string; // 'PERCENTAGE' | 'FLAT' | 'FREE_SHIPPING'
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  applicableTo?: string;
  applicableIds?: string[];
}

export interface OfferOption {
  id: string;
  name: string;
  type: string; // 'PERCENTAGE' | 'FLAT' | 'FREE_SHIPPING'
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  applicableTo?: string;
  applicableIds?: string[];
}

export const promoService = {
  /** GET /coupons — same list the website's Coupons & Offers pages use. */
  async listCoupons(): Promise<CouponOption[]> {
    const res = await posApiClient.get('/coupons', { params: { limit: 100 } });
    const payload = unwrap<any>(res);
    return Array.isArray(payload) ? payload : (payload?.data ?? []);
  },
  /** GET /offers */
  async listOffers(): Promise<OfferOption[]> {
    const res = await posApiClient.get('/offers', { params: { limit: 100 } });
    const payload = unwrap<any>(res);
    return Array.isArray(payload) ? payload : (payload?.data ?? []);
  },
  /** PATCH /coupons/:id — used only to add/remove this product from applicableIds. */
  async updateCoupon(id: string, dto: { applicableTo?: string; applicableIds: string[] }) {
    const res = await posApiClient.patch(`/coupons/${id}`, dto);
    return unwrap<any>(res);
  },
  /** PATCH /offers/:id */
  async updateOffer(id: string, dto: { applicableTo?: string; applicableIds: string[] }) {
    const res = await posApiClient.patch(`/offers/${id}`, dto);
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

  /**
   * POST /inventory/:id/increase — replenish an existing stock record.
   * `clientRequestId` is an idempotency key: replaying the same one (e.g. an
   * offline-queued stock-in retried after the response was lost) is
   * recognized server-side and answered without crediting the stock twice.
   */
  async increase(inventoryId: string, quantity: number, reason?: string, clientRequestId?: string) {
    const res = await posApiClient.post(`/inventory/${inventoryId}/increase`, {
      quantity,
      reason: reason ?? 'POS mobile stock-in',
      ...(clientRequestId
        ? { referenceType: 'MOBILE_OFFLINE_SYNC', referenceId: clientRequestId }
        : {}),
    });
    return unwrap<any>(res);
  },

  /**
   * Set the opening stock for a variant, creating the inventory record when the
   * variant has none. Replaces the old `POST /inventory/stock-in` call, which
   * was never an endpoint on this API.
   *
   * `clientRequestId`, when passed, is only honoured on the increase path (see
   * above) -- a retried first-ever stock-in for a variant (the create path)
   * is not idempotent, since Inventory.variantId is unique and a genuine
   * retry after a lost response would 409 rather than duplicate the stock.
   */
  async stockIn(
    variantId: string,
    quantity: number,
    reason?: string,
    thresholds?: { minimumStock?: number; reorderLevel?: number },
    clientRequestId?: string,
  ) {
    const existing = await this.findByVariant(variantId);
    if (!existing?.id) {
      return this.create({ variantId, availableQuantity: quantity, ...thresholds });
    }
    if (quantity <= 0) return existing;
    return this.increase(existing.id, quantity, reason, clientRequestId);
  },
};

// ─── Barcode labels ──────────────────────────────────────────────────────────

/** SMALL 50x25mm (barcode only), MEDIUM 75x40mm (adds a QR), LARGE 100x50mm (full branded design with QR). */
export type LabelSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export const LABEL_SIZE_OPTIONS: { value: LabelSize; title: string; dimensions: string }[] = [
  { value: 'SMALL', title: 'Small', dimensions: '50 x 25mm' },
  { value: 'MEDIUM', title: 'Medium', dimensions: '75 x 40mm' },
  { value: 'LARGE', title: 'Large', dimensions: '100 x 50mm' },
];

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
    labelSize?: LabelSize;
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
