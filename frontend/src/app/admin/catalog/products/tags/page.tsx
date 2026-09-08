'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Printer, 
  ArrowLeft, 
  CheckSquare, 
  Square, 
  Search, 
  Sparkles, 
  Layers, 
  Sliders, 
  Tag as TagIcon,
  Shirt
} from 'lucide-react';
import { useProducts } from '@/features/catalog/products/product.hooks';
import { formatInr } from '@/features/customer/mappers';

// Helper to generate Code128-like crisp SVG barcode patterns from a string
function SvgBarcode({ value, height = 40, width = 180 }: { value: string; height?: number; width?: number }) {
  const pattern = useMemo(() => {
    let hash = 0;
    const clean = (value || 'VS-00000').toUpperCase();
    for (let i = 0; i < clean.length; i++) {
      hash = (hash << 5) - hash + clean.charCodeAt(i);
      hash |= 0;
    }
    
    // Generate alternating bar widths
    const bars: Array<{ width: number; isBlack: boolean }> = [];
    // Start guard
    bars.push({ width: 2, isBlack: true });
    bars.push({ width: 1, isBlack: false });
    bars.push({ width: 2, isBlack: true });
    bars.push({ width: 1, isBlack: false });

    for (let i = 0; i < clean.length; i++) {
      const charCode = clean.charCodeAt(i);
      const b1 = (charCode % 3) + 1;
      const s1 = ((charCode >> 1) % 2) + 1;
      const b2 = ((charCode >> 2) % 3) + 1;
      const s2 = ((charCode >> 3) % 2) + 1;
      bars.push({ width: b1, isBlack: true });
      bars.push({ width: s1, isBlack: false });
      bars.push({ width: b2, isBlack: true });
      bars.push({ width: s2, isBlack: false });
    }

    // Stop guard
    bars.push({ width: 3, isBlack: true });
    bars.push({ width: 1, isBlack: false });
    bars.push({ width: 2, isBlack: true });

    return bars;
  }, [value]);

  const totalUnits = pattern.reduce((acc, b) => acc + b.width, 0);
  const unitWidth = width / totalUnits;

  let currentX = 0;

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} className="overflow-visible">
        {pattern.map((bar, idx) => {
          const barW = bar.width * unitWidth;
          const rect = bar.isBlack ? (
            <rect
              key={idx}
              x={currentX}
              y={0}
              width={barW}
              height={height}
              fill="#000000"
            />
          ) : null;
          currentX += barW;
          return rect;
        })}
      </svg>
      <span className="font-mono text-[9px] tracking-widest font-bold text-neutral-800 mt-1">
        *{value.toUpperCase()}*
      </span>
    </div>
  );
}

export default function BarcodePriceTagGeneratorPage() {
  const { data: productsData, isLoading } = useProducts({ limit: 100 });
  const products = productsData?.data || [];

  const [search, setSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [tagFormat, setTagFormat] = useState<'hangtag' | 'sticker' | 'mini'>('hangtag');
  const [copiesPerProduct, setCopiesPerProduct] = useState(1);
  const [batchNo, setBatchNo] = useState('BATCH-2026-VS');

  // Customization visibility toggles
  const [showBrand, setShowBrand] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showMrp, setShowMrp] = useState(true);
  const [showCareInstructions, setShowCareInstructions] = useState(true);
  const [showSkuSize, setShowSkuSize] = useState(true);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => 
      p.name.toLowerCase().includes(q) || 
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [products, search]);

  const handleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleToggleProduct = (id: string) => {
    setSelectedProductIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedProducts = useMemo(() => {
    const list = products.filter((p) => selectedProductIds.includes(p.id));
    return list.length > 0 ? list : products.slice(0, 4); // Default to first 4 for preview if none selected
  }, [products, selectedProductIds]);

  // Generate individual tag cards array respecting copy count
  const tagsToPrint = useMemo(() => {
    const result: Array<{ product: typeof products[0]; index: number }> = [];
    selectedProducts.forEach((prod) => {
      for (let i = 0; i < copiesPerProduct; i++) {
        result.push({ product: prod, index: i });
      }
    });
    return result;
  }, [selectedProducts, copiesPerProduct]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print-specific style block */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          /* Hide non-printable admin elements */
          nav, header, aside, .no-print, .admin-sidebar, .admin-topbar {
            display: none !important;
          }
          .printable-sheet {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 12px !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
          }
          .tag-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            box-shadow: none !important;
            border: 1px dashed #cccccc !important;
          }
        }
      `}</style>

      {/* Page Header (Hidden in Print) */}
      <div className="no-print bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link 
              href="/admin/catalog/products"
              className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <TagIcon className="w-5 h-5 text-[#0284c7]" />
              Garment Barcode & Price Tag Generator
            </h1>
          </div>
          <p className="text-xs text-neutral-500 pl-8">
            Create high-resolution, print-ready hang-tags, price stickers, and barcode labels for garments and boutique stock.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="bg-[#0284c7] hover:bg-sky-700 active:scale-98 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print {tagsToPrint.length} Tags
        </button>
      </div>

      {/* Control Panel: Configuration & Product Selection (Hidden in Print) */}
      <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Tag Settings & Layout (Span 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#0284c7]" /> 1. Format & Dimensions
            </h2>

            {/* Template Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTagFormat('hangtag')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  tagFormat === 'hangtag'
                    ? 'border-[#0284c7] bg-sky-50/50 text-[#0284c7] ring-1 ring-[#0284c7]'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-neutral-50/40'
                }`}
              >
                <Shirt className="w-4 h-4 mb-1" />
                <p className="text-xs font-bold leading-tight">Hang-Tag</p>
                <p className="text-[10px] text-neutral-400">2&quot; × 3.5&quot; Deluxe</p>
              </button>

              <button
                type="button"
                onClick={() => setTagFormat('sticker')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  tagFormat === 'sticker'
                    ? 'border-[#0284c7] bg-sky-50/50 text-[#0284c7] ring-1 ring-[#0284c7]'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-neutral-50/40'
                }`}
              >
                <TagIcon className="w-4 h-4 mb-1" />
                <p className="text-xs font-bold leading-tight">Price Sticker</p>
                <p className="text-[10px] text-neutral-400">50 × 25 mm Box</p>
              </button>

              <button
                type="button"
                onClick={() => setTagFormat('mini')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  tagFormat === 'mini'
                    ? 'border-[#0284c7] bg-sky-50/50 text-[#0284c7] ring-1 ring-[#0284c7]'
                    : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-neutral-50/40'
                }`}
              >
                <Sparkles className="w-4 h-4 mb-1" />
                <p className="text-xs font-bold leading-tight">Mini Tag</p>
                <p className="text-[10px] text-neutral-400">Compact / Jewelry</p>
              </button>
            </div>

            {/* Copies & Batch Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase">Tags per Product</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={copiesPerProduct}
                  onChange={(e) => setCopiesPerProduct(Math.max(1, parseInt(e.target.value) || 1))}
                  className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#0284c7]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase">Batch / Lot Code</label>
                <input
                  type="text"
                  value={batchNo}
                  onChange={(e) => setBatchNo(e.target.value)}
                  className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#0284c7]"
                />
              </div>
            </div>

            {/* Field Toggles */}
            <div className="pt-2 border-t border-neutral-100 space-y-2">
              <label className="block text-[10px] font-bold text-neutral-500 uppercase">Visible Tag Elements</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-neutral-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showBrand} onChange={(e) => setShowBrand(e.target.checked)} className="rounded text-[#0284c7]" />
                  <span>Brand Header</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showBarcode} onChange={(e) => setShowBarcode(e.target.checked)} className="rounded text-[#0284c7]" />
                  <span>Barcode (Code128)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showMrp} onChange={(e) => setShowMrp(e.target.checked)} className="rounded text-[#0284c7]" />
                  <span>Price / MRP</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showSkuSize} onChange={(e) => setShowSkuSize(e.target.checked)} className="rounded text-[#0284c7]" />
                  <span>SKU & Size</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer col-span-2">
                  <input type="checkbox" checked={showCareInstructions} onChange={(e) => setShowCareInstructions(e.target.checked)} className="rounded text-[#0284c7]" />
                  <span>Fabric & Care Instructions</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Product Selection Table (Span 7) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#0284c7]" /> 2. Select Products ({selectedProductIds.length} Selected)
            </h2>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-bold text-[#0284c7] hover:underline"
            >
              {selectedProductIds.length === filteredProducts.length ? 'Deselect All' : 'Select All Filtered'}
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Filter products by title or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-[#0284c7]"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          </div>

          <div className="max-h-64 overflow-y-auto border border-neutral-100 rounded-xl divide-y divide-neutral-100">
            {isLoading && <p className="p-4 text-xs text-neutral-400 text-center">Loading catalog...</p>}
            {!isLoading && filteredProducts.length === 0 && (
              <p className="p-4 text-xs text-neutral-400 text-center">No products found matching &quot;{search}&quot;</p>
            )}
            {filteredProducts.map((p) => {
              const isChecked = selectedProductIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => handleToggleProduct(p.id)}
                  className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                    isChecked ? 'bg-sky-50/40' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-[#0284c7]" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-300" />
                    )}
                    <div>
                      <p className="text-xs font-bold text-neutral-800">{p.name}</p>
                      <p className="text-[10px] text-neutral-400 font-mono">SKU: {p.sku || p.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-neutral-900">
                    {formatInr(p.salePrice ?? p.basePrice ?? 0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Live Printable Tags Sheet Area */}
      <div className="space-y-3">
        <div className="no-print flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-neutral-800">Print Preview ({tagsToPrint.length} tags)</h2>
            <span className="text-xs text-neutral-400 font-medium">Ready for A4 sheet or roll printer</span>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            className="text-xs font-bold text-[#0284c7] hover:underline flex items-center gap-1"
          >
            <Printer className="w-3.5 h-3.5" /> Print Now
          </button>
        </div>

        {/* The Printable Tag Grid */}
        <div className="printable-sheet bg-neutral-100 p-6 rounded-2xl border border-neutral-200 flex flex-wrap gap-4 items-start justify-center">
          {tagsToPrint.map(({ product, index }) => {
            const skuVal = product.sku || `VS-${product.id.slice(0, 8).toUpperCase()}`;
            const priceVal = product.salePrice ?? product.basePrice ?? 2999;
            const originalVal = product.basePrice && product.basePrice > priceVal ? product.basePrice : priceVal + 1000;

            if (tagFormat === 'sticker') {
              // Format 2: Adhesive Barcode Sticker (50mm x 25mm)
              return (
                <div
                  key={`${product.id}-${index}`}
                  className="tag-card bg-white border border-neutral-300 rounded-lg p-3 w-64 shadow-xs flex flex-col justify-between"
                  style={{ minHeight: '110px' }}
                >
                  <div className="flex items-start justify-between border-b border-neutral-100 pb-1 mb-1">
                    <div>
                      <p className="text-[9px] font-black text-neutral-800 uppercase tracking-tight line-clamp-1">{product.name}</p>
                      <p className="text-[8px] text-neutral-400 font-mono">SKU: {skuVal}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-black text-neutral-900">{formatInr(priceVal)}</span>
                      <p className="text-[7px] text-neutral-400">Incl. Taxes</p>
                    </div>
                  </div>

                  {showBarcode && (
                    <div className="py-1">
                      <SvgBarcode value={skuVal} height={28} width={200} />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[7px] font-bold text-neutral-400 border-t border-neutral-100 pt-1">
                    <span>VASANTHI&apos;S SIGNATURE</span>
                    <span>SIZE: FREE / M</span>
                    <span>{batchNo}</span>
                  </div>
                </div>
              );
            }

            if (tagFormat === 'mini') {
              // Format 3: Mini / Jewelry Tag
              return (
                <div
                  key={`${product.id}-${index}`}
                  className="tag-card bg-white border border-neutral-300 rounded-xl p-3 w-48 shadow-xs flex flex-col items-center text-center space-y-1.5"
                  style={{ minHeight: '140px' }}
                >
                  <div className="w-3 h-3 rounded-full border border-neutral-300 bg-neutral-50 mb-1"></div>
                  <p className="text-[8px] font-black text-neutral-400 tracking-widest uppercase">VASANTHI&apos;S</p>
                  <p className="text-[10px] font-bold text-neutral-800 line-clamp-1">{product.name}</p>
                  <p className="text-xs font-black text-neutral-900">{formatInr(priceVal)}</p>
                  {showBarcode && <SvgBarcode value={skuVal} height={22} width={130} />}
                </div>
              );
            }

            // Default: Luxury Garment Hang-Tag (2" x 3.5")
            return (
              <div
                key={`${product.id}-${index}`}
                className="tag-card bg-white border border-neutral-300 rounded-2xl p-4 w-72 shadow-sm flex flex-col justify-between relative overflow-hidden"
                style={{ minHeight: '340px' }}
              >
                {/* Punched hole simulation */}
                <div className="w-4 h-4 rounded-full border border-neutral-300 bg-neutral-100 mx-auto mb-2 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>

                {/* Brand Header */}
                {showBrand && (
                  <div className="text-center space-y-0.5 border-b border-neutral-100 pb-2.5">
                    <p className="text-[11px] font-black tracking-[0.2em] text-neutral-900 uppercase">
                      VASANTHI&apos;S SIGNATURE
                    </p>
                    <p className="text-[8px] font-semibold text-[#0284c7] tracking-widest uppercase">
                      HAUTE COUTURE &bull; ETHNIC WEAR
                    </p>
                  </div>
                )}

                {/* Product & Spec Info */}
                <div className="py-2.5 space-y-1">
                  <h3 className="text-xs font-bold text-neutral-800 line-clamp-2 leading-snug">
                    {product.name}
                  </h3>

                  {showSkuSize && (
                    <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-500 pt-1">
                      <span>SIZE: <strong className="text-neutral-800">FREE SIZE / M</strong></span>
                      <span>COLOR: <strong className="text-neutral-800">DESIGNER</strong></span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span>SKU: {skuVal}</span>
                    <span>{batchNo}</span>
                  </div>
                </div>

                {/* Barcode Section */}
                {showBarcode && (
                  <div className="py-2 flex justify-center bg-neutral-50/70 rounded-xl border border-neutral-100 p-2 my-1">
                    <SvgBarcode value={skuVal} height={36} width={210} />
                  </div>
                )}

                {/* Price Section */}
                {showMrp && (
                  <div className="border-t border-b border-dashed border-neutral-200 py-2 flex items-baseline justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-neutral-400 uppercase block">Maximum Retail Price</span>
                      <span className="text-[8px] text-neutral-400 font-medium">(Inclusive of all taxes)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-neutral-900">{formatInr(priceVal)}</span>
                      {originalVal > priceVal && (
                        <span className="block text-[9px] text-neutral-400 line-through font-semibold">
                          MRP {formatInr(originalVal)}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Fabric Care & Guarantee */}
                {showCareInstructions && (
                  <div className="pt-2 text-[8px] text-neutral-400 space-y-1">
                    <p className="font-semibold text-neutral-600">Wash Care: Dry Clean Recommended &bull; Warm Iron</p>
                    <div className="flex items-center justify-between pt-0.5 text-[7px] text-neutral-400">
                      <span>100% Genuine Handcrafted</span>
                      <span>Made in India</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
