'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Star, ArrowRight } from 'lucide-react';
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
  const rawImage = product.image || (product as any).primaryImageUrl || (product as any).images?.[0]?.url || PLACEHOLDER_IMAGE;
  const imageSrc = withVariant(rawImage, 'medium') || PLACEHOLDER_IMAGE;
  const cardTitle = product.title || (product as any).name || 'Product';
  const priceVal = Number(product.price ?? (product as any).salePrice ?? (product as any).basePrice ?? 0);
  const origVal = Number(product.originalPrice ?? (product as any).compareAtPrice ?? (product as any).basePrice ?? 0);

  return (
    <div className="w-[160px] sm:w-48 lg:w-full shrink-0 snap-start flex flex-col bg-white rounded-2xl border border-neutral-200/70 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300">
      <Link href={`/product/${product.slug || product.id}`} className="relative aspect-[3/4] overflow-hidden bg-neutral-100 block group">
        <Image
          src={imageSrc}
          alt={cardTitle}
          fill
          priority={idx < 2}
          loading={idx < 2 ? 'eager' : 'lazy'}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          unoptimized={isLocalOrPlaceholder(rawImage)}
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.isBestSeller ? (
          <span className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs z-20">
            BEST SELLER
          </span>
        ) : product.isNew !== false ? (
          <span className="absolute top-2.5 left-2.5 bg-[#800020] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs z-20">
            NEW
          </span>
        ) : null}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-colors z-20 ${
            isWishlisted ? 'bg-rose-600 text-white' : 'bg-white/80 hover:bg-white text-neutral-700'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-white' : ''}`} />
        </button>
      </Link>
      <div className="p-3 flex flex-col flex-1 justify-between space-y-1.5">
        <Link href={`/product/${product.slug || product.id}`}>
          <h3 className="text-xs font-semibold text-neutral-900 line-clamp-1 hover:text-[#800020] transition-colors">
            {cardTitle}
          </h3>
        </Link>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-extrabold text-neutral-900">
            ₹{priceVal.toLocaleString('en-IN')}
          </span>
          {origVal > priceVal && (
            <span className="text-[10px] text-neutral-400 line-through">
              ₹{origVal.toLocaleString('en-IN')}
            </span>
          )}
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
    <section className="w-full max-w-[1440px] mx-auto px-0 lg:px-12 py-2.5 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-4 px-4 sm:px-8 lg:px-0">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold font-serif text-neutral-900 tracking-tight flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </h2>
          {subtitle && <p className="text-xs text-neutral-500 mt-0.5 hidden sm:block">{subtitle}</p>}
        </div>
        <Link href={viewAllHref} className="text-xs font-semibold text-[#800020] hover:text-[#600018] flex items-center gap-1">
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

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
    </section>
  );
}

