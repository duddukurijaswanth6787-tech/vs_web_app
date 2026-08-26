'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ReelViewerModal, ReelData } from './ReelViewerModal';
import { usePublicReels } from '@/features/social/social.hooks';
import { resolveMediaUrl } from '@/lib/media-url';
import { PLACEHOLDER_IMAGE } from '@/features/customer/mappers';

const FALLBACK_REELS: ReelData[] = [
  {
    id: 'fallback-1',
    title: 'Kanjeevaram Pure Silk Saree',
    posterImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80',
    accountName: "Vasanthi's Signature",
    accountAvatar: 'VS',
    caption: 'Pure handcrafted Kanjeevaram silk saree with gold zari weave.',
    audioTrack: "Original Audio - Vasanthi's Signature",
    likes: '2.4K',
    comments: '48',
    shares: '120',
    taggedProducts: [
      {
        id: 'prod-1',
        name: 'Kanjeevaram Pure Silk Saree',
        price: 9999,
        originalPrice: 12999,
        discount: '23% OFF',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'fallback-2',
    title: 'Royal Velvet Bridal Lehenga',
    posterImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
    accountName: "Vasanthi's Signature",
    accountAvatar: 'VS',
    caption: 'Heavy velvet bridal lehenga embroidered with zardozi and sequin work.',
    audioTrack: "Original Audio - Vasanthi's Signature",
    likes: '4.8K',
    comments: '92',
    shares: '310',
    taggedProducts: [
      {
        id: 'prod-2',
        name: 'Royal Velvet Embroidered Lehenga',
        price: 18999,
        originalPrice: 24999,
        discount: '24% OFF',
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'fallback-3',
    title: 'Floral Printed Anarkali Kurta',
    posterImage: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80',
    accountName: "Vasanthi's Signature",
    accountAvatar: 'VS',
    caption: 'Elegant floral printed rayon Anarkali kurta set with matching dupatta.',
    audioTrack: "Original Audio - Vasanthi's Signature",
    likes: '1.9K',
    comments: '34',
    shares: '85',
    taggedProducts: [
      {
        id: 'prod-3',
        name: 'Floral Printed Anarkali Kurta Set',
        price: 2499,
        originalPrice: 3499,
        discount: '28% OFF',
        image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'fallback-4',
    title: 'Handloomed Organza Silk Saree',
    posterImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80',
    accountName: "Vasanthi's Signature",
    accountAvatar: 'VS',
    caption: 'Lightweight organza saree with floral embroidery and scalloped border.',
    audioTrack: "Original Audio - Vasanthi's Signature",
    likes: '3.1K',
    comments: '67',
    shares: '190',
    taggedProducts: [
      {
        id: 'prod-4',
        name: 'Handloomed Organza Silk Saree',
        price: 4999,
        originalPrice: 6999,
        discount: '28% OFF',
        image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'fallback-5',
    title: 'Embroidered Chanderi Kurti',
    posterImage: 'https://images.unsplash.com/photo-1583391733975-d4001e3e7f6e?w=600&auto=format&fit=crop&q=80',
    accountName: "Vasanthi's Signature",
    accountAvatar: 'VS',
    caption: 'Chanderi silk festive kurti styled with matching palazzos.',
    audioTrack: "Original Audio - Vasanthi's Signature",
    likes: '1.7K',
    comments: '29',
    shares: '76',
    taggedProducts: [
      {
        id: 'prod-5',
        name: 'Embroidered Chanderi Kurti Set',
        price: 3299,
        originalPrice: 4499,
        discount: '26% OFF',
        image: 'https://images.unsplash.com/photo-1583391733975-d4001e3e7f6e?w=600&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'fallback-6',
    title: 'Pastel Designer Gown',
    posterImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
    accountName: "Vasanthi's Signature",
    accountAvatar: 'VS',
    caption: 'Contemporary designer pastel silk gown with mirror embroidery.',
    audioTrack: "Original Audio - Vasanthi's Signature",
    likes: '2.8K',
    comments: '51',
    shares: '142',
    taggedProducts: [
      {
        id: 'prod-6',
        name: 'Pastel Mirror Work Designer Gown',
        price: 7999,
        originalPrice: 10999,
        discount: '27% OFF',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'fallback-7',
    title: 'Zari Woven Tissue Saree',
    posterImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80',
    accountName: "Vasanthi's Signature",
    accountAvatar: 'VS',
    caption: 'Luminous tissue silk saree woven with silver & gold metallic threads.',
    audioTrack: "Original Audio - Vasanthi's Signature",
    likes: '3.6K',
    comments: '73',
    shares: '215',
    taggedProducts: [
      {
        id: 'prod-7',
        name: 'Zari Woven Tissue Silk Saree',
        price: 8499,
        originalPrice: 11999,
        discount: '29% OFF',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'fallback-8',
    title: 'Haute Couture Bridal Choli',
    posterImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
    accountName: "Vasanthi's Signature",
    accountAvatar: 'VS',
    caption: 'Custom tailored haute couture wedding bridal choli set.',
    audioTrack: "Original Audio - Vasanthi's Signature",
    likes: '5.2K',
    comments: '110',
    shares: '430',
    taggedProducts: [
      {
        id: 'prod-8',
        name: 'Haute Couture Bridal Choli',
        price: 21999,
        originalPrice: 28999,
        discount: '24% OFF',
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
      },
    ],
  },
];

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

  // Fetch published reels & posts live from public API
  const { data: apiPosts, isLoading } = usePublicReels();

  // Map backend API posts to ReelData format
  const dbReels: ReelData[] = (apiPosts?.data || []).map((post, idx) => {
    const firstMedia = post.media?.[0];
    const rawMediaUrl = firstMedia?.url;
    const resolvedUrl = rawMediaUrl ? resolveMediaUrl(rawMediaUrl) : undefined;

    const fallbackImage = FALLBACK_REELS[idx % FALLBACK_REELS.length].posterImage;
    const isVideo = post.contentType === 'REEL' || firstMedia?.mediaType === 'VIDEO' || resolvedUrl?.endsWith('.mp4');

    const rawThumbUrl = firstMedia?.thumbnailUrl;
    const posterImage = (rawThumbUrl ? resolveMediaUrl(rawThumbUrl) : undefined)
      || (!isVideo ? resolvedUrl : undefined)
      || fallbackImage;
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

  // Only display Super Admin uploaded/published reels from the database.
  // If no reels are in the database yet, hide the section (return null) so it's 100% dynamic.
  const activeReels = dbReels;

  if (!isLoading && activeReels.length === 0) {
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

      {/* Horizontal Side-Scrolling Carousel on Mobile, Grid on Desktop.
          Grid tiles are static images only — never autoplaying video. With
          8+ tiles on screen at once, autoplaying <video> per tile meant up
          to 8 simultaneous video downloads/decodes on page load, which is
          the single heaviest thing this page could do on a mid-range phone.
          Actual video playback happens one-at-a-time in ReelViewerModal on
          tap, same as before. */}
      <div className="flex overflow-x-auto gap-3 pb-3 pt-1 scrollbar-none snap-x snap-mandatory lg:grid lg:grid-cols-8 lg:gap-3">
        {activeReels.map((reel, index) => {
          const isVideo = !!reel.videoUrl;

          return (
            <button
              key={reel.id}
              onClick={() => setSelectedReelIndex(index)}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-900 shadow-2xs border border-neutral-200/60 w-[140px] sm:w-[160px] lg:w-auto shrink-0 snap-start text-left"
            >
              <Image
                src={reel.posterImage}
                alt={reel.title}
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />

              {/* Reel Play Badge Icon — filled for actual video reels */}
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs p-1 rounded-full text-white">
                {isVideo ? (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <InstaIcon className="w-3.5 h-3.5" />
                )}
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
