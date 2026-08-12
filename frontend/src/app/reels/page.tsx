'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Heart, MessageCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useCustomerReels } from '@/features/customer/hooks';
import { PLACEHOLDER_IMAGE, formatInr } from '@/features/customer/mappers';
import { withVariant } from '@/lib/media-url';

export default function ReelsFeedPage() {
  const { data, isLoading, error } = useCustomerReels();
  const [currentReel, setCurrentReel] = useState(0);

  const reels = useMemo(() => {
    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    return list.map((post: unknown, index: number) => {
      const p = post as Record<string, unknown>;
      const media = (Array.isArray(p.media) ? (p.media[0] as Record<string, unknown>) : {}) || {};
      const productList = Array.isArray(p.products) ? p.products : Array.isArray(p.taggedProducts) ? p.taggedProducts : [];
      const product = (productList[0] as Record<string, unknown>) || {};
      return {
        id: String(p.id || `r-${index}`),
        title: String(p.title || p.caption || 'Reel'),
        price: Number(product.salePrice ?? product.basePrice ?? product.price ?? 0),
        image: String(media.thumbnailUrl || media.url || p.thumbnailUrl || PLACEHOLDER_IMAGE),
        likes: Number(p.likeCount ?? p.likes ?? 0),
        comments: Number(p.commentCount ?? p.comments ?? 0),
        productId: String(product.id || product.productId || ''),
      };
    });
  }, [data]);

  const activeReel = reels[currentReel];

  return (
    <div className="w-full min-h-screen bg-neutral-950 flex flex-col font-sans antialiased text-white pb-20 lg:pb-0">
      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1 text-white hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold font-serif tracking-tight">Shoppable Reels Feed</h1>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full flex items-center justify-center p-4 relative">
        {isLoading && <p className="text-sm text-neutral-400">Loading reels…</p>}
        {error && <p className="text-sm text-red-400">Failed to load reels</p>}
        {!isLoading && !activeReel && (
          <p className="text-sm text-neutral-400">No reels published yet</p>
        )}
        {activeReel && (
          <div className="relative w-full aspect-9/16 bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <Image src={withVariant(activeReel.image, 'large')} alt={activeReel.title} fill sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />
            <div className="absolute right-3 bottom-28 flex flex-col gap-4 items-center">
              <div className="flex flex-col items-center gap-1">
                <Heart className="w-6 h-6" />
                <span className="text-[10px]">{activeReel.likes}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <MessageCircle className="w-6 h-6" />
                <span className="text-[10px]">{activeReel.comments}</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
              <h2 className="text-sm font-bold">{activeReel.title}</h2>
              {activeReel.price > 0 && (
                <p className="text-xs text-amber-300 font-bold">{formatInr(activeReel.price)}</p>
              )}
              {activeReel.productId && (
                <Link
                  href={`/product/${activeReel.productId}`}
                  className="inline-block bg-white text-neutral-900 text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Shop this look
                </Link>
              )}
            </div>
          </div>
        )}

        {reels.length > 1 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setCurrentReel((i) => Math.max(0, i - 1))}
              className="p-2 rounded-full bg-white/10"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentReel((i) => Math.min(reels.length - 1, i + 1))}
              className="p-2 rounded-full bg-white/10"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
