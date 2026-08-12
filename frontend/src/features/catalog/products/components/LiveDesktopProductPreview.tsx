'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  Star,
  Heart,
  ShoppingBag,
  Truck,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Eye,
  Monitor,
  LayoutGrid,
  ChevronRight,
  Sparkles,
  Award,
} from 'lucide-react';
import { isLocalOrPlaceholder, withVariant } from '@/lib/media-url';

export interface ColorVariantGroup {
  id: string;
  name: string;
  hex: string;
  swatchImage?: string;
  images: string[];
  sizes: Array<{
    size: string;
    stock: number;
    price?: number;
    sku?: string;
    available: boolean;
    /** Low-stock warning threshold for this variant. */
    minStock?: number;
    /** Level at which the variant should be reordered. */
    reorderLevel?: number;
  }>;
}

export interface LivePreviewData {
  name: string;
  brandName?: string;
  basePrice: number;
  salePrice?: number;
  shortDescription?: string;
  description?: string;
  gender?: string;
  occasion?: string;
  season?: string;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isTrending?: boolean;
  colorGroups: ColorVariantGroup[];
  highlights?: string[];
}

interface LiveDesktopProductPreviewProps {
  data: LivePreviewData;
}

export const LiveDesktopProductPreview = React.memo(function LiveDesktopProductPreview({ data }: LiveDesktopProductPreviewProps) {
  const [previewMode, setPreviewMode] = useState<'detail' | 'card'>('detail');
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');

  const currentColorGroup = data.colorGroups[activeColorIndex] || data.colorGroups[0];
  const images = currentColorGroup?.images?.length ? currentColorGroup.images : [];
  const mainImage = images[activeImageIndex] || images[0] || null;

  const price = data.salePrice && data.salePrice > 0 && data.salePrice < data.basePrice
    ? data.salePrice
    : data.basePrice;
  const originalPrice = data.basePrice > 0 ? data.basePrice : 0;
  const hasDiscount = originalPrice > price;
  const discountPct = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const title = data.name || 'Untitled Product';
  const brand = data.brandName || 'Vasanthi Designers';

  return (
    <div className="bg-neutral-900 rounded-3xl border border-neutral-800 shadow-xl overflow-hidden text-neutral-100">
      
      {/* Top Preview Bar Header */}
      <div className="bg-neutral-950/90 backdrop-blur-md px-6 py-4 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-rose-400" />
              <span>LIVE CUSTOMER DESKTOP PREVIEW</span>
            </h3>
            <p className="text-[11px] text-neutral-400">
              See in real-time how your product will look to customers on the website
            </p>
          </div>
        </div>

        {/* View Mode Toggle Switch */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 p-1 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setPreviewMode('detail')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              previewMode === 'detail'
                ? 'bg-[#800020] text-white shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Product Page View</span>
          </button>

          <button
            type="button"
            onClick={() => setPreviewMode('card')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              previewMode === 'card'
                ? 'bg-[#800020] text-white shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Product Card View</span>
          </button>
        </div>
      </div>

      {/* PREVIEW CONTAINER (DESKTOP WATERMARK BACKGROUND) */}
      <div className="p-6 sm:p-10 bg-neutral-950/50 min-h-[500px]">

        {/* MODE 1: FULL DESKTOP PRODUCT DETAIL PAGE PREVIEW */}
        {previewMode === 'detail' && (
          <div className="max-w-5xl mx-auto bg-white text-neutral-900 rounded-3xl p-6 sm:p-10 shadow-2xl border border-neutral-200">
            
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs text-neutral-400 mb-6 font-medium">
              <span>Home</span>
              <ChevronRight className="w-3 h-3" />
              <span>Catalog</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#800020] font-bold">{brand}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-neutral-800 font-semibold truncate max-w-[200px]">{title}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              
              {/* LEFT: Product Images Gallery (Span 6) */}
              <div className="lg:col-span-6 space-y-4">
                {/* Main Large Display Image */}
                <div className="relative rounded-2xl overflow-hidden aspect-[4/5] bg-neutral-100 border border-neutral-200/80 group">
                  {mainImage ? (
                    <Image
                      src={mainImage}
                      alt={title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      unoptimized={isLocalOrPlaceholder(mainImage)}
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-rose-50/50 to-neutral-100 text-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-rose-200 shadow-2xs flex items-center justify-center text-[#800020]">
                        <Eye className="w-7 h-7 text-[#800020]" />
                      </div>
                      <div className="space-y-1 max-w-xs">
                        <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Product Media Preview</h4>
                        <p className="text-[11px] text-neutral-500 font-medium leading-relaxed">
                          Add images in Tab 3 (Color Groups & Media) to preview live product photos here
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                    {data.isNewArrival && (
                      <span className="bg-neutral-900 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-xs uppercase tracking-wider">
                        NEW
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="bg-rose-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-xs uppercase tracking-wider">
                        -{discountPct}% OFF
                      </span>
                    )}
                    {data.isBestSeller && (
                      <span className="bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-xs uppercase tracking-wider">
                        BEST SELLER
                      </span>
                    )}
                  </div>

                  <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-700 hover:text-rose-600 flex items-center justify-center shadow-md transition-all z-10">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>

                {/* Thumbnails Row */}
                {images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-16 h-20 rounded-xl overflow-hidden relative shrink-0 border-2 transition-all ${
                          idx === activeImageIndex
                            ? 'border-[#800020] shadow-sm scale-105'
                            : 'border-neutral-200 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Image
                          src={withVariant(img, 'thumb')}
                          alt={`Thumbnail ${idx + 1}`}
                          fill
                          sizes="64px"
                          unoptimized={isLocalOrPlaceholder(img)}
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: Product Details & Buying Options (Span 6) */}
              <div className="lg:col-span-6 space-y-6 text-left">
                
                {/* Brand & Title */}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-[#800020] uppercase tracking-widest block">
                    {brand}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-bold font-serif text-neutral-900 leading-tight">
                    {title}
                  </h1>

                  {/* Rating & Reviews */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-neutral-800">5.0</span>
                    <span className="text-xs text-neutral-400 font-medium">(24 reviews)</span>
                  </div>
                </div>

                {/* Price Section */}
                <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-1">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-extrabold text-[#800020] font-serif">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    {hasDiscount && (
                      <span className="text-base text-neutral-400 line-through font-semibold">
                        ₹{originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
                        {discountPct}% OFF
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 font-medium">Inclusive of all taxes</p>
                </div>

                {/* Short Description */}
                {data.shortDescription && (
                  <p className="text-xs text-neutral-600 font-normal leading-relaxed">
                    {data.shortDescription}
                  </p>
                )}

                {/* COLOR SELECTION */}
                {data.colorGroups.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-neutral-900">Color:</span>
                      <span className="font-bold text-[#800020]">{currentColorGroup?.name}</span>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {data.colorGroups.map((group, idx) => (
                        <button
                          key={group.id || idx}
                          type="button"
                          title={group.name}
                          onClick={() => {
                            setActiveColorIndex(idx);
                            setActiveImageIndex(0);
                            setSelectedSize('');
                          }}
                          className={`relative w-9 h-9 rounded-full p-0.5 transition-all duration-200 ${
                            idx === activeColorIndex
                              ? 'ring-2 ring-offset-2 ring-[#800020] scale-110 shadow-sm'
                              : 'hover:scale-105 opacity-85 hover:opacity-100 border border-neutral-200'
                          }`}
                        >
                          {group.swatchImage ? (
                            <Image
                              src={group.swatchImage}
                              alt={group.name}
                              fill
                              sizes="36px"
                              className="rounded-full object-cover shadow-2xs"
                              unoptimized={isLocalOrPlaceholder(group.swatchImage)}
                            />
                          ) : (
                            <span
                              className="block w-full h-full rounded-full shadow-2xs border border-black/10"
                              style={{ backgroundColor: group.hex || '#800020' }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* SIZE SELECTION */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-neutral-900">Select Size:</span>
                    <span className="text-[#800020] font-bold underline cursor-pointer">Size Chart</span>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {(currentColorGroup?.sizes?.length ? currentColorGroup.sizes : [
                      { size: 'S', stock: 10, available: true },
                      { size: 'M', stock: 15, available: true },
                      { size: 'L', stock: 8, available: true },
                      { size: 'XL', stock: 5, available: true },
                      { size: 'XXL', stock: 0, available: false },
                    ]).map((sz, idx) => {
                      const isSelected = selectedSize === sz.size;
                      const isOutOfStock = sz.stock <= 0 || !sz.available;

                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => setSelectedSize(sz.size)}
                          className={`min-w-12 h-11 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center ${
                            isSelected
                              ? 'border-[#800020] bg-[#800020] text-white shadow-md'
                              : isOutOfStock
                              ? 'border-neutral-200 bg-neutral-100 text-neutral-400 opacity-50 cursor-not-allowed line-through'
                              : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-400'
                          }`}
                        >
                          <span>{sz.size}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CTA Action Buttons */}
                <div className="space-y-3 pt-4 border-t border-neutral-100">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="flex-1 bg-[#800020] hover:bg-[#600018] text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>ADD TO CART</span>
                    </button>

                    <button
                      type="button"
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-md transition-all hover:scale-102 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>BUY NOW</span>
                    </button>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100 text-center">
                  <div className="p-2.5 bg-neutral-50 rounded-xl space-y-1">
                    <Truck className="w-4 h-4 text-[#800020] mx-auto" />
                    <p className="text-[10px] font-bold text-neutral-800">Free Shipping</p>
                  </div>
                  <div className="p-2.5 bg-neutral-50 rounded-xl space-y-1">
                    <RotateCcw className="w-4 h-4 text-[#800020] mx-auto" />
                    <p className="text-[10px] font-bold text-neutral-800">10 Days Return</p>
                  </div>
                  <div className="p-2.5 bg-neutral-50 rounded-xl space-y-1">
                    <ShieldCheck className="w-4 h-4 text-[#800020] mx-auto" />
                    <p className="text-[10px] font-bold text-neutral-800">100% Authentic</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* MODE 2: PRODUCT CARD VIEW (Grid View Preview) */}
        {previewMode === 'card' && (
          <div className="max-w-xs mx-auto">
            <div className="bg-white text-neutral-900 rounded-2xl overflow-hidden border border-neutral-200 shadow-xl group">
              <div className="relative aspect-[4/5] bg-neutral-100 overflow-hidden">
                {mainImage ? (
                  <Image
                    src={mainImage}
                    alt={title}
                    fill
                    sizes="320px"
                    unoptimized={isLocalOrPlaceholder(mainImage)}
                    className="object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-rose-50/50 to-neutral-100 text-center space-y-2">
                    <Eye className="w-6 h-6 text-[#800020]" />
                    <span className="text-[10px] font-bold text-neutral-600">Product Card Preview</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  {data.isNewArrival && (
                    <span className="bg-neutral-900 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                      NEW
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="bg-rose-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                      -{discountPct}%
                    </span>
                  )}
                </div>
                <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 text-neutral-700 flex items-center justify-center shadow-2xs z-10">
                  <Heart className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-2 text-left">
                <span className="text-[10px] font-bold text-[#800020] uppercase tracking-wider block">
                  {brand}
                </span>
                <h4 className="text-xs font-bold text-neutral-900 line-clamp-1 leading-snug">
                  {title}
                </h4>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-extrabold text-[#800020]">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    {hasDiscount && (
                      <span className="text-[11px] text-neutral-400 line-through">
                        ₹{originalPrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-amber-400 text-[10px]">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-bold text-neutral-800">5.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
});

