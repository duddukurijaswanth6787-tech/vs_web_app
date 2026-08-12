'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Sparkles, Heart, User } from 'lucide-react';
import { useCustomerWishlist } from '@/features/customer/hooks';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: wishlistData } = useCustomerWishlist();
  const typedWishlist = wishlistData as { items?: unknown[]; length?: number } | undefined;
  const wishlistCount = Array.isArray(wishlistData)
    ? wishlistData.length
    : typedWishlist?.items?.length ?? typedWishlist?.length ?? 0;

  const isHome = pathname === '/';
  const isCategories = pathname === '/categories';
  const isNewArrivals = pathname === '/categories/new-arrivals';
  const isWishlist = pathname === '/wishlist';
  const isAccount = pathname?.startsWith('/profile') || pathname === '/account';

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 px-3 py-2 flex items-center justify-around shadow-lg">
      
      {/* 1. Home */}
      <Link
        href="/"
        className={`flex flex-col items-center gap-0.5 transition-all duration-200 ${
          isHome ? 'text-[#800020] scale-105 font-bold' : 'text-neutral-600 hover:text-[#800020]'
        }`}
      >
        <Home className={`w-5 h-5 ${isHome ? 'fill-[#800020]' : ''}`} />
        <span className="text-[10px]">Home</span>
      </Link>

      {/* 2. Categories */}
      <Link
        href="/categories"
        className={`flex flex-col items-center gap-0.5 transition-all duration-200 ${
          isCategories ? 'text-[#800020] scale-105 font-bold' : 'text-neutral-600 hover:text-[#800020]'
        }`}
      >
        <LayoutGrid className={`w-5 h-5 ${isCategories ? 'fill-[#800020]' : ''}`} />
        <span className="text-[10px]">Categories</span>
      </Link>

      {/* 3. Floating Center Action Button (New Arrivals) */}
      <Link
        href="/categories/new-arrivals"
        className="flex flex-col items-center -mt-6 group shrink-0"
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-amber-300 shadow-lg transition-all duration-300 ${
          isNewArrivals
            ? 'bg-gradient-to-tr from-[#600018] via-[#800020] to-[#a0002a] text-amber-300 scale-110 shadow-amber-900/40 ring-4 ring-[#800020]/20'
            : 'bg-gradient-to-tr from-[#800020] to-[#b3002d] text-white hover:scale-105 shadow-neutral-400/30'
        }`}>
          <Sparkles className={`w-6 h-6 ${isNewArrivals ? 'fill-amber-300 text-amber-300 animate-pulse' : 'text-amber-200'}`} />
        </div>
        <span className={`text-[10px] font-bold mt-1 tracking-tight whitespace-nowrap ${
          isNewArrivals ? 'text-[#800020]' : 'text-neutral-700'
        }`}>
          New Arrivals
        </span>
      </Link>

      {/* 4. Wishlist */}
      <Link
        href="/wishlist"
        className={`flex flex-col items-center gap-0.5 transition-all duration-200 relative ${
          isWishlist ? 'text-[#800020] scale-105 font-bold' : 'text-neutral-600 hover:text-[#800020]'
        }`}
      >
        <div className="relative">
          <Heart className={`w-5 h-5 ${isWishlist ? 'fill-[#800020]' : ''}`} />
          <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 bg-[#800020] text-white text-[8px] font-extrabold rounded-full flex items-center justify-center border border-white shadow-2xs">
            {wishlistCount}
          </span>
        </div>
        <span className="text-[10px]">Wishlist</span>
      </Link>

      {/* 5. Account */}
      <Link
        href="/profile"
        className={`flex flex-col items-center gap-0.5 transition-all duration-200 ${
          isAccount ? 'text-[#800020] scale-105 font-bold' : 'text-neutral-600 hover:text-[#800020]'
        }`}
      >
        <User className={`w-5 h-5 ${isAccount ? 'fill-[#800020]' : ''}`} />
        <span className="text-[10px]">Account</span>
      </Link>
    </div>
  );
}
