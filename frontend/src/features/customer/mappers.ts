import type { ProductResponse } from '@/features/catalog/products/product.types';
import type { ProductItem } from '@/components/storefront/ProductGridSection';
import { resolveMediaUrl } from '@/lib/media-url';

// ponytail: local SVG placeholder instead of external placehold.co (saves 2-3s on slow connections)
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect fill='%23f8f4f2' width='400' height='500'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='24' fill='%23800020' text-anchor='middle' dominant-baseline='middle'%3EVasanthi%3C/text%3E%3C/svg%3E";

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function discountLabel(basePrice: number, salePrice?: number): string {
  if (!salePrice || salePrice >= basePrice || basePrice <= 0) return '';
  const pct = Math.round(((basePrice - salePrice) / basePrice) * 100);
  return pct > 0 ? `${pct}% OFF` : '';
}


export function mapProductToItem(p: ProductResponse): ProductItem {
  const price = p.salePrice ?? p.basePrice;
  const originalPrice = p.basePrice;
  return {
    id: p.id,
    brand: p.brandName || "Vasanthi's Signature",
    title: p.name,
    price,
    originalPrice,
    discount: discountLabel(originalPrice, p.salePrice),
    rating: 5,
    reviewsCount: 0,
    image: resolveMediaUrl(p.primaryImageUrl || p.images?.[0]?.url) || PLACEHOLDER_IMAGE,
    isNew: p.isNewArrival,
    slug: p.slug,
  };
}

export function productHref(product: { id: string; slug?: string }): string {
  return `/product/${product.slug || product.id}`;
}
