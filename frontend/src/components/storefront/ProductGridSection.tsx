'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { isLocalOrPlaceholder, withVariant } from '@/lib/media-url';
import { PLACEHOLDER_IMAGE } from '@/features/customer/mappers';

export interface ProductItem {
  id: string;
  brand: string;
  title: string;
  price: number;
  originalPrice: number;
  discount: string;
  rating: number;
  reviewsCount: number;
  image: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  slug?: string;
}

interface ProductGridSectionProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  products: ProductItem[];
  icon?: React.ReactNode;
}

function ProductCardItem({
  product,
  idx,
  isWishlisted,
  onToggleWishlist,
}: {
  product: ProductItem;
  idx: number;
  isWishlisted: boolean;
  onToggleWishlist: (id: string) => void;
}) {
  const p = product as unknown as Record<string, unknown>;
  const rawImage = String(p.productCardImageUrl || p.cardImageUrl || p.primaryImageUrl || product.image || (Array.isArray(p.images) ? String((p.images[0] as Record<string, unknown>)?.url || '') : '') || '') || PLACEHOLDER_IMAGE;
  const imageSrc = withVariant(rawImage, 'medium') || PLACEHOLDER_IMAGE;
  const cardTitle = product.title || String(p.name || '') || 'Product';
  const priceVal = Number(product.price ?? p.salePrice ?? p.basePrice ?? 0);
  const origVal = Number(product.originalPrice ?? p.compareAtPrice ?? p.basePrice ?? 0);
  const brandName = String(product.brand || p.brandName || "VASANTHI'S SIGNATURE");
  const discountPct = origVal > priceVal ? Math.round(((origVal - priceVal) / origVal) * 100) : 0;

  return (
    <div className="w-[160px] sm:w-48 lg:w-full shrink-0 snap-start flex flex-col bg-white text-neutral-900 rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 group">
      <Link href={`/product/${product.slug || product.id}`} className="relative aspect-[4/5] overflow-hidden bg-neutral-100 block">
        <Image
          src={imageSrc}
          alt={cardTitle}
          fill
          priority={idx < 2}
          loading={idx < 2 ? 'eager' : 'lazy'}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          unoptimized={isLocalOrPlaceholder(rawImage)}
          className="object-cover group-hover:scale-108 transition-transform duration-500"
        />
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-20">
          {product.isNew !== false && (
            <span className="bg-neutral-900 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs uppercase tracking-wider">
              NEW
            </span>
          )}
          {discountPct > 0 && (
            <span className="bg-sky-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs uppercase tracking-wider">
              -{discountPct}%
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-2xs z-20 ${
            isWishlisted ? 'bg-sky-600 text-white' : 'bg-white/80 hover:bg-white text-neutral-700'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white text-sky-600' : ''}`} />
        </button>
      </Link>

      <div className="p-3 flex flex-col flex-1 justify-between space-y-1.5 text-left">
        <div>
          <span className="text-[10px] font-bold text-[#0284c7] uppercase tracking-wider block mb-0.5 truncate">
            {brandName}
          </span>
          <Link href={`/product/${product.slug || product.id}`}>
            <h3 className="text-xs font-bold text-neutral-900 line-clamp-1 hover:text-[#0284c7] transition-colors leading-snug">
              {cardTitle}
            </h3>
          </Link>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-extrabold text-[#0284c7]">
              ₹{priceVal.toLocaleString('en-IN')}
            </span>
            {origVal > priceVal && (
              <span className="text-xs text-neutral-400 line-through">
                ₹{origVal.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-700">
            <span className="text-amber-400 text-xs">★</span>
            <span>5.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}


const FALLBACK_PRODUCTS: ProductItem[] = [];

export function ProductGridSection({
  title,
  subtitle,
  viewAllHref = '/shop',
  products,
  icon,
}: ProductGridSectionProps) {
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const displayProducts = products && products.length > 0 ? products : FALLBACK_PRODUCTS;

  return (
    <section className="w-full max-w-[1440px] mx-auto px-0 lg:px-12 py-4 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-4 px-4 sm:px-8 lg:px-0">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold font-serif text-neutral-900 tracking-tight flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </h2>
          {subtitle && <p className="text-xs text-neutral-500 mt-0.5 hidden sm:block">{subtitle}</p>}
        </div>
        <Link href={viewAllHref} className="text-xs font-semibold text-[#1769D2] hover:text-[var(--brand-primary-dark)] flex items-center gap-1">
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {displayProducts.length === 0 ? (
        <div className="py-8 text-center px-4 bg-[#EAF4FF]/40 border border-[#DCEBFA] rounded-2xl mx-4 sm:mx-8 lg:mx-0">
          <p className="text-xs font-semibold text-neutral-600">New products arriving soon for {title}.</p>
          <Link href="/categories" className="text-xs font-bold text-[#1769D2] hover:underline mt-1 inline-block">
            Explore All Categories →
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile Scroll Section */}
          <div className="flex lg:hidden overflow-x-auto gap-3.5 px-4 pb-2.5 pt-1 snap-x snap-mandatory scrollbar-none">
            {displayProducts.map((product, idx) => (
              <ProductCardItem
                key={product.id}
                product={product}
                idx={idx}
                isWishlisted={!!wishlist[product.id]}
                onToggleWishlist={toggleWishlist}
              />
            ))}
          </div>

          {/* Desktop Grid Section */}
          <div className="hidden lg:grid lg:grid-cols-6 lg:gap-5 px-12">
            {displayProducts.map((product, idx) => (
              <ProductCardItem
                key={product.id}
                product={product}
                idx={idx}
                isWishlisted={!!wishlist[product.id]}
                onToggleWishlist={toggleWishlist}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

