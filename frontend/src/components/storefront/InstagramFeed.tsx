'use client';

import React, { useState } from 'react';
import { ReelViewerModal, ReelData } from './ReelViewerModal';
import { usePublicReels } from '@/features/social/social.hooks';
import { SocialPostStatus } from '@/features/social/social.types';
import { resolveMediaUrl } from '@/lib/media-url';
import { PLACEHOLDER_IMAGE } from '@/features/customer/mappers';

const VALID_IMAGES = [PLACEHOLDER_IMAGE];

const FALLBACK_REELS: ReelData[] = VALID_IMAGES.map((img, idx) => ({
  id: `fallback-${idx}`,
  title: "Vasanthi's Signature Collection",
  posterImage: img,
  accountName: "Vasanthi's Signature",
  accountAvatar: 'VS',
  caption: 'Discover couture sarees, lehengas, and designer ethnic wear.',
  audioTrack: "Original Audio - Vasanthi's Signature",
  likes: `${1.2 + idx * 0.3}K`,
  comments: `${24 + idx * 5}`,
  shares: `${80 + idx * 12}`,
  taggedProducts: [
    {
      id: `prod-${idx}`,
      name: "Designer Ethnic Silk Outfit",
      price: 2999,
      originalPrice: 4999,
      discount: '40% OFF',
      image: img,
    },
  ],
}));

function InstaIcon({ className = 'w-6 h-6' }: { className?: string }) {
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
  
  // Fetch published reels & posts live from public API (works for all storefront visitors!)
  const { data: apiPosts } = usePublicReels();

  // Map backend API posts to ReelData format
  const dbReels: ReelData[] = (apiPosts?.data || []).map((post, idx) => {
    const firstMedia = post.media?.[0];
    const rawMediaUrl = firstMedia?.url || firstMedia?.thumbnailUrl;
    const resolvedUrl = rawMediaUrl ? resolveMediaUrl(rawMediaUrl) : undefined;
    
    const fallbackImage = VALID_IMAGES[idx % VALID_IMAGES.length];
    const isVideo = post.contentType === 'REEL' || firstMedia?.mediaType === 'VIDEO' || resolvedUrl?.endsWith('.mp4');
    
    const posterImage = resolvedUrl || fallbackImage;
    const videoUrl = isVideo ? resolvedUrl : undefined;

    const taggedProducts = (post.productTags || []).map((tag) => ({
      id: tag.productId,
      name: tag.label || 'Vasanthi Signature Special',
      price: 3499,
      originalPrice: 5499,
      discount: '36% OFF',
      image: posterImage,
    }));

    return {
      id: post.id,
      title: post.caption?.slice(0, 30) || "Vasanthi's Signature",
      posterImage,
      videoUrl,
      accountName: "Vasanthi's Signature",
      accountAvatar: 'VS',
      caption: post.caption || "Vasanthi's Signature Festive Collection",
      audioTrack: "Original Audio - Vasanthi's Signature",
      likes: `${post.likeCount || 120}`,
      comments: `${post.commentCount || 14}`,
      shares: `${post.shareCount || 45}`,
      taggedProducts: taggedProducts.length > 0 ? taggedProducts : FALLBACK_REELS[0].taggedProducts,
    };
  });

  // Combine live database reels with fallbacks if DB is empty
  const activeReels = dbReels.length > 0 ? dbReels : FALLBACK_REELS;

  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-8">
      <div className="flex items-center justify-between gap-4 mb-3 sm:mb-6">
        <h2 className="text-lg sm:text-2xl font-bold font-serif text-neutral-900 tracking-tight flex items-center gap-2">
          <InstaIcon className="w-5 h-5 text-[#800020]" />
          <span>Follow Us On Instagram</span>
        </h2>
      </div>

      {/* Horizontal Side-Scrolling Carousel on Mobile, Grid on Desktop */}
      <div className="flex overflow-x-auto gap-3 pb-3 pt-1 scrollbar-none snap-x snap-mandatory lg:grid lg:grid-cols-8 lg:gap-3">
        {activeReels.map((reel, index) => {
          const fallbackImg = VALID_IMAGES[index % VALID_IMAGES.length];
          const isVideo = (reel.videoUrl || reel.posterImage)?.includes('.mp4');

          return (
            <button
              key={reel.id}
              onClick={() => setSelectedReelIndex(index)}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-900 shadow-2xs border border-neutral-200/60 w-[140px] sm:w-[160px] lg:w-auto shrink-0 snap-start text-left"
            >
              {isVideo ? (
                <video
                  src={reel.videoUrl || reel.posterImage}
                  poster={reel.posterImage?.endsWith('.mp4') ? undefined : reel.posterImage}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  muted
                  playsInline
                  loop
                  autoPlay
                  onError={(e) => {
                    // Fallback to image if video fails to load
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      const img = document.createElement('img');
                      img.src = fallbackImg;
                      img.className = 'w-full h-full object-cover';
                      target.parentElement.appendChild(img);
                    }
                  }}
                />
              ) : (
                <img
                  src={reel.posterImage}
                  alt={reel.title}
                  onError={(e) => {
                    e.currentTarget.src = fallbackImg;
                  }}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              )}

              {/* Reel Play Badge Icon */}
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs p-1 rounded-full text-white">
                <InstaIcon className="w-3.5 h-3.5" />
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-2 text-center text-white text-[10px] font-bold">
                <span className="line-clamp-2">{reel.title}</span>
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
