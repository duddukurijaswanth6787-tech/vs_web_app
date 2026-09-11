'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  useInventoryList,
  useInventorySummary,
  useIncreaseStock,
} from '@/features/inventory/inventory.hooks';
import type { InventoryResponse } from '@/features/inventory/inventory.types';
import { StockStatusBadge } from '@/components/feedback/StatusBadges';
import {
  Sliders,
  Search,
  ArrowLeftRight,
  Activity,
  TrendingDown,
  AlertTriangle,
  Package2,
  Plus,
  RefreshCw,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Store,
  Globe,
  Edit3,
  Barcode,
  Tag,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import StockActionDialog from '@/features/inventory/components/StockActionDialog';
import UpdateInventoryDialog from '@/features/inventory/components/UpdateInventoryDialog';
import ProductStockModal, { GroupedProductInventory } from '@/features/inventory/components/ProductStockModal';
import QuickEditProductDialog, { QuickEditProductData } from '@/features/inventory/components/QuickEditProductDialog';
import { useAuth } from '@/hooks/useAuth';
import { ButtonLoader } from '@/components/feedback/FeedbackStates';

import { useProducts } from '@/features/catalog/products/product.hooks';
import type { ProductResponse } from '@/features/catalog/products/product.types';

type ChannelTab = 'ALL' | 'POS_STORE' | 'ONLINE_WEB';

export default function InventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const stockStatus = searchParams.get('stockStatus') || '';

  const [channelTab, setChannelTab] = useState<ChannelTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());

  // Dialog states
  const [stockModalProduct, setStockModalProduct] = useState<GroupedProductInventory | null>(null);
  const [editProductData, setEditProductData] = useState<QuickEditProductData | null>(null);
  const [actionItem, setActionItem] = useState<InventoryResponse | null>(null);
  const [settingsItem, setSettingsItem] = useState<InventoryResponse | null>(null);
  const [quickIncrementId, setQuickIncrementId] = useState<string | null>(null);
  const [bannerNotice, setBannerNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: summary, isLoading: isSummaryLoading, refetch: refetchSummary } = useInventorySummary();
  const {
    data: listData,
    isLoading: isListLoading,
    refetch: refetchList,
  } = useInventoryList({
    page,
    limit: 100,
    stockStatus: stockStatus || undefined,
  });

  const { data: productsData, isLoading: isProductsLoading, refetch: refetchProducts } = useProducts({
    limit: 100,
  });

  const increaseMut = useIncreaseStock();

  const isEditor = user?.roles?.some((r) => ['super_admin', 'admin'].includes(r));
  const inventories = listData?.data ?? [];
  const catalogProducts = productsData?.data ?? [];

  // Group variants by parent product and sync with live catalog products
  const groupedProducts = useMemo(() => {
    // If catalog products are loaded, use catalog products as primary source of truth
    if (catalogProducts.length > 0) {
      return catalogProducts.map((prod: ProductResponse) => {
        // Find matching inventory items for this product
        const matchingVariants = inventories.filter(
          (inv) =>
            inv.variant?.productId === prod.id ||
            inv.variant?.productName?.toLowerCase() === prod.name.toLowerCase()
        );

        const totalAvailable = matchingVariants.reduce((sum, v) => sum + v.availableQuantity, 0);
        const totalReserved = matchingVariants.reduce((sum, v) => sum + v.reservedQuantity, 0);

        const hasOutOfStock = matchingVariants.length === 0 || matchingVariants.some((v) => v.availableQuantity <= 0);
        const hasLowStock = matchingVariants.some(
          (v) => v.availableQuantity > 0 && v.availableQuantity <= (v.minimumStock || 5)
        );

        let overallStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
        if (totalAvailable <= 0 || matchingVariants.length === 0) {
          overallStatus = 'OUT_OF_STOCK';
        } else if (hasOutOfStock || hasLowStock || totalAvailable <= 10) {
          overallStatus = 'LOW_STOCK';
        }

        const primaryImg =
          prod.primaryImageUrl ||
          prod.images?.find((img) => img.isPrimary)?.url ||
          prod.images?.[0]?.url;

        return {
          productId: prod.id,
          productName: prod.name,
          category: prod.categories?.[0]?.categoryName || prod.brandName,
          brand: prod.brandName,
          imageUrl: primaryImg,
          channel: prod.channel || 'BOTH',
          totalAvailable,
          totalReserved,
          overallStatus,
          variants: matchingVariants,
        };
      });
    }

    // Fallback if catalog query is loading or empty
    const map = new Map<string, GroupedProductInventory>();

    inventories.forEach((item) => {
      const v = item.variant;
      if (!v?.productName) return; // Skip orphan items
      const productId = v.productId || item.variantId;
      const productName = v.productName;

      if (!map.has(productId)) {
        map.set(productId, {
          productId,
          productName,
          category: (v as any)?.categoryName || (v as any)?.category,
          brand: (v as any)?.brandName || (v as any)?.brand,
          imageUrl: (v as any)?.imageUrl || (v as any)?.images?.[0],
          totalAvailable: 0,
          totalReserved: 0,
          overallStatus: 'IN_STOCK',
          variants: [],
        });
      }

      const prod = map.get(productId)!;
      prod.variants.push(item);
      prod.totalAvailable += item.availableQuantity;
      prod.totalReserved += item.reservedQuantity;
    });

    const result: GroupedProductInventory[] = [];
    map.forEach((prod) => {
      const hasOutOfStock = prod.variants.some((v) => v.availableQuantity <= 0);
      const hasLowStock = prod.variants.some(
        (v) => v.availableQuantity > 0 && v.availableQuantity <= (v.minimumStock || 5)
      );

      if (prod.totalAvailable <= 0) {
        prod.overallStatus = 'OUT_OF_STOCK';
      } else if (hasOutOfStock || hasLowStock || prod.totalAvailable <= 10) {
        prod.overallStatus = 'LOW_STOCK';
      } else {
        prod.overallStatus = 'IN_STOCK';
      }

      result.push(prod);
    });

    return result;
  }, [catalogProducts, inventories]);

  // Filter products based on search and channel tab
  const filteredProducts = useMemo(() => {
    return groupedProducts.filter((prod) => {
      // Search query filtering across product name, variants SKU, barcode, size title
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesProduct = prod.productName.toLowerCase().includes(q);
        const matchesVariants = prod.variants.some((v) => {
          const sku = v.variant?.sku?.toLowerCase() || '';
          const title = v.variant?.title?.toLowerCase() || '';
          const barcode = v.variant?.barcode?.toLowerCase() || '';
          return sku.includes(q) || title.includes(q) || barcode.includes(q);
        });
        if (!matchesProduct && !matchesVariants) return false;
      }

      // Channel filtering
      if (channelTab === 'POS_STORE') {
        const ch = (prod as any).channel;
        if (ch && ch !== 'STORE' && ch !== 'BOTH') return false;
      } else if (channelTab === 'ONLINE_WEB') {
        const ch = (prod as any).channel;
        if (ch && ch !== 'ONLINE' && ch !== 'BOTH') return false;
      }

      // Stock status filter from query param
      if (stockStatus) {
        if (stockStatus === 'OUT_OF_STOCK' && prod.overallStatus !== 'OUT_OF_STOCK') return false;
        if (stockStatus === 'LOW_STOCK' && prod.overallStatus !== 'LOW_STOCK') return false;
        if (stockStatus === 'IN_STOCK' && prod.overallStatus !== 'IN_STOCK') return false;
      }

      return true;
    });
  }, [groupedProducts, searchQuery, stockStatus, channelTab]);

  // Toggle row expansion
  const toggleExpand = (productId: string) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Expand all / Collapse all
  const toggleExpandAll = () => {
    if (expandedProductIds.size === filteredProducts.length) {
      setExpandedProductIds(new Set());
    } else {
      setExpandedProductIds(new Set(filteredProducts.map((p) => p.productId)));
    }
  };

  // Quick 1-click increment handler for child variant (+10 or +25)
  const handleQuickAddUnits = async (item: InventoryResponse, qty: number) => {
    setQuickIncrementId(item.id);
    setBannerNotice(null);
    try {
      await increaseMut.mutateAsync({
        id: item.id,
        dto: {
          quantity: qty,
          reason: 'Quick Counter / Warehouse Inbound Stock (+)',
          remarks: `1-click stock restock (+${qty})`,
        },
      });
      setBannerNotice({
        type: 'success',
        text: `✅ Added +${qty} units to SKU: ${item.variant?.sku || item.variantId}. New Stock: ${item.availableQuantity + qty}`,
      });
      handleRefresh();
    } catch (err: any) {
      setBannerNotice({
        type: 'error',
        text: `⚠️ Could not add stock: ${err?.message || 'Server error'}`,
      });
    } finally {
      setQuickIncrementId(null);
    }
  };

  const handleRefresh = () => {
    refetchList();
    refetchSummary();
    refetchProducts();
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Package2 className="w-6 h-6 text-neutral-900" />
            <h1 className="text-xl font-black text-neutral-900 tracking-tight font-sans">
              Live Stock & Inventory Management
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Real-Time Database Sync
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Product-first stock tracking with nested variant size breakdowns (S, M, L, XL, XXL) and omnichannel visibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (filteredProducts.length > 0) {
                setStockModalProduct(filteredProducts[0]);
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Stock / Inbound Restock
          </button>

          <Link
            href="/admin/inventory/movements"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-700 font-bold rounded-xl text-xs border border-neutral-200 transition shadow-2xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-neutral-500" /> Movements & Audit
          </Link>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Action Banner Notice */}
      {bannerNotice && (
        <div
          className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            bannerNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {bannerNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{bannerNotice.text}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      {!isSummaryLoading && summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 bg-neutral-100 rounded-xl">
              <Layers className="w-5 h-5 text-neutral-700" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                Total Products
              </span>
              <span className="text-xl font-black text-neutral-900 font-mono">
                {groupedProducts.length} <span className="text-xs font-normal text-neutral-400">({summary.totalItems} SKUs)</span>
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-600 font-bold uppercase block">
                In Stock Products
              </span>
              <span className="text-xl font-black text-emerald-900 font-mono">
                {groupedProducts.filter((p) => p.overallStatus === 'IN_STOCK').length}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl">
              <TrendingDown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="text-[10px] text-amber-600 font-bold uppercase block">
                Low Stock Alerts
              </span>
              <span className="text-xl font-black text-amber-900 font-mono">
                {groupedProducts.filter((p) => p.overallStatus === 'LOW_STOCK').length}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <span className="text-[10px] text-rose-600 font-bold uppercase block">
                Out of Stock
              </span>
              <span className="text-xl font-black text-rose-900 font-mono">
                {groupedProducts.filter((p) => p.overallStatus === 'OUT_OF_STOCK').length}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 rounded-xl">
              <Package2 className="w-5 h-5 text-[#0284c7]" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                Total Live Units
              </span>
              <span className="text-xl font-black text-neutral-900 font-mono">
                {summary.totalAvailable} <span className="text-xs text-neutral-400 font-normal">({summary.totalReserved} rsvd)</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Omnichannel Control Center */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          {/* Channel Multi-Selector Tabs */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setChannelTab('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                channelTab === 'ALL'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All Channels
            </button>
            <button
              type="button"
              onClick={() => setChannelTab('POS_STORE')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                channelTab === 'POS_STORE'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-sky-700'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>In-Store (POS)</span>
            </button>
            <button
              type="button"
              onClick={() => setChannelTab('ONLINE_WEB')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                channelTab === 'ONLINE_WEB'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-purple-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Online Web</span>
            </button>
          </div>

          {/* Expand/Collapse All Button */}
          <button
            type="button"
            onClick={toggleExpandAll}
            className="text-xs font-bold text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition cursor-pointer"
          >
            {expandedProductIds.size === filteredProducts.length ? 'Collapse All Sizes' : 'Expand All Sizes'}
          </button>
        </div>

        {/* Search and Status Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1 border-t border-neutral-100">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Product Name, Size (S/M/L/XL), Color, SKU code, or Barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-neutral-900 transition"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={stockStatus}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams.toString());
                if (e.target.value) {
                  params.set('stockStatus', e.target.value);
                } else {
                  params.delete('stockStatus');
                }
                router.push(`/admin/inventory?${params}`);
              }}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 focus:bg-white focus:outline-none"
            >
              <option value="">Status: All Stock Statuses</option>
              <option value="IN_STOCK">Status: In Stock Only</option>
              <option value="LOW_STOCK">Status: Low Stock Alerts</option>
              <option value="OUT_OF_STOCK">Status: Out of Stock Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* PRODUCT-FIRST HIERARCHICAL INVENTORY TABLE */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            Catalog Products & Variant Breakdown ({filteredProducts.length} Products)
          </h2>
          <span className="text-2xs text-neutral-400 font-medium">Click any product row to expand sizes</span>
        </div>

        {isListLoading ? (
          <div className="p-12 text-center">
            <ButtonLoader />
            <p className="text-xs text-neutral-400 mt-2">Loading live inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-xs">
            No products found matching your search or filters.
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {filteredProducts.map((prod) => {
              const isExpanded = expandedProductIds.has(prod.productId);

              return (
                <div key={prod.productId} className="transition-colors hover:bg-neutral-50/40">
                  {/* PRODUCT ROW HEADER */}
                  <div
                    onClick={() => toggleExpand(prod.productId)}
                    className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    {/* Left: Product Thumbnail & Identity */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <button
                        type="button"
                        aria-label="Toggle size details"
                        className="p-1 text-neutral-400 hover:text-neutral-900 rounded-lg"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-neutral-700" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-neutral-400" />
                        )}
                      </button>

                      <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center font-bold text-neutral-400 shrink-0 overflow-hidden">
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt={prod.productName} className="w-full h-full object-cover" />
                        ) : (
                          <Package2 className="w-6 h-6 text-neutral-400" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm text-neutral-900 truncate" title={prod.productName}>
                            {prod.productName}
                          </h3>
                          <span className="px-2 py-0.5 text-2xs font-bold rounded-full bg-neutral-100 text-neutral-700">
                            {prod.variants.length} Sizes / Variants
                          </span>
                          {channelTab === 'ALL' && (
                            <span className="px-2 py-0.5 text-2xs font-semibold rounded-full bg-sky-50 text-sky-800 border border-sky-100 flex items-center gap-1">
                              <Store className="w-3 h-3" /> POS & Web
                            </span>
                          )}
                        </div>
                        <p className="text-2xs text-neutral-400 font-medium truncate">
                          {prod.category || 'Catalog Product'} • SKU Group: {prod.variants[0]?.variant?.sku?.split('-')[0] || 'SKU'}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Stock Quantities & Status */}
                    <div className="flex items-center gap-6 px-2 shrink-0">
                      {/* Live Stock Counter */}
                      <div className="text-center">
                        <span
                          className={`font-mono font-black text-base block ${
                            prod.totalAvailable <= 0
                              ? 'text-rose-600'
                              : prod.totalAvailable <= 10
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {prod.totalAvailable}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-semibold block uppercase">
                          Available Units
                        </span>
                      </div>

                      {/* Reserved Counter */}
                      <div className="text-center">
                        <span className="font-mono font-bold text-xs text-neutral-600 block">
                          {prod.totalReserved}
                        </span>
                        <span className="text-[10px] text-neutral-400 block font-medium">In Orders</span>
                      </div>

                      {/* Stock Status Badge */}
                      <div>
                        <StockStatusBadge status={prod.overallStatus} />
                      </div>
                    </div>

                    {/* Right: Primary Action Buttons */}
                    {/* Right: Primary Action Buttons */}
                    <div
                      className="flex items-center gap-2 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setStockModalProduct(prod)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Stock</span>
                      </button>

                      <Link
                        href={`/admin/catalog/products/${prod.productId}/edit`}
                        title="Open full catalog product page"
                        className="p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* EXPANDABLE VARIANT SIZES ACCORDION BREAKDOWN */}
                  {isExpanded && (
                    <div className="bg-neutral-50/80 border-t border-neutral-100 p-4 pl-12 sm:pl-16 animate-in fade-in duration-150">
                      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-neutral-50 text-neutral-400 uppercase text-[10px] font-bold border-b border-neutral-200">
                            <tr>
                              <th className="py-2.5 px-4">Size & Variant</th>
                              <th className="py-2.5 px-3">SKU Identifier</th>
                              <th className="py-2.5 px-3">Barcode (EAN)</th>
                              <th className="py-2.5 px-3 text-center">Available Stock</th>
                              <th className="py-2.5 px-3 text-center">Reserved</th>
                              <th className="py-2.5 px-3 text-center">Reorder Threshold</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {prod.variants.map((v) => {
                              const isOut = v.availableQuantity <= 0;
                              const isLow = v.availableQuantity > 0 && v.availableQuantity <= (v.minimumStock || 5);

                              return (
                                <tr key={v.id} className="hover:bg-neutral-50/60 transition-colors">
                                  {/* Size / Title */}
                                  <td className="py-3 px-4">
                                    <div className="font-bold text-neutral-900 text-xs">
                                      {v.variant?.title || 'Variant Item'}
                                    </div>
                                    <span className="text-[10px] text-neutral-400">
                                      {(v.variant as any)?.option1 || 'Standard'}
                                    </span>
                                  </td>

                                  {/* SKU */}
                                  <td className="py-3 px-3">
                                    <span className="font-mono font-bold text-2xs px-2 py-0.5 rounded bg-neutral-900 text-white">
                                      {v.variant?.sku || v.variantId.substring(0, 8)}
                                    </span>
                                  </td>

                                  {/* Barcode */}
                                  <td className="py-3 px-3 font-mono text-2xs text-neutral-500">
                                    {v.variant?.barcode ? (
                                      <span className="flex items-center gap-1">
                                        <Barcode className="w-3.5 h-3.5 text-neutral-400" />
                                        {v.variant.barcode}
                                      </span>
                                    ) : (
                                      <span className="text-neutral-300 italic">No barcode</span>
                                    )}
                                  </td>

                                  {/* Available Stock */}
                                  <td className="py-3 px-3 text-center">
                                    <span
                                      className={`font-mono font-black text-sm block ${
                                        isOut
                                          ? 'text-rose-600'
                                          : isLow
                                          ? 'text-amber-600'
                                          : 'text-emerald-700'
                                      }`}
                                    >
                                      {v.availableQuantity}
                                    </span>
                                    <span className="text-[9px] text-neutral-400 block font-medium">Sellable</span>
                                  </td>

                                  {/* Reserved */}
                                  <td className="py-3 px-3 text-center font-mono font-bold text-xs text-neutral-600">
                                    {v.reservedQuantity}
                                  </td>

                                  {/* Min/Max */}
                                  <td className="py-3 px-3 text-center font-mono text-2xs text-neutral-600">
                                    <span>{v.minimumStock} / {v.maximumStock}</span>
                                    <span className="text-[9px] text-neutral-400 block">Reorder @ {v.reorderLevel}</span>
                                  </td>

                                  {/* Status Badge */}
                                  <td className="py-3 px-3">
                                    <StockStatusBadge status={v.stockStatus} />
                                  </td>

                                  {/* Direct Actions */}
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {/* Advanced Adjust */}
                                      <button
                                        type="button"
                                        onClick={() => setActionItem(v)}
                                        className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-700 rounded-lg text-2xs font-bold transition cursor-pointer"
                                      >
                                        Adjust
                                      </button>

                                      {/* Threshold Settings */}
                                      <button
                                        type="button"
                                        onClick={() => setSettingsItem(v)}
                                        title="Configure reorder thresholds"
                                        className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-900 transition cursor-pointer"
                                      >
                                        <Sliders className="w-3.5 h-3.5" />
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DIALOG 1: ADD STOCK & CHANNEL TARGETING MODAL */}
      {stockModalProduct && (
        <ProductStockModal
          product={stockModalProduct}
          onClose={() => setStockModalProduct(null)}
          onSuccess={handleRefresh}
        />
      )}

      {/* DIALOG 2: QUICK EDIT PRODUCT & PRICING MODAL */}
      {editProductData && (
        <QuickEditProductDialog
          product={editProductData}
          onClose={() => setEditProductData(null)}
          onSuccess={handleRefresh}
        />
      )}

      {/* DIALOG 3: ADVANCED STOCK ADJUSTMENT MODAL */}
      {actionItem && (
        <StockActionDialog
          inventory={actionItem}
          onClose={() => {
            setActionItem(null);
            handleRefresh();
          }}
        />
      )}

      {/* DIALOG 4: THRESHOLD SETTINGS MODAL */}
      {settingsItem && (
        <UpdateInventoryDialog
          inventory={settingsItem}
          onClose={() => {
            setSettingsItem(null);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}
