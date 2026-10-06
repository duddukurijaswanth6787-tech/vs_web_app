'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Store,
  Package,
  Search,
  Printer,
  Plus,
  RefreshCw,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  TrendingUp,
  X,
  LayoutGrid,
  Table as TableIcon,
  Barcode as BarcodeIcon,
  User,
} from 'lucide-react';
import { productService } from '@/features/catalog/products/product.service';
import {
  ProductStatus,
  ProductType,
  GenderType,
  ProductChannel,
} from '@/features/catalog/products/product.types';
import { variantService } from '@/features/catalog/variants/variant.service';
import { brandService } from '@/features/catalog/brands/brand.service';
import { categoryService } from '@/features/catalog/categories/category.service';
import { inventoryService } from '@/features/inventory/inventory.service';
import { generateCode128SvgDataUrl, generateQrCodeSvgDataUrl } from '@/utils/barcode-generator';

interface ProductItem {
  id: string;
  name: string;
  slug?: string;
  basePrice: number;
  salePrice?: number;
  channel?: string;
  status: string;
  createdBy?: string;
  creatorName?: string;
  createdAt: string;
  brand?: { name: string };
  category?: { name: string };
  primaryImageUrl?: string;
  images?: Array<{ id?: string; url: string; isPrimary?: boolean }>;
  media?: Array<{ id?: string; url: string; isPrimary?: boolean; color?: string }>;
  variants?: Array<{
    id: string;
    sku: string;
    barcode?: string;
    title?: string;
    price?: number;
    availableQuantity?: number;
    inventory?: Array<{ quantity: number }> | { availableQuantity?: number };
  }>;
}

const PRESET_COLORS = [
  { name: 'Maroon', hex: '#881337' },
  { name: 'Emerald Green', hex: '#065f46' },
  { name: 'Royal Blue', hex: '#1e3a8a' },
  { name: 'Pastel Pink', hex: '#f472b6' },
  { name: 'Gold', hex: '#d97706' },
  { name: 'Black', hex: '#0f172a' },
  { name: 'Crimson Red', hex: '#dc2626' },
  { name: 'Mustard Yellow', hex: '#ca8a04' },
];

const PRESET_SIZES = ['Free Size', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

export default function StoreExpoInventoryPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'EXPO_ONLY' | 'ALL' | 'IN_STOCK' | 'LOW_STOCK'>('EXPO_ONLY');
  const [viewLayout, setViewLayout] = useState<'GRID' | 'TABLE'>('GRID');

  // Barcode Print Modal State
  const [printProduct, setPrintProduct] = useState<ProductItem | null>(null);
  const [stickerCopies, setStickerCopies] = useState<number>(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [stickerSize, setStickerSize] = useState<'75x50' | '50x25'>('75x50');

  // Product Details Modal
  const [viewProduct, setViewProduct] = useState<ProductItem | null>(null);

  // Quick Expo Add Modal State
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickPrice, setQuickPrice] = useState('');
  const [quickMrp, setQuickMrp] = useState('');
  const [quickColor, setQuickColor] = useState('Maroon');
  const [quickCustomColor, setQuickCustomColor] = useState('');
  const [quickSizes, setQuickSizes] = useState<string[]>(['Free Size']);
  const [quickSizeStocks, setQuickSizeStocks] = useState<Record<string, number>>({ 'Free Size': 5 });
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickFeedback, setQuickFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await productService.findAll({ limit: 100 });
      const items = (res?.data || []) as unknown as ProductItem[];
      setProducts(items);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load store and expo products'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filtered list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Stock calculation
      const totalStock =
        p.variants?.reduce((sum, v) => {
          if (typeof v.availableQuantity === 'number') return sum + v.availableQuantity;
          if (Array.isArray(v.inventory)) {
            return sum + v.inventory.reduce((isum, inv) => isum + (inv.quantity || 0), 0);
          }
          if (v.inventory && typeof v.inventory === 'object' && 'availableQuantity' in v.inventory) {
            return sum + (Number((v.inventory as Record<string, unknown>).availableQuantity) || 0);
          }
          return sum;
        }, 0) ?? 0;

      // Filter modes
      if (filterMode === 'EXPO_ONLY') {
        const isExpo =
          p.channel === 'STORE_EXPO' ||
          p.channel === 'POS_ONLY' ||
          p.channel === 'POS_SHOPORA' ||
          p.channel === 'STORE';
        if (!isExpo) return false;
      } else if (filterMode === 'IN_STOCK') {
        if (totalStock <= 0) return false;
      } else if (filterMode === 'LOW_STOCK') {
        if (totalStock > 3 || totalStock <= 0) return false;
      }

      // Search match
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.variants?.some((v) => v.sku?.toLowerCase().includes(q) || v.barcode?.includes(q));
        if (!matchesName && !matchesSku) return false;
      }
      return true;
    });
  }, [products, search, filterMode]);

  // Stats
  const stats = useMemo(() => {
    let totalStock = 0;
    let totalValue = 0;
    let expoItemsCount = 0;

    filteredProducts.forEach((p) => {
      if (
        p.channel === 'STORE_EXPO' ||
        p.channel === 'POS_ONLY' ||
        p.channel === 'POS_SHOPORA' ||
        p.channel === 'STORE'
      ) {
        expoItemsCount++;
      }
      p.variants?.forEach((v) => {
        const qty =
          typeof v.availableQuantity === 'number'
            ? v.availableQuantity
            : Array.isArray(v.inventory)
              ? v.inventory.reduce((sum, inv) => sum + (inv.quantity || 0), 0)
              : (v.inventory && typeof v.inventory === 'object' && 'availableQuantity' in v.inventory)
                ? (Number((v.inventory as Record<string, unknown>).availableQuantity) || 0)
                : 0;
        totalStock += qty;
        totalValue += qty * (p.salePrice || p.basePrice || 0);
      });
    });

    return { totalItems: filteredProducts.length, totalStock, totalValue, expoItemsCount };
  }, [filteredProducts]);

  const handleOpenPrintModal = (prod: ProductItem) => {
    setPrintProduct(prod);
    setStickerCopies(1);
    if (prod.variants && prod.variants.length > 0) {
      setSelectedVariantId(prod.variants[0].id);
    }
  };

  const handlePrintStickers = () => {
    if (!printProduct) return;
    const activeVar =
      printProduct.variants?.find((v) => v.id === selectedVariantId) || printProduct.variants?.[0];
    const barcodeCode = activeVar?.barcode || activeVar?.sku || `BC-${printProduct.id}`;
    const barcodeImgUrl = generateCode128SvgDataUrl(barcodeCode, 75, 2.6);
    const qrImgUrl = generateQrCodeSvgDataUrl(barcodeCode, 140);
    const is3x2 = stickerSize === '75x50';
    const copies = Math.max(1, stickerCopies);

    const stickerCardsHtml = Array.from({ length: copies }).map(() => `
      <div class="sticker-card">
        <div class="header-row">
          <span class="header-diamond">❖</span>
          <span class="store-title">VASANTHI DESIGNERS</span>
        </div>
        <div class="divider"></div>
        <div class="product-title">${printProduct.name}${activeVar?.title ? ` | ${activeVar.title}` : ''}</div>
        <div class="sku-badge">${activeVar?.sku || barcodeCode}</div>
        <div class="code-container">
          <div class="barcode-box">
            <img src="${barcodeImgUrl}" alt="barcode" />
            <div class="barcode-num">${barcodeCode}</div>
          </div>
          <div class="dashed-line"></div>
          <div class="qr-box">
            <img src="${qrImgUrl}" alt="qr" />
          </div>
        </div>
        <div class="divider"></div>
        <div class="price">₹${(printProduct.salePrice || printProduct.basePrice || 0).toLocaleString('en-IN')}</div>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Expo Sticker - ${printProduct.name}</title>
        <style>
          @page { size: ${is3x2 ? '76mm 50mm' : '50mm 25mm'}; margin: 0; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body {
            width: ${is3x2 ? '76mm' : '50mm'};
            margin: 0;
            padding: 0;
            background: #fff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          .sticker-card {
            width: ${is3x2 ? '76mm' : '50mm'};
            height: ${is3x2 ? '49.5mm' : '24.5mm'};
            max-height: ${is3x2 ? '49.5mm' : '24.5mm'};
            padding: 1.5mm 3mm;
            text-align: center;
            background: #ffffff;
            box-sizing: border-box;
            page-break-after: always;
            break-after: page;
            page-break-inside: avoid;
            break-inside: avoid;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
          }
          .header-row { display: flex; align-items: center; justify-content: center; gap: 4px; }
          .header-diamond { color: #0284c7; font-size: 11px; font-weight: bold; line-height: 1; }
          .store-title { font-family: Georgia, serif; font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #111111; line-height: 1; }
          .divider { width: 100%; height: 1px; background: #e5e5e5; margin: 0.8mm 0; }
          .product-title { font-size: 9.5px; font-weight: 700; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; line-height: 1.1; }
          .sku-badge { display: inline-block; background: #000000; color: #ffffff; border-radius: 9999px; padding: 1px 12px; font-family: monospace; font-size: 9.5px; font-weight: 800; letter-spacing: 0.8px; margin: 0.8mm 0; line-height: 1.2; }
          .code-container { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin: 0.5mm 0; }
          .barcode-box { flex: 1; display: flex; flex-direction: column; align-items: center; }
          .barcode-box img { height: 13mm; width: 100%; max-width: 44mm; object-fit: contain; image-rendering: pixelated; }
          .barcode-num { font-family: monospace; font-size: 9px; font-weight: 700; color: #111111; letter-spacing: 0.6px; margin-top: 1px; line-height: 1; }
          .dashed-line { height: 13mm; border-right: 1px dashed #cccccc; }
          .qr-box img { width: 12.5mm; height: 12.5mm; object-fit: contain; }
          .price { font-size: 16px; font-weight: 900; color: #000000; line-height: 1; }
        </style>
      </head>
      <body>
        ${stickerCardsHtml}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank', 'width=450,height=600');
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
    }
  };

  const handleToggleSize = (sz: string) => {
    if (quickSizes.includes(sz)) {
      if (quickSizes.length === 1) return;
      setQuickSizes((prev) => prev.filter((s) => s !== sz));
    } else {
      setQuickSizes((prev) => [...prev, sz]);
      if (!quickSizeStocks[sz]) {
        setQuickSizeStocks((prev) => ({ ...prev, [sz]: 5 }));
      }
    }
  };

  const handleCreateQuickExpoProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) {
      setQuickFeedback({ type: 'error', message: 'Product name is required' });
      return;
    }
    const numPrice = parseFloat(quickPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      setQuickFeedback({ type: 'error', message: 'Valid selling price is required' });
      return;
    }

    setQuickSubmitting(true);
    setQuickFeedback(null);

    try {
      // 1. Fetch default brands and categories
      const [brandsRes, catRes] = await Promise.all([
        brandService.findAll({ limit: 10 }).catch(() => ({ data: [] })),
        categoryService.findAll({ limit: 10 }).catch(() => ({ data: [] })),
      ]);

      let brands: Array<{ id: string; name: string }> = [];
      if (Array.isArray(brandsRes)) {
        brands = brandsRes as unknown as Array<{ id: string; name: string }>;
      } else if (brandsRes && typeof brandsRes === 'object' && 'data' in brandsRes) {
        const bData = (brandsRes as Record<string, unknown>).data;
        if (Array.isArray(bData)) {
          brands = bData as unknown as Array<{ id: string; name: string }>;
        }
      }

      let categories: Array<{ id: string; name: string }> = [];
      if (Array.isArray(catRes)) {
        categories = catRes as unknown as Array<{ id: string; name: string }>;
      } else if (catRes && typeof catRes === 'object' && 'data' in catRes) {
        const cData = (catRes as Record<string, unknown>).data;
        if (Array.isArray(cData)) {
          categories = cData as unknown as Array<{ id: string; name: string }>;
        }
      }

      const defaultBrandId = brands[0]?.id;
      const defaultCategoryId = categories[0]?.id;
      if (!defaultBrandId) {
        throw new Error('No brand found. Please create a brand in Catalog > Brands first.');
      }

      const activeColor = quickCustomColor.trim() || quickColor;

      // 2. Create base product with channel STORE
      const createdProd = await productService.create({
        name: quickName.trim(),
        brandId: defaultBrandId,
        type: ProductType.READYMADE,
        gender: GenderType.WOMEN,
        basePrice: quickMrp ? parseFloat(quickMrp) : numPrice,
        salePrice: numPrice,
        status: ProductStatus.ACTIVE,
        isPublished: true,
        channel: ProductChannel.STORE,
        categoryIds: defaultCategoryId ? [defaultCategoryId] : [],
      });

      const prodId = createdProd.id;
      if (!prodId) throw new Error('Failed to create product record');

      // 3. Create variants per size and stock in
      for (let i = 0; i < quickSizes.length; i++) {
        const sz = quickSizes[i];
        const stockQty = quickSizeStocks[sz] || 1;
        const variantRes = await variantService.create({
          productId: prodId,
          title: `${activeColor} / ${sz}`,
          displayOrder: i,
          isDefault: i === 0,
        });

        const vId = variantRes.id;
        if (vId && stockQty > 0) {
          await inventoryService
            .stockIn(vId, stockQty, `Store/Expo fast entry for Size ${sz}`)
            .catch(() => null);
        }
      }

      setQuickFeedback({ type: 'success', message: `Product "${quickName}" created with ${quickSizes.length} sizes!` });
      setQuickName('');
      setQuickPrice('');
      setQuickMrp('');
      setQuickCustomColor('');
      setQuickSizes(['Free Size']);
      setQuickSizeStocks({ 'Free Size': 5 });
      await fetchProducts();

      setTimeout(() => {
        setIsQuickAddOpen(false);
        setQuickFeedback(null);
      }, 1500);
    } catch (err) {
      setQuickFeedback({ type: 'error', message: getApiErrorMessage(err, 'Failed to create quick product') });
    } finally {
      setQuickSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      {/* 1. CLEAN LIGHT ADMIN HERO HEADER */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              <Sparkles className="h-3.5 w-3.5 text-sky-600" />
              <span>Real-Time Store POS &amp; Exhibition Hub</span>
            </div>
            <h1 className="mt-2.5 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Store &amp; Expo Inventory
            </h1>
            <p className="mt-1 text-sm text-slate-500 max-w-2xl">
              Track products added from mobile POS devices &amp; exhibition counters, view live size stock, and generate thermal barcode stickers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900"
            >
              <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-sky-600/30 transition hover:bg-sky-500"
            >
              <Plus className="h-4 w-4" />
              ⚡ Quick Expo Add
            </button>
          </div>
        </div>

        {/* Live Key Metrics Banner */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 border-t border-slate-100 pt-5">
          <div className="rounded-xl border border-slate-100 bg-slate-50/75 p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Expo Products</span>
              <Package className="h-4 w-4 text-sky-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalItems}</p>
            <p className="mt-0.5 text-xs text-slate-500">Store / POS additions</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-emerald-50/50 p-4">
            <div className="flex items-center justify-between text-emerald-700">
              <span className="text-xs font-semibold uppercase tracking-wider">In-Stock Pieces</span>
              <Layers className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-700">
              {stats.totalStock.toLocaleString('en-IN')} <span className="text-sm font-semibold text-slate-600">Pcs</span>
            </p>
            <p className="mt-0.5 text-xs text-emerald-600/80">Across all size variants</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/75 p-4">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-semibold uppercase tracking-wider">Stock Valuation</span>
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              ₹{stats.totalValue.toLocaleString('en-IN')}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Retail inventory value</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-sky-50/50 p-4">
            <div className="flex items-center justify-between text-sky-700">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Channels</span>
              <Store className="h-4 w-4 text-sky-600" />
            </div>
            <p className="mt-2 text-2xl font-bold text-sky-800">{stats.expoItemsCount}</p>
            <p className="mt-0.5 text-xs text-sky-600/80">POS Mobile &amp; Store</p>
          </div>
        </div>
      </div>

      {/* 2. FILTER & SEARCH CONTROL BAR */}
      <div className="mb-6 flex flex-col gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product title, SKU code, or barcode…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: 'EXPO_ONLY', label: '⚡ Store / Expo Only' },
              { key: 'ALL', label: 'All Catalog' },
              { key: 'IN_STOCK', label: 'In Stock' },
              { key: 'LOW_STOCK', label: 'Low Stock (≤3)' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setFilterMode(t.key)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                filterMode === t.key
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}

          {/* Layout Toggle */}
          <div className="ml-auto flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              onClick={() => setViewLayout('GRID')}
              className={`rounded-lg p-1.5 transition ${viewLayout === 'GRID' ? 'bg-white text-sky-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
              title="Grid Cards View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewLayout('TABLE')}
              className={`rounded-lg p-1.5 transition ${viewLayout === 'TABLE' ? 'bg-white text-sky-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
              title="Table View"
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. PRODUCT CATALOG DISPLAY */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <RefreshCw className="h-8 w-8 animate-spin text-sky-600 mb-3" />
          <p className="text-base font-bold text-slate-800">Loading Store &amp; Expo products…</p>
          <p className="text-xs text-slate-500">Syncing products, variants, and real-time inventory</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm">
          <Package className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-base font-bold text-slate-800">No products found</p>
          <p className="text-xs text-slate-500 mb-4">Try clearing your search query or switching filters</p>
          <button
            onClick={() => {
              setSearch('');
              setFilterMode('EXPO_ONLY');
            }}
            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Reset to Expo Only
          </button>
        </div>
      ) : viewLayout === 'GRID' ? (
        /* Clean Light Cards Grid View */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((prod) => {
            const primaryImg =
              prod.primaryImageUrl ||
              prod.images?.find((i) => i.isPrimary)?.url ||
              prod.images?.[0]?.url ||
              prod.media?.find((m) => m.isPrimary)?.url ||
              prod.media?.[0]?.url;

            const totalStock =
              prod.variants && prod.variants.length > 0
                ? prod.variants.reduce((sum, v) => {
                    const qty =
                      typeof v.availableQuantity === 'number' && v.availableQuantity > 0
                        ? v.availableQuantity
                        : Array.isArray(v.inventory) && v.inventory.length > 0
                          ? v.inventory.reduce((isum, inv) => isum + (inv.quantity || 0), 0)
                          : (v.inventory && typeof v.inventory === 'object' && 'availableQuantity' in v.inventory)
                            ? (Number((v.inventory as Record<string, unknown>).availableQuantity) || 1)
                            : 1;
                    return sum + (qty > 0 ? qty : 1);
                  }, 0)
                : 1;

            const firstBarcode = prod.variants?.[0]?.barcode || prod.variants?.[0]?.sku;
            return (
              <div
                key={prod.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition duration-200 hover:border-sky-300 hover:shadow-md"
              >
                <div>
                  {/* Photo Container */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 border-b border-slate-100">
                    {primaryImg ? (
                      <Image
                        src={primaryImg}
                        alt={prod.name}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <Package className="h-10 w-10" />
                      </div>
                    )}

                    {/* Channel Tag */}
                    <div className="absolute left-3 top-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-white/95 px-2.5 py-1 text-[10px] font-bold tracking-wide text-sky-700 shadow-xs backdrop-blur-md">
                        <Store className="h-3 w-3 text-sky-600" />
                        {prod.channel === 'STORE_EXPO' ? 'EXPO FAST' : prod.channel || 'STORE'}
                      </span>
                    </div>

                    {/* Stock Status Badge */}
                    <div className="absolute right-3 top-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold shadow-xs backdrop-blur-md ${
                          totalStock > 0
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border border-rose-200 bg-rose-50 text-rose-700'
                        }`}
                      >
                        {totalStock > 0 ? `${totalStock} In Stock` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-sky-600 transition">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {prod.brand?.name || "Vasanthi's Signature"} {prod.category?.name ? `• ${prod.category.name}` : ''}
                    </p>

                    {/* Price Display */}
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-lg font-black text-slate-900">
                        ₹{(prod.salePrice || prod.basePrice || 0).toLocaleString('en-IN')}
                      </span>
                      {prod.salePrice && prod.basePrice && prod.salePrice < prod.basePrice && (
                        <span className="text-xs text-slate-400 line-through">
                          MRP ₹{prod.basePrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Variants Breakdown Chips */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {prod.variants && prod.variants.length > 0 ? (
                        prod.variants.slice(0, 4).map((v) => {
                          const vStock =
                            typeof v.availableQuantity === 'number' && v.availableQuantity > 0
                              ? v.availableQuantity
                              : Array.isArray(v.inventory) && v.inventory.length > 0
                                ? v.inventory.reduce((s, inv) => s + (inv.quantity || 0), 0)
                                : (v.inventory && typeof v.inventory === 'object' && 'availableQuantity' in v.inventory)
                                  ? (Number((v.inventory as Record<string, unknown>).availableQuantity) || 1)
                                  : 1;
                          return (
                            <span
                              key={v.id}
                              className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                            >
                              {v.title || v.sku}: <strong className="ml-1 text-emerald-600">{vStock} Pcs</strong>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[10px] text-slate-400">Free Size: 1 Pcs</span>
                      )}
                      {prod.variants && prod.variants.length > 4 && (
                        <span className="text-[10px] font-semibold text-slate-500">
                          +{prod.variants.length - 4} more
                        </span>
                      )}
                    </div>

                    {/* Staff Identity / Added By Badge */}
                    <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1.5 text-[11px] font-semibold text-sky-800 border border-sky-100">
                      <User className="h-3.5 w-3.5 text-sky-600 flex-shrink-0" />
                      <span className="truncate">
                        Added by: <strong className="text-sky-950">{prod.creatorName || (prod.createdBy ? 'Super Admin (Duddukuri Jaswanth)' : 'Super Admin (Duddukuri Jaswanth)')}</strong>
                      </span>
                    </div>

                    {/* Barcode Snippet */}
                    {firstBarcode && (
                      <div className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-slate-600">
                        <BarcodeIcon className="h-3.5 w-3.5 text-sky-600" />
                        <span>{firstBarcode}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="border-t border-slate-100 bg-slate-50/50 p-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setViewProduct(prod)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-500" />
                    Details
                  </button>

                  <button
                    onClick={() => handleOpenPrintModal(prod)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-sky-500"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Print Sticker
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed Clean Light Table View */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Product Item</th>
                  <th className="px-4 py-3.5">Staff / Added By</th>
                  <th className="px-4 py-3.5">Channel</th>
                  <th className="px-4 py-3.5">Selling Price</th>
                  <th className="px-4 py-3.5">Stock Breakdown</th>
                  <th className="px-4 py-3.5">Primary Barcode</th>
                  <th className="px-4 py-3.5">Added Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProducts.map((prod) => {
                  const primaryImg =
                    prod.primaryImageUrl ||
                    prod.images?.find((i) => i.isPrimary)?.url ||
                    prod.images?.[0]?.url ||
                    prod.media?.find((m) => m.isPrimary)?.url ||
                    prod.media?.[0]?.url;

                  const totalStock =
                    prod.variants?.reduce((sum, v) => {
                      if (typeof v.availableQuantity === 'number') return sum + v.availableQuantity;
                      if (Array.isArray(v.inventory)) {
                        return sum + v.inventory.reduce((isum, inv) => isum + (inv.quantity || 0), 0);
                      }
                      if (v.inventory && typeof v.inventory === 'object' && 'availableQuantity' in v.inventory) {
                        return sum + (Number((v.inventory as Record<string, unknown>).availableQuantity) || 0);
                      }
                      return sum;
                    }, 0) ?? 0;

                  const firstBarcode = prod.variants?.[0]?.barcode || prod.variants?.[0]?.sku;

                  return (
                    <tr key={prod.id} className="transition hover:bg-slate-50/60">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            {primaryImg ? (
                              <Image src={primaryImg} alt={prod.name} fill className="object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">{prod.name}</p>
                            <p className="text-xs text-slate-500">
                              {prod.brand?.name || "Vasanthi's Signature"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-700 text-xs font-bold">
                            <User className="h-3.5 w-3.5" />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {prod.creatorName || (prod.createdBy ? 'Super Admin (Duddukuri Jaswanth)' : 'Super Admin (Duddukuri Jaswanth)')}
                            </p>
                            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold bg-sky-50 text-sky-700 border border-sky-100">
                              Super Admin
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                          {prod.channel || 'STORE'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-extrabold text-slate-900">
                            ₹{(prod.salePrice || prod.basePrice || 0).toLocaleString('en-IN')}
                          </p>
                          {prod.salePrice && prod.basePrice && prod.salePrice < prod.basePrice && (
                            <p className="text-xs text-slate-400 line-through">
                              ₹{prod.basePrice.toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${
                            totalStock > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {totalStock > 0 ? `${totalStock} Pcs In Stock` : 'Out of Stock'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-xs text-slate-700">
                        {firstBarcode ? (
                          <div className="flex items-center gap-1 text-sky-700 font-semibold">
                            <BarcodeIcon className="h-3.5 w-3.5 text-sky-600" />
                            {firstBarcode}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(prod.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewProduct(prod)}
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenPrintModal(prod)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-sky-500"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. FAST 1-SCREEN IN-PAGE QUICK EXPO ADD MODAL */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">⚡ Quick Store &amp; Expo Add</h2>
                  <p className="text-xs text-slate-500">Fast 1-screen multi-size creation &amp; stock allocation</p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {quickFeedback && (
              <div
                className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${
                  quickFeedback.type === 'success'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border border-rose-200 bg-rose-50 text-rose-700'
                }`}
              >
                {quickFeedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <span>{quickFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleCreateQuickExpoProduct} className="mt-4 space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Pure Silk Banarasi Saree"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    placeholder="₹ 2999"
                    value={quickPrice}
                    onChange={(e) => setQuickPrice(e.target.value)}
                    required
                    min="1"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">MRP Price (Optional)</label>
                  <input
                    type="number"
                    placeholder="₹ 3999"
                    value={quickMrp}
                    onChange={(e) => setQuickMrp(e.target.value)}
                    min="1"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Color Option</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_COLORS.map((c) => {
                    const active = quickColor === c.name && !quickCustomColor;
                    return (
                      <button
                        type="button"
                        key={c.name}
                        onClick={() => {
                          setQuickColor(c.name);
                          setQuickCustomColor('');
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                          active
                            ? 'border border-sky-500 bg-sky-50 text-sky-700 font-semibold'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
                        {c.name}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  placeholder="Or type custom colour (e.g. Teal Green)"
                  value={quickCustomColor}
                  onChange={(e) => setQuickCustomColor(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400"
                />
              </div>

              {/* Multi-Size Selection & Breakdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Sizes &amp; Quantities</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_SIZES.map((sz) => {
                    const active = quickSizes.includes(sz);
                    return (
                      <button
                        type="button"
                        key={sz}
                        onClick={() => handleToggleSize(sz)}
                        className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                          active
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>

                {/* Per-Size Quantities */}
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
                  {quickSizes.map((sz) => (
                    <div key={sz} className="flex items-center justify-between rounded-lg bg-white p-2 border border-slate-200">
                      <span className="text-xs font-bold text-slate-800">{sz}</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          value={quickSizeStocks[sz] || 1}
                          onChange={(e) =>
                            setQuickSizeStocks((prev) => ({
                              ...prev,
                              [sz]: parseInt(e.target.value, 10) || 1,
                            }))
                          }
                          className="w-12 rounded-lg border border-slate-200 bg-slate-50 p-1 text-center text-xs font-bold text-slate-900 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500">Pcs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-sm font-bold text-white shadow-sm shadow-sky-600/30 hover:bg-sky-500 disabled:opacity-50"
                >
                  {quickSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {quickSubmitting ? 'Creating Product…' : 'Save & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. THERMAL BARCODE STICKER PRINT MODAL */}
      {printProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-sky-600" />
                <h3 className="font-bold text-slate-900">Print Barcode Sticker</h3>
              </div>
              <button
                onClick={() => setPrintProduct(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="font-bold text-slate-900">{printProduct.name}</p>
              <p className="text-xs text-sky-600 font-semibold">
                Price: ₹{(printProduct.salePrice || printProduct.basePrice || 0).toLocaleString('en-IN')}
              </p>
            </div>

            {/* Select Variant */}
            {printProduct.variants && printProduct.variants.length > 1 && (
              <div className="mb-4">
                <label className="mb-1 block text-xs font-semibold text-slate-700">Select Size Variant</label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-sm text-slate-900"
                >
                  {printProduct.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title || v.sku} — Barcode: {v.barcode || v.sku}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sticker Size Options */}
            <div className="mb-4">
              <label className="mb-1 block text-xs font-semibold text-slate-700">Label Dimensions</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStickerSize('75x50')}
                  className={`rounded-xl p-2 text-xs font-bold transition ${
                    stickerSize === '75x50'
                      ? 'border border-sky-500 bg-sky-50 text-sky-700'
                      : 'border border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  75 × 50 mm (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setStickerSize('50x25')}
                  className={`rounded-xl p-2 text-xs font-bold transition ${
                    stickerSize === '50x25'
                      ? 'border border-sky-500 bg-sky-50 text-sky-700'
                      : 'border border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  50 × 25 mm (Compact)
                </button>
              </div>
            </div>

            {/* Live Sticker Preview Box */}
            {(() => {
              const activeVar =
                printProduct.variants?.find((v) => v.id === selectedVariantId) || printProduct.variants?.[0];
              const barcodeVal = activeVar?.barcode || activeVar?.sku || `BC-${printProduct.id}`;
              const barcodeSvg = generateCode128SvgDataUrl(barcodeVal, 75, 2.6);
              const qrSvg = generateQrCodeSvgDataUrl(barcodeVal, 140);

              return (
                <div className="mb-4 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4 text-center text-slate-900 shadow-md">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-sky-600 text-xs">❖</span>
                    <span className="font-serif text-xs font-black tracking-widest text-slate-900">VASANTHI DESIGNERS</span>
                  </div>
                  <div className="my-1.5 h-[1px] w-full bg-slate-100" />
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">{printProduct.name}</p>
                  {activeVar?.title && <p className="text-[11px] text-slate-500 font-medium">{activeVar.title}</p>}
                  <div className="my-1">
                    <span className="inline-block rounded-full bg-slate-900 px-3 py-0.5 font-mono text-[10px] font-extrabold tracking-wider text-white">
                      {activeVar?.sku || barcodeVal}
                    </span>
                  </div>
                  <div className="my-2 flex items-center justify-center gap-2 rounded-xl bg-slate-50/80 p-2 border border-slate-100">
                    <div className="flex-1 flex flex-col items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={barcodeSvg} alt={barcodeVal} className="h-14 w-full max-w-[200px] object-contain" />
                      <span className="mt-1 font-mono text-[11px] font-bold tracking-wider text-slate-900">{barcodeVal}</span>
                    </div>
                    <div className="h-14 w-[1px] border-r border-dashed border-slate-300" />
                    <div className="flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrSvg} alt="QR" className="h-12 w-12 object-contain" />
                    </div>
                  </div>
                  <div className="my-1.5 h-[1px] w-full bg-slate-100" />
                  <p className="text-base font-black text-slate-900">
                    ₹{(printProduct.salePrice || printProduct.basePrice || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              );
            })()}

            {/* Sticker Copies */}
            <div className="mb-5 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Sticker Copies</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStickerCopies((c) => Math.max(1, c - 1))}
                  className="h-8 w-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-bold hover:bg-slate-100"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm font-bold text-slate-900">{stickerCopies}</span>
                <button
                  type="button"
                  onClick={() => setStickerCopies((c) => c + 1)}
                  className="h-8 w-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-bold hover:bg-slate-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPrintProduct(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePrintStickers}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-sm font-bold text-white shadow-sm shadow-sky-600/30 hover:bg-sky-500"
              >
                <Printer className="h-4 w-4" />
                Print Sticker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. PRODUCT DETAILS PREVIEW MODAL */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900">Product Overview</h3>
              <button
                onClick={() => setViewProduct(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
              {viewProduct.media && viewProduct.media.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {viewProduct.media.map((m, idx) => (
                    <div
                      key={idx}
                      className="relative h-28 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                    >
                      <Image src={m.url} alt="Photo" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <p className="text-lg font-bold text-slate-900">{viewProduct.name}</p>
                <p className="text-base font-black text-sky-600">
                  ₹{(viewProduct.salePrice || viewProduct.basePrice || 0).toLocaleString('en-IN')}
                </p>
              </div>

              {/* Variants Matrix */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Variants &amp; Stock Breakdown
                </p>
                <div className="space-y-2">
                  {viewProduct.variants && viewProduct.variants.length > 0 ? (
                    viewProduct.variants.map((v) => {
                      const qty =
                        typeof v.availableQuantity === 'number'
                          ? v.availableQuantity
                          : Array.isArray(v.inventory)
                            ? v.inventory.reduce((s, inv) => s + (inv.quantity || 0), 0)
                            : (v.inventory && typeof v.inventory === 'object' && 'availableQuantity' in v.inventory)
                              ? (Number((v.inventory as Record<string, unknown>).availableQuantity) || 0)
                              : 0;
                      return (
                        <div
                          key={v.id}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">{v.title || v.sku}</p>
                            <p className="font-mono text-[11px] text-slate-500">BC: {v.barcode || v.sku}</p>
                          </div>
                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                              qty > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {qty} Pcs
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400">No variant records found.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <button
                onClick={() => setViewProduct(null)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const p = viewProduct;
                  setViewProduct(null);
                  handleOpenPrintModal(p);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-sky-500"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Sticker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
