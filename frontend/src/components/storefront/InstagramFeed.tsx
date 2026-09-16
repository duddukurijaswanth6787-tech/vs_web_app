'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ReelViewerModal, ReelData, TaggedProduct } from './ReelViewerModal';
import { usePublicReels } from '@/features/social/social.hooks';
import { resolveMediaUrl, withVariant, isLocalOrPlaceholder } from '@/lib/media-url';

function InstaIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function InstagramFeed() {
  const [selectedReelIndex, setSelectedReelIndex] = useState<number | null>(null);

  // Fetch published reels & posts live from public API
  const { data: apiPosts, isLoading } = usePublicReels();

  // Map backend API posts to ReelData format
  const activeReels: ReelData[] = (apiPosts?.data || []).map((post) => {
    const firstMedia = post.media?.[0];
    const rawMediaUrl = firstMedia?.url;
    const resolvedUrl = rawMediaUrl ? resolveMediaUrl(rawMediaUrl) : undefined;

    const isVideo = post.contentType === 'REEL' || firstMedia?.mediaType === 'VIDEO' || (resolvedUrl ? resolvedUrl.endsWith('.mp4') || resolvedUrl.includes('/videos/') : false);
    const rawThumbUrl = firstMedia?.thumbnailUrl;
    const videoUrl = isVideo ? resolvedUrl : undefined;

    // Handle tagged products accurately from post.products OR post.productTags
    const postProducts = Array.isArray(post.products)
      ? post.products
      : Array.isArray((post as unknown as Record<string, unknown>).taggedProducts)
        ? ((post as unknown as Record<string, unknown>).taggedProducts as unknown[])
        : Array.isArray(post.productTags)
          ? post.productTags
          : [];

    const taggedProducts: TaggedProduct[] = postProducts
      .map((pItem: unknown, i: number) => {
        const pRecord = pItem as Record<string, unknown>;
        const prod = (pRecord.product as Record<string, unknown>) || pRecord;
        if (!prod || !prod.id) return null;

        // If product or variant was soft-deleted, skip it
        if (prod.deletedAt || (pRecord.variant as Record<string, unknown>)?.deletedAt) {
          return null;
        }

        const primaryMedia = ((prod.media as Array<Record<string, unknown>>)?.[0]?.url) || prod.primaryImageUrl || prod.image;
        const variantRecord = pRecord.variant as Record<string, unknown> | undefined;

        // Determine stock availability live
        let inStock = true;
        let stockCount: number | undefined;

        if (variantRecord?.inventory && typeof variantRecord.inventory === 'object') {
          const vInv = variantRecord.inventory as Record<string, unknown>;
          stockCount = Number(vInv.availableQuantity ?? 0);
          inStock = stockCount > 0 || vInv.stockStatus === 'IN_STOCK';
        } else if (Array.isArray(prod.variants) && prod.variants.length > 0) {
          const variantsList = prod.variants as Array<Record<string, unknown>>;
          const totalQty = variantsList.reduce((sum: number, v) => {
            const inv = v.inventory as Record<string, unknown> | undefined;
            return sum + Number(inv?.availableQuantity ?? 0);
          }, 0);
          stockCount = totalQty;
          const anyInStockStatus = variantsList.some((v) => {
            const inv = v.inventory as Record<string, unknown> | undefined;
            return inv?.stockStatus === 'IN_STOCK';
          });
          inStock = totalQty > 0 || anyInStockStatus;
        } else if (typeof prod.inStock === 'boolean') {
          inStock = prod.inStock;
        } else if (typeof prod.stock === 'number') {
          stockCount = prod.stock;
          inStock = prod.stock > 0;
        }

        const basePriceNum = Number(prod.basePrice ?? prod.originalPrice ?? 0);
        const salePriceNum = Number(prod.salePrice ?? prod.price ?? basePriceNum);
        const hasDiscount = basePriceNum > salePriceNum && salePriceNum > 0;
        const discountStr = hasDiscount
          ? `${Math.round(((basePriceNum - salePriceNum) / basePriceNum) * 100)}% OFF`
          : '';

        return {
          id: String(prod.id || pRecord.productId || `prod-${i}`),
          name: String(pRecord.label || prod.name || prod.title || "Vasanthi's Signature Exclusive"),
          price: salePriceNum > 0 ? salePriceNum : basePriceNum,
          originalPrice: basePriceNum > 0 ? basePriceNum : salePriceNum,
          discount: discountStr,
          image: primaryMedia ? resolveMediaUrl(String(primaryMedia)) : '/images/placeholder.jpg',
          inStock,
          stock: stockCount,
          position: { top: `${30 + i * 15}%`, left: `${20 + i * 10}%` },
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    const posterImage = (rawThumbUrl ? resolveMediaUrl(rawThumbUrl) : undefined)
      || (!isVideo && resolvedUrl ? resolvedUrl : undefined)
      || (taggedProducts[0]?.image ? taggedProducts[0].image : undefined)
      || (videoUrl ? videoUrl : '/images/placeholder.jpg');

    return {
      id: post.id,
      title: post.caption?.slice(0, 30) || "Vasanthi's Signature",
      posterImage,
      videoUrl,
      accountName: "Vasanthi's Signature",
      accountAvatar: 'VS',
      caption: post.caption || "Vasanthi's Signature Festive Collection",
      audioTrack: "Original Audio - Vasanthi's Signature",
      likes: `${post.likeCount || 0}`,
      comments: `${post.commentCount || 0}`,
      shares: `${post.shareCount || 0}`,
      taggedProducts,
    };
  });

  // If no reels have been published yet or still loading, don't show fake fallback reels
  if (activeReels.length === 0) {
    return null;
  }

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-8">
      <div className="flex items-center justify-between gap-4 mb-3 sm:mb-6">
        <h2 className="text-lg sm:text-2xl font-bold font-serif text-neutral-900 tracking-tight flex items-center gap-2">
          <InstaIcon className="w-5 h-5 text-[var(--brand-primary)]" />
          <span>Follow Us On Instagram</span>
        </h2>
      </div>

      {/* Responsive Grid / Horizontal Scroll for Published Reels */}
      <div className="flex overflow-x-auto gap-3 pb-3 pt-1 scrollbar-none snap-x snap-mandatory sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 lg:gap-4">
        {activeReels.map((reel, index) => {
          const isVideo = !!reel.videoUrl;
          const posterSrc = reel.posterImage && !reel.posterImage.endsWith('.mp4') && !reel.posterImage.includes('/videos/')
            ? reel.posterImage
            : reel.taggedProducts?.[0]?.image || '/images/placeholder.jpg';

          return (
            <button
              key={reel.id}
              onClick={() => setSelectedReelIndex(index)}
              className="group relative aspect-3/4 rounded-2xl overflow-hidden bg-neutral-900 shadow-2xs border border-neutral-200/60 w-[140px] sm:w-auto shrink-0 snap-start text-left cursor-pointer transition-transform hover:-translate-y-1"
            >
              <Image
                src={withVariant(posterSrc, 'medium')}
                alt={reel.title}
                fill
                loading={index < 3 ? 'eager' : 'lazy'}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                unoptimized={isLocalOrPlaceholder(posterSrc)}
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />

              {/* Reel Play Badge Icon */}
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs p-1.5 rounded-full text-white z-10 shadow-xs">
                {isVideo ? (
                  <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <InstaIcon className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-2 text-center text-white text-xs font-semibold z-10">
                <span className="line-clamp-2">{reel.caption || reel.title}</span>
              </div>
            </button>
          );
        })}
      </div>

      {selectedReelIndex !== null && (
        <ReelViewerModal
          reels={activeReels}
          initialReelIndex={selectedReelIndex}
          isOpen={true}
          onClose={() => setSelectedReelIndex(null)}
        />
      )}
    </section>
  );
}
