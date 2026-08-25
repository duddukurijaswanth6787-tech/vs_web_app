'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { resolveMediaUrl } from '@/lib/media-url';
import {
  X,
  ArrowLeft,
  Search,
  ShoppingBag,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Music,
  Plus,
  Zap,
} from 'lucide-react';

export interface TaggedProduct {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: string;
  image: string;
  size?: string;
  inStock?: boolean;
  position?: { top: string; left: string };
}

export interface ReelData {
  id: string;
  title: string;
  videoUrl?: string;
  posterImage: string;
  accountName: string;
  accountAvatar: string;
  caption: string;
  audioTrack: string;
  likes: string;
  comments: string;
  shares: string;
  taggedProducts: TaggedProduct[];
}

interface ReelViewerModalProps {
  reels: ReelData[];
  initialReelIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ReelViewerModal({
  reels,
  initialReelIndex,
  isOpen,
  onClose,
}: ReelViewerModalProps) {
  const [prevInitialIndex, setPrevInitialIndex] = useState(initialReelIndex);
  const [currentIndex, setCurrentIndex] = useState(initialReelIndex);
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});
  const [cartCount, setCartCount] = useState(2);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  if (initialReelIndex !== prevInitialIndex) {
    setPrevInitialIndex(initialReelIndex);
    setCurrentIndex(initialReelIndex);
  }

  if (!isOpen || !reels || reels.length === 0) return null;

  const currentReel = reels[currentIndex] || reels[0];
  const isLiked = !!likedReels[currentReel.id];

  const handlePrevReel = () => {
    if (isAnimating) return;
    setSlideDirection('right');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : reels.length - 1));
      setIsAnimating(false);
    }, 200);
  };

  const handleNextReel = () => {
    if (isAnimating) return;
    setSlideDirection('left');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev < reels.length - 1 ? prev + 1 : 0));
      setIsAnimating(false);
    }, 200);
  };

  const toggleLike = () => {
    setLikedReels((prev) => ({ ...prev, [currentReel.id]: !prev[currentReel.id] }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md transition-opacity p-0 lg:p-6">
      
      {/* 
        DESKTOP LAYOUT (lg:flex-row lg:max-w-5xl lg:h-[88vh]):
        - Left Side: Full 9:16 Video Player
        - Right Side: Dedicated Shop the Look & Details Sidebar
      */}
      <div className="relative w-full h-full lg:max-w-5xl lg:h-[88vh] bg-black lg:bg-white sm:rounded-3xl overflow-hidden flex flex-col lg:flex-row shadow-2xl border border-neutral-800 lg:border-neutral-200">
        
        {/* ==================================================== */}
        {/* LEFT COLUMN: FULL REEL VIDEO PLAYER (Desktop & Mobile) */}
        {/* ==================================================== */}
        <div className="relative w-full lg:w-[460px] h-full bg-black flex flex-col justify-between overflow-hidden shrink-0">
          
          {/* Reel Top Header Row */}
          <div className="absolute top-0 left-0 right-0 z-30 p-3 px-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors active:scale-95"
                aria-label="Close Reel"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>

              <div className="flex items-center gap-1 cursor-pointer">
                <span className="text-base font-bold tracking-tight">Reels</span>
                <ChevronDown className="w-4 h-4 text-white/80" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
                <Search className="w-5 h-5 text-white" />
              </button>
              <Link href="/cart" className="relative p-1.5 hover:bg-white/20 rounded-full">
                <ShoppingBag className="w-5 h-5 text-white" />
                <span className="absolute top-0 right-0 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              </Link>
            </div>
          </div>

          {/* Side Swiping Carousel Navigation Arrows */}
          <button
            onClick={handlePrevReel}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/40 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg border border-white/20"
            aria-label="Previous Reel"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNextReel}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-black/40 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg border border-white/20"
            aria-label="Next Reel"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Video Poster Display */}
          <div className="relative w-full flex-1 bg-neutral-950 overflow-hidden flex items-center justify-center">
            <div
              className={`w-full h-full transition-all duration-300 ease-out flex items-center justify-center ${
                isAnimating
                  ? slideDirection === 'left'
                    ? '-translate-x-full opacity-30 scale-95'
                    : 'translate-x-full opacity-30 scale-95'
                  : 'translate-x-0 opacity-100 scale-100'
              }`}
            >
              {currentReel.videoUrl || currentReel.posterImage?.endsWith('.mp4') ? (
                <video
                  src={resolveMediaUrl(currentReel.videoUrl || currentReel.posterImage)}
                  poster={currentReel.posterImage?.endsWith('.mp4') ? undefined : resolveMediaUrl(currentReel.posterImage)}
                  className="w-full h-full object-cover select-none"
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  controls
                />
              ) : (
                <Image
                  src={resolveMediaUrl(currentReel.posterImage)}
                  alt={currentReel.title}
                  width={1080}
                  height={1920}
                  className="w-full h-full object-cover select-none"
                />
              )}
            </div>

            {/* Right Social Action Bar */}
            <div className="absolute right-3 bottom-12 lg:bottom-16 z-30 flex flex-col items-center gap-4.5 text-white">
              <div className="relative cursor-pointer">
                <div className="w-9 h-9 rounded-full border-2 border-white overflow-hidden bg-[#0284c7] text-amber-300 font-serif font-bold text-xs flex items-center justify-center shadow-md">
                  VD
                </div>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <Plus className="w-2.5 h-2.5" />
                </span>
              </div>

              <button
                onClick={toggleLike}
                className="flex flex-col items-center gap-0.5 text-white group cursor-pointer"
              >
                <Heart className={`w-6.5 h-6.5 transition-all duration-300 ${isLiked ? 'fill-rose-500 text-rose-500 scale-125' : 'group-hover:scale-110'}`} />
                <span className="text-[10px] font-bold">{currentReel.likes}</span>
              </button>

              <button className="flex flex-col items-center gap-0.5 text-white group cursor-pointer">
                <MessageCircle className="w-6.5 h-6.5 group-hover:scale-110 transition-all duration-300" />
                <span className="text-[10px] font-bold">{currentReel.comments}</span>
              </button>

              <button className="flex flex-col items-center gap-0.5 text-white group cursor-pointer">
                <Share2 className="w-6 h-6 group-hover:scale-110 transition-all duration-300" />
                <span className="text-[10px] font-bold">{currentReel.shares}</span>
              </button>

              <button className="p-1 text-white hover:text-rose-300 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Left Bottom Account Overlay */}
            <div className="absolute left-3 bottom-6 lg:bottom-8 z-30 max-w-[68%] text-white space-y-1 drop-shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-5.5 h-5.5 rounded-full bg-[#0284c7] text-amber-300 font-serif font-bold text-[9px] flex items-center justify-center border border-white/40 shadow-xs">
                  VD
                </div>
                <span className="text-xs font-bold text-white tracking-wide">
                  {currentReel.accountName}
                </span>
                <button className="border border-white/70 hover:bg-white hover:text-black text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full transition-all shadow-2xs">
                  Follow
                </button>
              </div>

              <p className="text-[10px] sm:text-[11px] text-white/95 font-medium line-clamp-2 leading-snug">
                {currentReel.caption}
              </p>

              <div className="flex items-center gap-1.5 text-[9.5px] text-white/80 font-medium">
                <Music className="w-3 h-3 text-amber-300 animate-spin" />
                <span className="truncate">{currentReel.audioTrack}</span>
              </div>
            </div>

          </div>

          {/* MOBILE-ONLY BOTTOM SHOP THE LOOK DRAWER */}
          <div className="lg:hidden relative z-40 bg-white rounded-t-3xl text-neutral-900 p-3.5 space-y-2.5 shadow-2xl flex flex-col max-h-[46vh]">
            <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto -mt-1 shrink-0" />
            <div className="flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xs font-extrabold text-neutral-900">Shop the look</h3>
                <span className="text-[9px] text-neutral-400 font-semibold">{currentReel.taggedProducts.length} items available</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[26vh] scroll-smooth">
              {currentReel.taggedProducts.map((prod) => (
                <div key={prod.id} className="flex items-center justify-between gap-3 p-2 rounded-2xl border border-neutral-100 bg-neutral-50/70">
                  <div className="flex items-center gap-2.5">
                    <Image
                      src={resolveMediaUrl(prod.image)}
                      alt={prod.name}
                      width={44}
                      height={48}
                      className="w-11 h-12 object-cover rounded-xl shrink-0"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">{prod.name}</h4>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-extrabold text-[#0284c7]">₹{prod.price.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-neutral-400 line-through">₹{prod.originalPrice.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setCartCount((prev) => prev + 1)} className="p-1.5 text-[#0284c7] border border-rose-200 bg-rose-50 rounded-xl">
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ==================================================== */}
        {/* RIGHT COLUMN: DESKTOP SHOP THE LOOK SIDEBAR (Desktop Only) */}
        {/* ==================================================== */}
        <div className="hidden lg:flex flex-1 bg-white p-6 flex-col justify-between overflow-y-auto border-l border-neutral-100">
          
          {/* Right Header & Account Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0284c7] text-amber-300 font-serif font-bold text-sm flex items-center justify-center shadow-xs">
                  VD
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 leading-tight">
                    {currentReel.accountName}
                  </h3>
                  <span className="text-[11px] text-neutral-500">
                    Vasanthi&apos;s Signature Official
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="bg-[#0284c7] hover:bg-[#0B3B78] text-white text-xs font-bold px-4 py-1.5 rounded-full transition-colors shadow-2xs">
                  Follow
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Reel Caption & Audio Detail */}
            <div className="space-y-2 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-100">
              <p className="text-xs text-neutral-800 font-medium leading-relaxed">
                {currentReel.caption}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-[#0284c7] font-semibold">
                <Music className="w-3.5 h-3.5 animate-spin" />
                <span>{currentReel.audioTrack}</span>
              </div>
            </div>
          </div>

          {/* Shop The Look Products Section Header */}
          <div className="my-4 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-neutral-900 font-serif flex items-center gap-2">
              <span>Shop the look</span>
              <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full">
                {currentReel.taggedProducts.length} Items
              </span>
            </h3>
          </div>

          {/* Desktop Product Cards List (Scrollable) */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 max-h-[44vh] scrollbar-thin scrollbar-thumb-neutral-200">
            {currentReel.taggedProducts.map((prod) => (
              <div
                key={prod.id}
                className="p-3.5 rounded-2xl border border-neutral-200/80 bg-white hover:border-[#0284c7]/40 transition-all duration-300 shadow-2xs hover:shadow-xs flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <Image
                    src={resolveMediaUrl(prod.image)}
                    alt={prod.name}
                    width={64}
                    height={80}
                    className="w-16 h-20 object-cover rounded-xl shrink-0 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="space-y-1 flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-neutral-900 line-clamp-1 group-hover:text-[#0284c7] transition-colors">
                      {prod.name}
                    </h4>
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-extrabold text-[#0284c7]">
                        ₹{prod.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-neutral-400 line-through">
                        ₹{prod.originalPrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md">
                        {prod.discount}
                      </span>
                    </div>

                    <span className="text-[10px] font-semibold text-emerald-700 block">
                      Size: {prod.size || 'Free Size'} | In Stock
                    </span>
                  </div>
                </div>

                {/* Right Action Buttons for Each Product */}
                <div className="flex flex-col gap-2 shrink-0">
                  <Link
                    href="/product/banarasi-silk-saree"
                    className="bg-[#0284c7] hover:bg-[#0B3B78] text-white text-xs font-bold py-2 px-3.5 rounded-xl transition-colors shadow-2xs text-center flex items-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>Buy</span>
                  </Link>

                  <button
                    onClick={() => setCartCount((prev) => prev + 1)}
                    className="border border-[#0284c7] text-[#0284c7] hover:bg-[#F3F8FF] text-xs font-bold py-1.5 px-3.5 rounded-xl transition-colors flex items-center gap-1"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Cart</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Desktop Actions */}
          <div className="pt-4 border-t border-neutral-100 flex items-center gap-3">
            <Link
              href="/categories/sarees"
              className="w-full border-2 border-[#0284c7] hover:bg-[#F3F8FF] text-[#0284c7] font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-2xs"
            >
              <span>EXPLORE ALL REEL PRODUCTS</span>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
