import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Heart, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
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
  itemsPerPage?: number;
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
  const [imgError, setImgError] = useState(false);
  const p = product as unknown as Record<string, unknown>;
  const rawImage = String(p.productCardImageUrl || p.cardImageUrl || p.primaryImageUrl || product.image || (Array.isArray(p.images) ? String((p.images[0] as Record<string, unknown>)?.url || '') : '') || '') || PLACEHOLDER_IMAGE;
  const imageSrc = imgError ? PLACEHOLDER_IMAGE : (withVariant(rawImage, 'medium') || PLACEHOLDER_IMAGE);
  const cardTitle = product.title || String(p.name || '') || 'Product';
  const priceVal = Number(product.price ?? p.salePrice ?? p.basePrice ?? 0);
  const origVal = Number(product.originalPrice ?? p.compareAtPrice ?? p.basePrice ?? 0);
  const brandName = String(product.brand || p.brandName || "VASANTHI'S SIGNATURE");
  const discountPct = origVal > priceVal ? Math.round(((origVal - priceVal) / origVal) * 100) : 0;

  return (
    <div className="w-full flex flex-col bg-white text-neutral-900 rounded-2xl border border-neutral-200 overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 group">
      <Link href={`/product/${product.slug || product.id}`} className="relative aspect-[4/5] overflow-hidden bg-neutral-100 block">
        <Image
          src={imageSrc}
          alt={cardTitle}
          fill
          priority={idx < 4}
          loading={idx < 4 ? 'eager' : 'lazy'}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          unoptimized={isLocalOrPlaceholder(imageSrc)}
          onError={() => setImgError(true)}
          className="object-cover group-hover:scale-108 transition-transform duration-500"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
          {product.isNew !== false && (
            <span className="bg-neutral-900 text-white text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full shadow-2xs uppercase tracking-wider">
              NEW
            </span>
          )}
          {discountPct > 0 && (
            <span className="bg-sky-600 text-white text-[8px] sm:text-[9px] font-bold px-2 py-0.5 rounded-full shadow-2xs uppercase tracking-wider">
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
          className={`absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-2xs z-20 ${
            isWishlisted ? 'bg-sky-600 text-white' : 'bg-white/80 hover:bg-white text-neutral-700'
          }`}
          aria-label="Add to wishlist"
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-white text-sky-600' : ''}`} />
        </button>
      </Link>

      <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between space-y-1 text-left">
        <div>
          <span className="text-[9px] sm:text-[10px] font-bold text-[#0284c7] uppercase tracking-wider block mb-0.5 truncate">
            {brandName}
          </span>
          <Link href={`/product/${product.slug || product.id}`}>
            <h3 className="text-xs font-bold text-neutral-900 line-clamp-1 hover:text-[#0284c7] transition-colors leading-snug">
              {cardTitle}
            </h3>
          </Link>
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-xs sm:text-sm font-extrabold text-[#0284c7]">
              ₹{priceVal.toLocaleString('en-IN')}
            </span>
            {origVal > priceVal && (
              <span className="text-[10px] sm:text-xs text-neutral-400 line-through">
                ₹{origVal.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold text-neutral-700">
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
  viewAllHref,
  products,
  icon,
  itemsPerPage = 10,
}: ProductGridSectionProps) {
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const displayProducts = products && products.length > 0 ? products : FALLBACK_PRODUCTS;
  const totalPages = Math.max(1, Math.ceil(displayProducts.length / itemsPerPage));

  // Safe slice for active page (10 items per page)
  const currentProducts = displayProducts.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const handlePageChange = (newPage: number) => {
    if (newPage < 0 || newPage >= totalPages) return;
    setCurrentPage(newPage);
    if (sectionRef.current) {
      const topOffset = sectionRef.current.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  };

  return (
    <section ref={sectionRef} className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-4 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-2xl font-bold font-serif text-neutral-900 tracking-tight flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </h2>
          {subtitle && <p className="text-xs text-neutral-500 mt-0.5 hidden sm:block">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Header Mini Navigation Arrows if multiple pages exist */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                title="Previous products"
                aria-label="Previous products"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-bold text-neutral-700 px-1.5 min-w-[32px] text-center">
                {currentPage + 1}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-700 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                title="Next products"
                aria-label="Next products"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-xs font-semibold text-[#1769D2] hover:text-[var(--brand-primary-dark)] flex items-center gap-1 ml-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {displayProducts.length === 0 ? (
        <div className="py-8 text-center px-4 bg-[#EAF4FF]/40 border border-[#DCEBFA] rounded-2xl">
          <p className="text-xs font-semibold text-neutral-600">New products arriving soon for {title}.</p>
          <Link href="/categories" className="text-xs font-bold text-[#1769D2] hover:underline mt-1 inline-block">
            Explore All Categories →
          </Link>
        </div>
      ) : (
        <>
          {/* Vertical 2-Column Responsive Grid (2 per row on mobile, up to 5 on desktop) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
            {currentProducts.map((product, idx) => (
              <ProductCardItem
                key={product.id}
                product={product}
                idx={idx}
                isWishlisted={!!wishlist[product.id]}
                onToggleWishlist={toggleWishlist}
              />
            ))}
          </div>

          {/* Bottom Pagination & Next Batch Controls if > 10 items */}
          {totalPages > 1 && (
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-100">
              <div className="text-xs font-medium text-neutral-500 order-2 sm:order-1">
                Showing{' '}
                <span className="font-bold text-neutral-900">
                  {currentPage * itemsPerPage + 1}–{Math.min((currentPage + 1) * itemsPerPage, displayProducts.length)}
                </span>{' '}
                of <span className="font-bold text-neutral-900">{displayProducts.length}</span> items
              </div>

              {/* Page Buttons */}
              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className="px-3.5 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1 shadow-2xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => handlePageChange(pIdx)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                        currentPage === pIdx
                          ? 'bg-[#1769D2] text-white shadow-xs'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {pIdx + 1}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className="px-4 py-2 rounded-xl bg-[#1769D2] hover:bg-[var(--brand-primary-dark)] text-white text-xs font-bold disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-1 shadow-sm active:scale-95"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

