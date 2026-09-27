'use client';

import React, { useState } from 'react';
import {
  X,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Tag,
  ShieldCheck,
  Store,
  Globe,
  Info,
  ChevronRight,
  RefreshCw,
  Building,
} from 'lucide-react';
import { useProduct } from '../product.hooks';
import { formatMoney } from '@/utils/format';
import Link from 'next/link';

interface ProductDetailModalProps {
  productId?: string | null;
  productName?: string;
  variantId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailModal({
  productId,
  productName,
  variantId,
  isOpen,
  onClose,
}: ProductDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Fetch full live product data
  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useProduct(productId || '', isOpen && !!productId);

  if (!isOpen) return null;

  // Calculate image list
  const allImages: string[] = [];
  if (product?.primaryImageUrl) {
    allImages.push(product.primaryImageUrl);
  }
  if (product?.images && Array.isArray(product.images)) {
    product.images.forEach((img) => {
      const url = typeof img === 'string' ? img : img.url;
      if (url && !allImages.includes(url)) {
        allImages.push(url);
      }
    });
  }

  // Fallback active image
  const currentImage = allImages[activeImageIndex] || allImages[0] || '';

  // Calculate variant stock summary
  const variants = product?.variants || [];
  const totalStock = variants.reduce(
    (acc, v) => acc + (v.availableQuantity || 0),
    0
  );

  const totalInStockVariants = variants.filter(
    (v) => (v.availableQuantity || 0) > 0
  ).length;
  const totalOutOfStockVariants = variants.filter(
    (v) => (v.availableQuantity || 0) <= 0
  ).length;

  const isOverallInStock = totalStock > 0;
  const isLowStock = totalStock > 0 && totalStock <= 5;

  // Discount calculation
  const basePrice = product?.basePrice || 0;
  const salePrice = product?.salePrice;
  const discountPercent =
    salePrice && basePrice > salePrice
      ? Math.round(((basePrice - salePrice) / basePrice) * 100)
      : null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/70 p-3 sm:p-4 md:p-6 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-neutral-200 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3.5 sm:px-6 sm:py-4 bg-neutral-50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-neutral-900 text-white rounded-xl shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-neutral-900 truncate">
                  {product?.name || productName || 'Product Details'}
                </h2>
                {product?.status && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      product.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : product.status === 'DRAFT'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                    }`}
                  >
                    {product.status}
                  </span>
                )}
                {product?.channel && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                    {product.channel === 'BOTH' ? (
                      <>
                        <Globe className="w-2.5 h-2.5" /> Omnichannel
                      </>
                    ) : product.channel === 'STORE' ? (
                      <>
                        <Store className="w-2.5 h-2.5" /> Store POS
                      </>
                    ) : (
                      <>
                        <Globe className="w-2.5 h-2.5" /> Online Web
                      </>
                    )}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                SKU: {product?.sku || 'N/A'}
                {product?.brandName && ` · Brand: ${product.brandName}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-200/70 hover:text-neutral-900 transition cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin" />
              <p className="text-xs text-neutral-500 font-medium">
                Fetching live product & stock details...
              </p>
            </div>
          ) : isError || !product ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-rose-900">
                  Unable to load full product details
                </h3>
                <p className="text-xs text-rose-700 mt-1">
                  The product record may have been modified or is unavailable.
                </p>
              </div>
              <button
                type="button"
                onClick={() => refetch()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Fetch
              </button>
            </div>
          ) : (
            <>
              {/* Top Overview: Media + Core Attributes */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* Image Gallery (Left Column) */}
                <div className="md:col-span-5 space-y-3">
                  <div className="aspect-3/4 rounded-2xl bg-neutral-100 border border-neutral-200 overflow-hidden relative group flex items-center justify-center shadow-xs">
                    {currentImage ? (
                      <img
                        src={currentImage}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-neutral-400 p-4 text-center">
                        <Package className="w-12 h-12 mb-2 stroke-[1.5]" />
                        <span className="text-xs font-medium">
                          No product image uploaded
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  {allImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1.5">
                      {allImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`w-14 h-14 rounded-xl border-2 overflow-hidden shrink-0 transition cursor-pointer ${
                            idx === activeImageIndex
                              ? 'border-neutral-900 shadow-sm ring-1 ring-neutral-900'
                              : 'border-neutral-200 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Pricing, Inventory Highlight, Meta */}
                <div className="md:col-span-7 space-y-4">
                  {/* Pricing Card */}
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xs uppercase tracking-wider font-bold text-neutral-500">
                        Product Price
                      </span>
                      {product.taxPercentage !== undefined && (
                        <span className="text-[11px] text-neutral-500 font-medium">
                          GST: {product.taxPercentage}% (
                          {product.taxInclusive ? 'Inclusive' : 'Exclusive'})
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2.5 flex-wrap">
                      <span className="text-2xl font-black text-neutral-900 font-mono tracking-tight">
                        {formatMoney(salePrice ?? basePrice)}
                      </span>
                      {salePrice && salePrice < basePrice && (
                        <>
                          <span className="text-sm font-medium text-neutral-400 line-through font-mono">
                            {formatMoney(basePrice)}
                          </span>
                          {discountPercent && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                              {discountPercent}% OFF
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Cost Price for Super Admin / Admin */}
                    {product.costPrice !== undefined && (
                      <div className="pt-2 border-t border-neutral-200 flex justify-between text-2xs text-neutral-500">
                        <span>Cost Price (Internal):</span>
                        <span className="font-mono font-bold text-neutral-700">
                          {formatMoney(product.costPrice)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stock Highlights Banner */}
                  <div
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                      !isOverallInStock
                        ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                        : isLowStock
                        ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                        : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          !isOverallInStock
                            ? 'bg-rose-100 text-rose-700'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {!isOverallInStock ? (
                          <XCircle className="w-5 h-5" />
                        ) : isLowStock ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider">
                            {!isOverallInStock
                              ? 'Out of Stock'
                              : isLowStock
                              ? 'Low Stock Alert'
                              : 'In Stock & Available'}
                          </h4>
                        </div>
                        <p className="text-xs mt-0.5 font-medium">
                          {totalStock} total units across {variants.length}{' '}
                          variants ({totalInStockVariants} active,{' '}
                          {totalOutOfStockVariants} depleted)
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-lg font-black font-mono block">
                        {totalStock}
                      </span>
                      <span className="text-[10px] uppercase font-bold opacity-75">
                        Units Live
                      </span>
                    </div>
                  </div>

                  {/* Quick Meta Badges */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl border border-neutral-200 bg-white space-y-0.5">
                      <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                        Brand
                      </span>
                      <span className="font-bold text-neutral-800 truncate block">
                        {product.brandName || 'Vasanthi’s Signature'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl border border-neutral-200 bg-white space-y-0.5">
                      <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                        Category
                      </span>
                      <span className="font-bold text-neutral-800 truncate block">
                        {product.categories?.[0]?.categoryName ||
                          product.type ||
                          'Garment'}
                      </span>
                    </div>
                    {product.hsnCode && (
                      <div className="p-2.5 rounded-xl border border-neutral-200 bg-white space-y-0.5">
                        <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                          HSN Code
                        </span>
                        <span className="font-mono font-bold text-neutral-800 truncate block">
                          {product.hsnCode}
                        </span>
                      </div>
                    )}
                    <div className="p-2.5 rounded-xl border border-neutral-200 bg-white space-y-0.5">
                      <span className="text-[10px] font-bold uppercase text-neutral-400 block">
                        Inventory Tracking
                      </span>
                      <span className="font-bold text-emerald-700 truncate block">
                        {product.trackInventory ? 'Active Tracked' : 'Untracked'}
                      </span>
                    </div>
                  </div>

                  {/* Action Quick Links */}
                  <div className="flex gap-2 pt-1">
                    <Link
                      href={`/admin/catalog/products/${product.id}/edit`}
                      target="_blank"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit in Catalog
                    </Link>
                    <Link
                      href={`/product/${product.slug || product.id}`}
                      target="_blank"
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 rounded-xl text-xs font-bold transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Live Storefront
                    </Link>
                  </div>
                </div>
              </div>

              {/* Detailed Size / Variant Stock Matrix */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-neutral-500" />
                    Variant & Size Stock Breakdown ({variants.length} Sizes)
                  </h3>
                  <span className="text-2xs text-neutral-400 font-medium">
                    Live Real-Time Inventory
                  </span>
                </div>

                {variants.length === 0 ? (
                  <div className="p-4 bg-neutral-50 rounded-xl text-center text-xs text-neutral-500 border border-neutral-200">
                    No individual variants found for this product.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-bold text-neutral-600 uppercase">
                          <tr>
                            <th className="px-3.5 py-2.5">Variant / Size</th>
                            <th className="px-3.5 py-2.5">SKU</th>
                            <th className="px-3.5 py-2.5 text-right">Price</th>
                            <th className="px-3.5 py-2.5 text-right">Stock Qty</th>
                            <th className="px-3.5 py-2.5 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 bg-white">
                          {variants.map((v) => {
                            const isMatch =
                              variantId &&
                              (v.id === variantId || v.sku === variantId);
                            const qty = v.availableQuantity ?? 0;
                            const isOut = qty <= 0;
                            const isLow = qty > 0 && qty <= 5;

                            return (
                              <tr
                                key={v.id}
                                className={`transition ${
                                  isMatch
                                    ? 'bg-blue-50/70 font-semibold'
                                    : 'hover:bg-neutral-50/80'
                                }`}
                              >
                                <td className="px-3.5 py-3 font-bold text-neutral-900">
                                  <div className="flex items-center gap-1.5">
                                    {isMatch && (
                                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                                    )}
                                    <span>{v.title || 'Standard'}</span>
                                    {isMatch && (
                                      <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                        Ordered Item
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3.5 py-3 font-mono text-[11px] text-neutral-500">
                                  {v.sku || '—'}
                                </td>
                                <td className="px-3.5 py-3 text-right font-mono font-bold text-neutral-900">
                                  {formatMoney(
                                    v.salePriceOverride ??
                                      v.priceOverride ??
                                      product.salePrice ??
                                      product.basePrice
                                  )}
                                </td>
                                <td className="px-3.5 py-3 text-right font-mono font-bold text-neutral-900">
                                  {qty} units
                                </td>
                                <td className="px-3.5 py-3 text-center">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                      isOut
                                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                        : isLow
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        isOut
                                          ? 'bg-rose-600'
                                          : isLow
                                          ? 'bg-amber-600'
                                          : 'bg-emerald-600'
                                      }`}
                                    />
                                    {isOut
                                      ? 'Out of Stock'
                                      : isLow
                                      ? 'Low Stock'
                                      : 'In Stock'}
                                  </span>
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

              {/* Description / Highlights if available */}
              {(product.shortDescription ||
                product.description ||
                (product.highlights && product.highlights.length > 0)) && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Product Description & Highlights
                  </h3>
                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs text-neutral-700 leading-relaxed space-y-2">
                    {product.shortDescription && (
                      <p className="font-medium text-neutral-900">
                        {product.shortDescription}
                      </p>
                    )}
                    {product.description && <p>{product.description}</p>}
                    {product.highlights && product.highlights.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-1.5">
                        {product.highlights.map((h, i) => (
                          <span
                            key={i}
                            className="bg-white border border-neutral-200 text-neutral-700 text-[11px] px-2.5 py-1 rounded-lg font-medium shadow-2xs"
                          >
                            ✓ {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 sm:px-6 bg-neutral-50 shrink-0">
          <div className="text-2xs text-neutral-400 font-mono">
            {product?.id ? `ID: ${product.id}` : ''}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-xl transition cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
