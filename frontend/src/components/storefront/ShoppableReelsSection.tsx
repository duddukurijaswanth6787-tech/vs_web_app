'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { Play, Heart, MessageCircle, Sparkles } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { ReelData } from './ReelViewerModal';

const ReelViewerModal = dynamic(() => import('./ReelViewerModal').then(mod => mod.ReelViewerModal), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black/85 flex items-center justify-center text-white text-sm">Loading player…</div>
});

import { useCustomerReels } from '@/features/customer/hooks';
import { PLACEHOLDER_IMAGE } from '@/features/customer/mappers';
import { isLocalOrPlaceholder, withVariant } from '@/lib/media-url';

export function ShoppableReelsSection() {
  const { data, isLoading } = useCustomerReels();
  const [activeReelIndex, setActiveReelIndex] = useState<number | null>(null);

  const reels: ReelData[] = useMemo(() => {
    const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    return list.map((post: any, index: number) => {
      const media = post.media?.[0] || post.medias?.[0] || {};
      const products = post.products || post.taggedProducts || [];
      return {
        id: post.id || `reel-${index}`,
        title: post.title || post.caption || 'Shoppable Reel',
        posterImage: media.thumbnailUrl || media.url || post.thumbnailUrl || post.coverUrl || PLACEHOLDER_IMAGE,
        accountName: post.authorName || 'vasanthi.designers',
        accountAvatar: 'VD',
        caption: post.caption || post.title || '',
        audioTrack: post.audioTrack || 'Original audio',
        likes: String(post.likeCount ?? post.likes ?? 0),
        comments: String(post.commentCount ?? post.comments ?? 0),
        shares: String(post.shareCount ?? post.shares ?? 0),
        taggedProducts: products.slice(0, 3).map((p: any, i: number) => ({
          id: p.id || p.productId || `tp-${i}`,
          name: p.name || p.productName || 'Product',
          price: Number(p.salePrice ?? p.basePrice ?? p.price ?? 0),
          originalPrice: Number(p.basePrice ?? p.originalPrice ?? p.price ?? 0),
          discount: '',
          image: p.primaryImageUrl || p.image || PLACEHOLDER_IMAGE,
          position: { top: `${30 + i * 15}%`, left: `${20 + i * 10}%` },
        })),
      } as ReelData;
    });
  }, [data]);

  if (!isLoading && reels.length === 0) return null;

  return (
    <section id="reels-feed" className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 py-2 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-neutral-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#800020]" />
            <span>Instagram Reels & Shoppable Feeds</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5 hidden sm:block">
            Live social commerce feed from the catalog
          </p>
        </div>
      </div>

      {isLoading && <p className="text-sm text-neutral-500">Loading reels…</p>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            onClick={() => setActiveReelIndex(index)}
            className="group relative aspect-9/16 rounded-3xl overflow-hidden bg-neutral-900 cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <Image
              src={withVariant(reel.posterImage, 'medium')}
              alt={reel.title}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              unoptimized={isLocalOrPlaceholder(reel.posterImage)}
              className="object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
              <Play className="w-4 h-4 fill-white ml-0.5" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2 text-white">
              <h3 className="text-xs font-semibold line-clamp-2 leading-snug drop-shadow-xs">
                {reel.caption || reel.title}
              </h3>
              <div className="flex items-center gap-3 text-[10px] text-white/80 font-medium pt-1">
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                  <span>{reel.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3 text-white" />
                  <span>{reel.comments}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeReelIndex !== null && (
        <ReelViewerModal
          reels={reels}
          initialReelIndex={activeReelIndex}
          isOpen={activeReelIndex !== null}
          onClose={() => setActiveReelIndex(null)}
        />
      )}
    </section>
  );
}
