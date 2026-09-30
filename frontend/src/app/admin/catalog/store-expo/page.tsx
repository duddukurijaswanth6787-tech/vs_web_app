'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Store,
  Package,
  Search,
  Filter,
  Printer,
  Plus,
  RefreshCw,
  QrCode,
  Tag,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Eye,
  Edit,
  Sparkles,
  DollarSign,
  TrendingUp,
  X,
  LayoutGrid,
  Table as TableIcon,
  Check,
  Trash2,
  Boxes,
  Palette,
  Barcode as BarcodeIcon,
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
import { attributeService } from '@/features/catalog/attributes/attribute.service';
import { inventoryService } from '@/features/inventory/inventory.service';
import { getApiErrorMessage } from '@/utils/api-error';
import { generateCode128SvgDataUrl, generateQrCodeSvgDataUrl } from '@/utils/barcode-generator';

interface ProductItem {
  id: string;
  name: string;
  slug?: string;
  basePrice: number;
  salePrice?: number;
  channel?: string;
  status: string;
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
  const [filterMode, setFilterMode] = useState<'ALL' | 'EXPO_ONLY' | 'IN_STOCK' | 'LOW_STOCK'>('EXPO_ONLY');
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
    window.print();
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

      // 2. Create base product with channel STORE_EXPO
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
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* 1. DISTINCT MODERN HERO HEADER */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-br from-slate-900 via-sky-950 to-indigo-950 p-6 sm:p-8 shadow-2xl shadow-sky-950/50">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              <span>Real-Time Catalog &amp; Exhibition Hub</span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Store &amp; Expo Inventory
            </h1>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              Manage fast additions from mobile POS devices &amp; exhibition counters, monitor live stock levels, and generate instant thermal barcode stickers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 shadow-sm backdrop-blur-md transition hover:bg-slate-700 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 text-sky-400 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/30 transition hover:from-sky-400 hover:to-blue-500 hover:shadow-sky-500/50"
            >
              <Plus className="h-4 w-4" />
              ⚡ Quick Expo Add
            </button>
          </div>
        </div>

        {/* Live Key Metrics Banner */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 border-t border-slate-800/80 pt-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Products</span>
              <Package className="h-4 w-4 text-sky-400" />
            </div>
            <p className="mt-2 text-2xl font-black text-white">{stats.totalItems}</p>
            <p className="mt-0.5 text-xs text-slate-400">Active catalog items</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">In-Stock Pieces</span>
              <Layers className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-400">
              {stats.totalStock.toLocaleString('en-IN')} <span className="text-sm font-semibold text-slate-400">Pcs</span>
            </p>
            <p className="mt-0.5 text-xs text-slate-400">Across all size variants</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Stock Valuation</span>
              <TrendingUp className="h-4 w-4 text-amber-400" />
            </div>
            <p className="mt-2 text-2xl font-black text-amber-400">
              ₹{stats.totalValue.toLocaleString('en-IN')}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">Retail merchandise value</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Expo Additions</span>
              <Store className="h-4 w-4 text-purple-400" />
            </div>
            <p className="mt-2 text-2xl font-black text-purple-400">{stats.expoItemsCount}</p>
            <p className="mt-0.5 text-xs text-slate-400">Fast store / booth items</p>
          </div>
        </div>
      </div>

      {/* 2. FILTER & SEARCH CONTROL BAR */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product title, SKU code, or barcode…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-400 focus:border-sky-500 focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: 'ALL', label: 'All Catalog' },
              { key: 'EXPO_ONLY', label: '⚡ Store / Expo Only' },
              { key: 'IN_STOCK', label: 'In Stock' },
              { key: 'LOW_STOCK', label: 'Low Stock (≤3)' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setFilterMode(t.key)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                filterMode === t.key
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                  : 'border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}

          {/* Layout Toggle */}
          <div className="ml-auto flex items-center rounded-xl border border-slate-700 bg-slate-800 p-1">
            <button
              onClick={() => setViewLayout('GRID')}
              className={`rounded-lg p-1.5 transition ${viewLayout === 'GRID' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Grid Cards View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewLayout('TABLE')}
              className={`rounded-lg p-1.5 transition ${viewLayout === 'TABLE' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Table View"
            >
              <TableIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. PRODUCT CATALOG DISPLAY */}
      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/50 p-16 text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-sky-400 mb-3" />
          <p className="text-base font-bold text-slate-200">Loading catalog items…</p>
          <p className="text-xs text-slate-400">Syncing products, variants, and stock levels</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/50 p-16 text-center">
          <Package className="h-12 w-12 text-slate-600 mb-3" />
          <p className="text-base font-bold text-slate-200">No products found</p>
          <p className="text-xs text-slate-400 mb-4">Try clearing your search query or filter</p>
          <button
            onClick={() => {
              setSearch('');
              setFilterMode('ALL');
            }}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            Reset Filters
          </button>
        </div>
      ) : viewLayout === 'GRID' ? (
        /* Modern Cards Grid View */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              <div
                key={prod.id}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 transition duration-200 hover:border-sky-500/50 hover:shadow-xl hover:shadow-sky-950/40"
              >
                <div>
                  {/* Photo Container */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
                    {primaryImg ? (
                      <Image
                        src={primaryImg}
                        alt={prod.name}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-700">
                        <Package className="h-10 w-10" />
                      </div>
                    )}

                    {/* Channel Tag */}
                    <div className="absolute left-3 top-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-slate-900/80 px-2.5 py-1 text-[10px] font-bold tracking-wide text-sky-300 backdrop-blur-md">
                        <Store className="h-3 w-3 text-sky-400" />
                        {prod.channel === 'STORE_EXPO' ? 'EXPO FAST' : prod.channel || 'STORE'}
                      </span>
                    </div>

                    {/* Stock Status Badge */}
                    <div className="absolute right-3 top-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-md ${
                          totalStock > 0
                            ? 'border border-emerald-500/30 bg-emerald-950/80 text-emerald-300'
                            : 'border border-rose-500/30 bg-rose-950/80 text-rose-300'
                        }`}
                      >
                        {totalStock > 0 ? `${totalStock} In Stock` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-white text-base line-clamp-1 group-hover:text-sky-300 transition">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {prod.brand?.name || "Vasanthi's Signature"} {prod.category?.name ? `• ${prod.category.name}` : ''}
                    </p>

                    {/* Price Display */}
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-lg font-black text-sky-400">
                        ₹{(prod.salePrice || prod.basePrice || 0).toLocaleString('en-IN')}
                      </span>
                      {prod.salePrice && prod.basePrice && prod.salePrice < prod.basePrice && (
                        <span className="text-xs text-slate-500 line-through">
                          MRP ₹{prod.basePrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    {/* Variants Breakdown Chips */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {prod.variants && prod.variants.length > 0 ? (
                        prod.variants.slice(0, 4).map((v) => {
                          const vStock =
                            typeof v.availableQuantity === 'number'
                              ? v.availableQuantity
                              : Array.isArray(v.inventory)
                                ? v.inventory.reduce((s, inv) => s + (inv.quantity || 0), 0)
                                : (v.inventory && typeof v.inventory === 'object' && 'availableQuantity' in v.inventory)
                                  ? (Number((v.inventory as Record<string, unknown>).availableQuantity) || 0)
                                  : 0;
                          return (
                            <span
                              key={v.id}
                              className="inline-flex items-center rounded-lg border border-slate-700/80 bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                            >
                              {v.title || v.sku}: <strong className="ml-1 text-sky-300">{vStock}</strong>
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[10px] text-slate-500">No variant details</span>
                      )}
                      {prod.variants && prod.variants.length > 4 && (
                        <span className="text-[10px] font-semibold text-slate-400">
                          +{prod.variants.length - 4} more
                        </span>
                      )}
                    </div>

                    {/* Barcode Snippet */}
                    {firstBarcode && (
                      <div className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                        <BarcodeIcon className="h-3.5 w-3.5 text-sky-400" />
                        <span>{firstBarcode}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="border-t border-slate-800/80 bg-slate-950/40 p-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setViewProduct(prod)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                    Details
                  </button>

                  <button
                    onClick={() => handleOpenPrintModal(prod)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 py-2 text-xs font-bold text-white shadow-md shadow-sky-600/30 transition hover:bg-sky-500"
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
        /* Detailed Table View */
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 shadow-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-4">Product Item</th>
                  <th className="px-4 py-4">Channel</th>
                  <th className="px-4 py-4">Selling Price</th>
                  <th className="px-4 py-4">Stock Breakdown</th>
                  <th className="px-4 py-4">Primary Barcode</th>
                  <th className="px-4 py-4">Added Date</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
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
                    <tr key={prod.id} className="transition hover:bg-slate-800/40">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                            {primaryImg ? (
                              <Image src={primaryImg} alt={prod.name} fill className="object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-600">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white line-clamp-1">{prod.name}</p>
                            <p className="text-xs text-slate-400">
                              {prod.brand?.name || "Vasanthi's Signature"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-300">
                          {prod.channel || 'STORE_EXPO'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div>
                          <p className="font-extrabold text-sky-400">
                            ₹{(prod.salePrice || prod.basePrice || 0).toLocaleString('en-IN')}
                          </p>
                          {prod.salePrice && prod.basePrice && prod.salePrice < prod.basePrice && (
                            <p className="text-xs text-slate-500 line-through">
                              ₹{prod.basePrice.toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${
                            totalStock > 0 ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {totalStock > 0 ? `${totalStock} Pcs In Stock` : 'Out of Stock'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-xs text-slate-300">
                        {firstBarcode ? (
                          <div className="flex items-center gap-1 text-sky-400">
                            <BarcodeIcon className="h-3.5 w-3.5" />
                            {firstBarcode}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-500" />
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
                            className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenPrintModal(prod)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-sky-500"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-sky-500/30 bg-slate-900 p-6 shadow-2xl shadow-sky-950/60">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">⚡ Quick Store &amp; Expo Add</h2>
                  <p className="text-xs text-slate-400">Fast 1-screen multi-size creation &amp; stock allocation</p>
                </div>
              </div>
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {quickFeedback && (
              <div
                className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-xs font-semibold ${
                  quickFeedback.type === 'success'
                    ? 'border border-emerald-500/30 bg-emerald-950/80 text-emerald-300'
                    : 'border border-rose-500/30 bg-rose-950/80 text-rose-300'
                }`}
              >
                {quickFeedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <span>{quickFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleCreateQuickExpoProduct} className="mt-4 space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Pure Silk Banarasi Saree"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    placeholder="₹ 2999"
                    value={quickPrice}
                    onChange={(e) => setQuickPrice(e.target.value)}
                    required
                    min="1"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">MRP Price (Optional)</label>
                  <input
                    type="number"
                    placeholder="₹ 3999"
                    value={quickMrp}
                    onChange={(e) => setQuickMrp(e.target.value)}
                    min="1"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Color Option</label>
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
                            ? 'border border-sky-400 bg-sky-500/20 text-white shadow-sm'
                            : 'border border-slate-800 bg-slate-800/60 text-slate-400 hover:text-white'
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
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-2 text-xs text-white placeholder-slate-500"
                />
              </div>

              {/* Multi-Size Selection & Breakdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Sizes &amp; Quantities</label>
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
                            ? 'bg-sky-500 text-white shadow-sm'
                            : 'border border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>

                {/* Per-Size Quantities */}
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 sm:grid-cols-3">
                  {quickSizes.map((sz) => (
                    <div key={sz} className="flex items-center justify-between rounded-xl bg-slate-900 p-2 border border-slate-800">
                      <span className="text-xs font-bold text-sky-300">{sz}</span>
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
                          className="w-12 rounded-lg border border-slate-700 bg-slate-800 p-1 text-center text-xs font-bold text-white focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400">Pcs</span>
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
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/30 hover:bg-sky-400 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-sky-400" />
                <h3 className="font-bold text-white">Print Barcode Sticker</h3>
              </div>
              <button
                onClick={() => setPrintProduct(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="font-bold text-white">{printProduct.name}</p>
              <p className="text-xs text-sky-400">
                Price: ₹{(printProduct.salePrice || printProduct.basePrice || 0).toLocaleString('en-IN')}
              </p>
            </div>

            {/* Select Variant */}
            {printProduct.variants && printProduct.variants.length > 1 && (
              <div className="mb-4">
                <label className="mb-1 block text-xs font-semibold text-slate-300">Select Size Variant</label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 p-2 text-sm text-slate-100"
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
              <label className="mb-1 block text-xs font-semibold text-slate-300">Label Dimensions</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStickerSize('75x50')}
                  className={`rounded-xl p-2 text-xs font-bold transition ${
                    stickerSize === '75x50'
                      ? 'border border-sky-400 bg-sky-500/20 text-white'
                      : 'border border-slate-800 bg-slate-800/60 text-slate-400'
                  }`}
                >
                  75 × 50 mm (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setStickerSize('50x25')}
                  className={`rounded-xl p-2 text-xs font-bold transition ${
                    stickerSize === '50x25'
                      ? 'border border-sky-400 bg-sky-500/20 text-white'
                      : 'border border-slate-800 bg-slate-800/60 text-slate-400'
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
              const barcodeSvg = generateCode128SvgDataUrl(barcodeVal);

              return (
                <div className="mb-4 rounded-2xl border border-dashed border-slate-600 bg-white p-4 text-center text-slate-900 shadow-inner">
                  <p className="text-[11px] font-black tracking-widest uppercase text-slate-900">
                    VASANTHI&apos;S SIGNATURE
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-slate-800 line-clamp-1">{printProduct.name}</p>
                  {activeVar?.title && <p className="text-[10px] text-slate-600 font-medium">{activeVar.title}</p>}

                  {/* Barcode Render */}
                  <div className="my-2 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={barcodeSvg} alt={barcodeVal} className="h-12 max-w-full object-contain" />
                  </div>
                  <p className="font-mono text-xs font-bold tracking-wider text-slate-900">{barcodeVal}</p>
                  <p className="mt-1 text-sm font-black text-sky-700">
                    ₹{(printProduct.salePrice || printProduct.basePrice || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              );
            })()}

            {/* Sticker Copies */}
            <div className="mb-5 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Sticker Copies</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStickerCopies((c) => Math.max(1, c - 1))}
                  className="h-8 w-8 rounded-lg border border-slate-700 bg-slate-800 text-white font-bold hover:bg-slate-700"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm font-bold text-white">{stickerCopies}</span>
                <button
                  type="button"
                  onClick={() => setStickerCopies((c) => c + 1)}
                  className="h-8 w-8 rounded-lg border border-slate-700 bg-slate-800 text-white font-bold hover:bg-slate-700"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPrintProduct(null)}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePrintStickers}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/30 hover:bg-sky-400"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white">Product Overview</h3>
              <button
                onClick={() => setViewProduct(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
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
                      className="relative h-28 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-950"
                    >
                      <Image src={m.url} alt="Photo" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <p className="text-lg font-bold text-white">{viewProduct.name}</p>
                <p className="text-base font-black text-sky-400">
                  ₹{(viewProduct.salePrice || viewProduct.basePrice || 0).toLocaleString('en-IN')}
                </p>
              </div>

              {/* Variants Matrix */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
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
                          className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3"
                        >
                          <div>
                            <p className="text-xs font-bold text-white">{v.title || v.sku}</p>
                            <p className="font-mono text-[11px] text-slate-400">BC: {v.barcode || v.sku}</p>
                          </div>
                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                              qty > 0 ? 'bg-emerald-950/80 text-emerald-300' : 'bg-rose-950/80 text-rose-300'
                            }`}
                          >
                            {qty} Pcs
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500">No variant records found.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-800 pt-3">
              <button
                onClick={() => setViewProduct(null)}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const p = viewProduct;
                  setViewProduct(null);
                  handleOpenPrintModal(p);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-500 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-500/30 hover:bg-sky-400"
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
