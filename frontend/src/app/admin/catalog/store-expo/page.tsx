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
} from 'lucide-react';
import { productService } from '@/features/catalog/products/product.service';
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
  media?: Array<{ url: string; isPrimary: boolean; color?: string }>;
  variants?: Array<{
    id: string;
    sku: string;
    barcode?: string;
    title?: string;
    price?: number;
    inventory?: Array<{ quantity: number }>;
  }>;
}

export default function StoreExpoInventoryPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'ALL' | 'STORE_EXPO'>('ALL');

  // Barcode Print Modal State
  const [printProduct, setPrintProduct] = useState<ProductItem | null>(null);
  const [stickerCopies, setStickerCopies] = useState<number>(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');

  // Product Details Modal
  const [viewProduct, setViewProduct] = useState<ProductItem | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await productService.findAll({ limit: 100 });
      const items: ProductItem[] = Array.isArray(res) ? res : (res as any)?.data ?? [];
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
      // Channel match
      if (selectedChannel === 'STORE_EXPO') {
        const isExpo = p.channel === 'STORE_EXPO' || p.channel === 'POS_ONLY' || p.channel === 'POS_SHOPORA';
        if (!isExpo) return false;
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
  }, [products, search, selectedChannel]);

  // Stats
  const stats = useMemo(() => {
    let totalStock = 0;
    let totalValue = 0;
    let expoItemsCount = 0;

    filteredProducts.forEach((p) => {
      if (p.channel === 'STORE_EXPO' || p.channel === 'POS_ONLY') expoItemsCount++;
      p.variants?.forEach((v) => {
        const qty = v.inventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) ?? 0;
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

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Top Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/20">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Store &amp; Expo Inventory</h1>
              <p className="text-sm text-slate-500">
                Track products added from store mobile POS &amp; exhibition counters, stock levels, and print barcode stickers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/admin/catalog/products/new"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-600/30 transition hover:bg-sky-500"
          >
            <Plus className="h-4 w-4" />
            Add Full Product
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Products</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalItems}</p>
          <p className="mt-1 text-xs text-slate-500">Active catalog items</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Units in Stock</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalStock.toLocaleString('en-IN')} Pcs</p>
          <p className="mt-1 text-xs text-slate-500">Across all variants</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Inventory Value</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">₹{stats.totalValue.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-xs text-slate-500">Estimated retail value</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Channel Mode</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.expoItemsCount}</p>
          <p className="mt-1 text-xs text-slate-500">Store / Expo fast additions</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name, SKU, or barcode…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedChannel('ALL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              selectedChannel === 'ALL'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Inventory
          </button>
          <button
            onClick={() => setSelectedChannel('STORE_EXPO')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              selectedChannel === 'STORE_EXPO'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Store / Expo Only
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50/75 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Price (₹)</th>
                <th className="px-4 py-3">Variants &amp; Stock</th>
                <th className="px-4 py-3">Barcodes</th>
                <th className="px-4 py-3">Added Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin text-sky-600" />
                    Loading Store &amp; Expo products…
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <Package className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                    No products found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const primaryImg = p.media?.find((m) => m.isPrimary)?.url || p.media?.[0]?.url;
                  const totalStock = p.variants?.reduce(
                    (sum, v) => sum + (v.inventory?.reduce((isum, inv) => isum + (inv.quantity || 0), 0) ?? 0),
                    0,
                  ) ?? 0;

                  return (
                    <tr key={p.id} className="transition hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                            {primaryImg ? (
                              <Image src={primaryImg} alt={p.name} fill className="object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{p.name}</p>
                            <p className="text-xs text-slate-500">
                              {p.brand?.name || 'Vasanthi’s Signature'} {p.category?.name ? `• ${p.category.name}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                            p.channel === 'STORE_EXPO' || p.channel === 'POS_ONLY'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.channel || 'ONLINE_AND_POS'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div>
                          <p className="font-bold text-slate-900">
                            ₹{(p.salePrice || p.basePrice || 0).toLocaleString('en-IN')}
                          </p>
                          {p.salePrice && p.basePrice && p.salePrice < p.basePrice && (
                            <p className="text-xs text-slate-400 line-through">
                              MRP ₹{p.basePrice.toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex w-fit items-center rounded-md px-2 py-0.5 text-xs font-bold ${
                              totalStock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {totalStock > 0 ? `${totalStock} Pcs In Stock` : 'Out of Stock'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {p.variants?.length || 0} Variant{(p.variants?.length ?? 0) === 1 ? '' : 's'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {p.variants?.[0]?.barcode ? (
                          <div className="flex items-center gap-1.5 text-sky-700 font-semibold">
                            <QrCode className="h-3.5 w-3.5" />
                            {p.variants[0].barcode}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(p.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenPrintModal(p)}
                            title="Print Barcode Stickers"
                            className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Print
                          </button>
                          <button
                            onClick={() => setViewProduct(p)}
                            title="View Details"
                            className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/admin/catalog/products/${p.id}/edit`}
                            title="Edit Product"
                            className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BARCODE STICKER PRINT MODAL */}
      {printProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-sky-600" />
                <h3 className="font-bold text-slate-900">Print Barcode Sticker</h3>
              </div>
              <button
                onClick={() => setPrintProduct(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="font-semibold text-slate-900">{printProduct.name}</p>
              <p className="text-xs text-slate-500">
                Price: ₹{(printProduct.salePrice || printProduct.basePrice || 0).toLocaleString('en-IN')}
              </p>
            </div>

            {/* Select Variant */}
            {printProduct.variants && printProduct.variants.length > 1 && (
              <div className="mb-4">
                <label className="mb-1 block text-xs font-semibold text-slate-700">Select Variant</label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-800"
                >
                  {printProduct.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title || v.sku} — Barcode: {v.barcode || v.sku}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sticker Preview Box */}
            {(() => {
              const activeVar = printProduct.variants?.find((v) => v.id === selectedVariantId) || printProduct.variants?.[0];
              const barcodeVal = activeVar?.barcode || activeVar?.sku || `BC-${printProduct.id}`;
              const barcodeSvg = generateCode128SvgDataUrl(barcodeVal);

              return (
                <div className="mb-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                  <p className="text-xs font-bold tracking-wider text-slate-800 uppercase">VASANTHI&apos;S SIGNATURE</p>
                  <p className="text-sm font-semibold text-slate-900">{printProduct.name}</p>
                  {activeVar?.title && <p className="text-xs text-slate-600">{activeVar.title}</p>}
                  
                  {/* Barcode Image */}
                  <div className="my-2 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={barcodeSvg} alt={barcodeVal} className="h-14 max-w-full object-contain" />
                  </div>
                  <p className="font-mono text-xs font-bold text-slate-700">{barcodeVal}</p>
                  <p className="mt-1 text-sm font-extrabold text-sky-700">
                    ₹{(printProduct.salePrice || printProduct.basePrice || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              );
            })()}

            <div className="mb-6 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Number of Stickers to Print</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStickerCopies((c) => Math.max(1, c - 1))}
                  className="h-8 w-8 rounded-lg border border-slate-200 bg-slate-50 font-bold hover:bg-slate-100"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm font-bold text-slate-800">{stickerCopies}</span>
                <button
                  type="button"
                  onClick={() => setStickerCopies((c) => c + 1)}
                  className="h-8 w-8 rounded-lg border border-slate-200 bg-slate-50 font-bold hover:bg-slate-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPrintProduct(null)}
                className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePrintStickers}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-600/30 hover:bg-sky-500"
              >
                <Printer className="h-4 w-4" />
                Print Sticker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT DETAILS VIEW MODAL */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900">Product Details</h3>
              <button
                onClick={() => setViewProduct(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-4">
              {viewProduct.media && viewProduct.media.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {viewProduct.media.map((m, idx) => (
                    <div key={idx} className="relative h-28 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200">
                      <Image src={m.url} alt="Photo" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <p className="text-lg font-bold text-slate-900">{viewProduct.name}</p>
                <p className="text-base font-extrabold text-sky-600">
                  ₹{(viewProduct.salePrice || viewProduct.basePrice || 0).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-500">Channel:</span>
                  <span className="font-semibold text-slate-900">{viewProduct.channel || 'ONLINE_AND_POS'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-500">Brand:</span>
                  <span className="font-semibold text-slate-900">{viewProduct.brand?.name || 'Vasanthi’s Signature'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-500">Category:</span>
                  <span className="font-semibold text-slate-900">{viewProduct.category?.name || '—'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-semibold text-emerald-600">{viewProduct.status}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 py-1.5">
                  <span className="text-slate-500">Created At:</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(viewProduct.createdAt).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Variants Breakdown */}
              {viewProduct.variants && viewProduct.variants.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Variants &amp; Stock</h4>
                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {viewProduct.variants.map((v) => {
                      const vStock = v.inventory?.reduce((s, inv) => s + (inv.quantity || 0), 0) ?? 0;
                      return (
                        <div key={v.id} className="flex items-center justify-between p-2.5 text-xs">
                          <div>
                            <p className="font-semibold text-slate-900">{v.title || v.sku}</p>
                            <p className="font-mono text-[11px] text-slate-500">Barcode: {v.barcode || v.sku}</p>
                          </div>
                          <span className="font-bold text-slate-800">{vStock} Pcs</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setViewProduct(null)}
                className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = viewProduct;
                  setViewProduct(null);
                  handleOpenPrintModal(p);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500"
              >
                <Printer className="h-4 w-4" />
                Print Stickers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
