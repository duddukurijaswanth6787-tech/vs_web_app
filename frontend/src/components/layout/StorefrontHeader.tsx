'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  ChevronDown,
  Menu,
  X,
  Camera,
  Home,
  ChevronRight,
  Package,
  MapPin,
  Truck,
  Headphones,
  Phone,
  Percent,
  Sparkles,
  Tag,
  Layers,
  Shirt,
} from 'lucide-react';

import { useFeaturedCategories, useCustomerCart, useCustomerWishlist, usePublicSettings } from '@/features/customer/hooks';

export function StorefrontHeader() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const submitSearch = () => {
    const q = searchQuery.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };
  const { data: navCategories } = useFeaturedCategories();
  const { data: cartData } = useCustomerCart();
  const { data: wishlistData } = useCustomerWishlist();

  // Prevent background homepage scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [mobileMenuOpen]);

  const cartCount = (cartData as any)?.items?.length ?? (cartData as any)?.itemCount ?? 0;
  const wishlistCount = Array.isArray(wishlistData)
    ? wishlistData.length
    : (wishlistData as any)?.data?.length ?? (wishlistData as any)?.items?.length ?? (wishlistData as any)?.length ?? 0;

  const { data: settings } = usePublicSettings();
  const mobileAnnouncementEnabled = (settings as any)?.announcementBarMobileEnabled ?? true;
  const announcementText = (settings as any)?.announcementBarText || 'Festive Sale is Live! Get up to 30% OFF';

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 shadow-xs">
      {/* 01 TOP ANNOUNCEMENT BAR */}
      <div className={mobileAnnouncementEnabled ? "bg-[#800020] text-white py-1.5 px-3 text-center text-[10px] sm:text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5" : "hidden sm:flex bg-[#800020] text-white py-1.5 px-3 text-center text-xs font-semibold tracking-wide items-center justify-center gap-2"}>
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
        <span className="truncate">{announcementText}</span>
        <Link href="/offers" className="underline font-bold text-amber-300 hover:text-amber-200 shrink-0 ml-0.5">
          Shop Now →
        </Link>
      </div>

      {/* Top Header Row */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-8 lg:px-12 py-2 sm:py-3.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Mobile Menu Trigger & Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1 text-neutral-800 hover:bg-neutral-100 rounded-lg shrink-0"
              aria-label="Open Menu"
            >
              <Menu className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
            </button>

            <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <div className="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-full bg-[#800020] text-amber-300 flex items-center justify-center font-serif text-sm sm:text-lg font-bold shadow-xs shrink-0">
                ❖
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-base sm:text-2xl font-bold font-serif tracking-tight text-[#800020] leading-none whitespace-nowrap">
                  Vasanthi's Signature
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-neutral-700">
            <Link href="/" className="hover:text-[#800020] transition-colors font-bold text-[#800020] whitespace-nowrap">
              Home
            </Link>
            {navCategories && navCategories.length > 0 ? (
              navCategories.slice(0, 6).map((cat: any) => (
                <Link
                  key={cat.id || cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="hover:text-[#800020] transition-colors whitespace-nowrap font-medium text-neutral-700"
                >
                  {cat.name}
                </Link>
              ))
            ) : (
              <>
                <Link href="/categories/new-arrivals" className="hover:text-[#800020] transition-colors whitespace-nowrap">
                  New Arrivals
                </Link>
                <Link href="/categories/collections" className="hover:text-[#800020] transition-colors whitespace-nowrap">
                  Collections
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="hidden lg:block relative w-56 xl:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search for sarees, kurtis, lehengas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }}
                className="w-full bg-neutral-50 border border-neutral-200/80 rounded-full py-2 pl-9 pr-3 text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-[#800020]/20 placeholder:text-neutral-400"
              />
            </div>
            <Link href="/wishlist" className="relative p-1.5 text-neutral-800 hover:text-[#800020] transition-colors shrink-0" aria-label="Wishlist">
              <Heart className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-[#800020] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border border-white">
                {wishlistCount}
              </span>
            </Link>

            <Link href="/cart" className="relative p-1.5 text-neutral-800 hover:text-[#800020] transition-colors shrink-0" aria-label="Cart">
              <ShoppingBag className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-[#800020] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border border-white">
                {cartCount}
              </span>
            </Link>

            <Link href="/profile" className="hidden sm:block p-1.5 text-neutral-800 hover:text-[#800020] transition-colors shrink-0">
              <User className="w-6 h-6" />
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="mt-2.5 relative w-full lg:hidden">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search for sarees, kurtis, lehengas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }}
            className="w-full bg-neutral-50 border border-neutral-200/80 rounded-full py-2 pl-10 pr-4 text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-[#800020]/20 placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* MOBILE SIDE NAVIGATION DRAWER (Slide-in from Left matching screenshot) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] flex lg:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Slide-over Drawer Panel */}
          <div className="relative w-[85%] max-w-sm bg-white h-[100dvh] max-h-[100dvh] shadow-2xl flex flex-col justify-between overflow-y-auto overscroll-contain z-10 animate-in slide-in-from-left duration-300 pb-20">
            
            <div>
              {/* Drawer Top Header Row */}
              <div className="p-4 flex items-center justify-between border-b border-neutral-100 bg-[#FAF3F3]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#800020] text-amber-300 flex items-center justify-center font-serif text-base font-bold shadow-xs">
                    ❖
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base font-bold font-serif text-[#800020] leading-none">
                      Vasanthi's Signature
                    </span>
                    <span className="text-[10px] font-semibold text-rose-800 uppercase tracking-widest mt-0.5">
                      Women's Boutique
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-white rounded-full transition-colors"
                  aria-label="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Categories Navigation List (Women's Wear Special) */}
              <div className="p-3 space-y-1">
                
                {/* Home link */}
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3.5 px-4 py-3 rounded-xl bg-[#FAF0F2] text-[#800020] font-bold text-sm"
                >
                  <Home className="w-4.5 h-4.5 fill-[#800020]" />
                  <span>Home</span>
                </Link>

                {/* Sarees Section */}
                <div className="rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 text-neutral-800 hover:bg-neutral-50 rounded-xl text-sm font-semibold transition-colors">
                    <Link
                      href="/categories/sarees"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3.5 flex-1"
                    >
                      <Shirt className="w-4.5 h-4.5 text-[#800020]" />
                      <span>Sarees</span>
                    </Link>
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === 'sarees' ? null : 'sarees')}
                      className="p-1 text-neutral-400 hover:text-neutral-700"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedCategory === 'sarees' ? 'rotate-180 text-[#800020]' : ''}`} />
                    </button>
                  </div>
                  {expandedCategory === 'sarees' && (
                    <div className="pl-12 pr-4 py-1.5 space-y-2 bg-rose-50/50 rounded-b-xl border-l-2 border-[#800020] ml-4 my-1">
                      <Link href="/categories/silk-sarees" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-medium text-neutral-700 hover:text-[#800020]">Silk Sarees</Link>
                      <Link href="/categories/kanjeevaram" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-medium text-neutral-700 hover:text-[#800020]">Kanjeevaram</Link>
                      <Link href="/categories/banarasi" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-medium text-neutral-700 hover:text-[#800020]">Banarasi Sarees</Link>
                      <Link href="/categories/organza" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-medium text-neutral-700 hover:text-[#800020]">Organza & Chiffon</Link>
                    </div>
                  )}
                </div>

                {/* Lehengas Section */}
                <div className="rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 text-neutral-800 hover:bg-neutral-50 rounded-xl text-sm font-semibold transition-colors">
                    <Link
                      href="/categories/lehengas"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3.5 flex-1"
                    >
                      <Shirt className="w-4.5 h-4.5 text-[#800020]" />
                      <span>Lehengas</span>
                    </Link>
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === 'lehengas' ? null : 'lehengas')}
                      className="p-1 text-neutral-400 hover:text-neutral-700"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedCategory === 'lehengas' ? 'rotate-180 text-[#800020]' : ''}`} />
                    </button>
                  </div>
                  {expandedCategory === 'lehengas' && (
                    <div className="pl-12 pr-4 py-1.5 space-y-2 bg-rose-50/50 rounded-b-xl border-l-2 border-[#800020] ml-4 my-1">
                      <Link href="/categories/bridal-lehengas" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-medium text-neutral-700 hover:text-[#800020]">Bridal Lehengas</Link>
                      <Link href="/categories/party-lehengas" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-medium text-neutral-700 hover:text-[#800020]">Party Wear Lehengas</Link>
                      <Link href="/categories/crop-top-lehengas" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-medium text-neutral-700 hover:text-[#800020]">Crop Top Lehengas</Link>
                    </div>
                  )}
                </div>

                {/* Kurtis & Suits Section */}
                <div className="rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 text-neutral-800 hover:bg-neutral-50 rounded-xl text-sm font-semibold transition-colors">
                    <Link
                      href="/categories/kurtis"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3.5 flex-1"
                    >
                      <Shirt className="w-4.5 h-4.5 text-[#800020]" />
                      <span>Kurtis & Suits</span>
                    </Link>
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === 'kurtis' ? null : 'kurtis')}
                      className="p-1 text-neutral-400 hover:text-neutral-700"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedCategory === 'kurtis' ? 'rotate-180 text-[#800020]' : ''}`} />
                    </button>
                  </div>
                  {expandedCategory === 'kurtis' && (
                    <div className="pl-12 pr-4 py-1.5 space-y-2 bg-rose-50/50 rounded-b-xl border-l-2 border-[#800020] ml-4 my-1">
                      <Link href="/categories/anarkali-suits" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-medium text-neutral-700 hover:text-[#800020]">Anarkali Suits</Link>
                      <Link href="/categories/straight-kurtis" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-medium text-neutral-700 hover:text-[#800020]">Straight Cut Kurtis</Link>
                      <Link href="/categories/sharara-sets" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-medium text-neutral-700 hover:text-[#800020]">Sharara & Gharara Sets</Link>
                      <Link href="/categories/palazzo-suits" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-medium text-neutral-700 hover:text-[#800020]">Palazzo Suit Sets</Link>
                    </div>
                  )}
                </div>

                {/* Dresses & Indo-Western */}
                <div className="rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 text-neutral-800 hover:bg-neutral-50 rounded-xl text-sm font-semibold transition-colors">
                    <Link
                      href="/categories/dresses"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3.5 flex-1"
                    >
                      <Shirt className="w-4.5 h-4.5 text-[#800020]" />
                      <span>Indo-Western & Dresses</span>
                    </Link>
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === 'dresses' ? null : 'dresses')}
                      className="p-1 text-neutral-400 hover:text-neutral-700"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandedCategory === 'dresses' ? 'rotate-180 text-[#800020]' : ''}`} />
                    </button>
                  </div>
                  {expandedCategory === 'dresses' && (
                    <div className="pl-12 pr-4 py-1.5 space-y-2 bg-rose-50/50 rounded-b-xl border-l-2 border-[#800020] ml-4 my-1">
                      <Link href="/categories/designer-gowns" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-medium text-neutral-700 hover:text-[#800020]">Designer Gowns</Link>
                      <Link href="/categories/indo-western" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-medium text-neutral-700 hover:text-[#800020]">Indo-Western Fusion</Link>
                      <Link href="/categories/party-dresses" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-medium text-neutral-700 hover:text-[#800020]">Party Dresses</Link>
                    </div>
                  )}
                </div>

                {/* Dupattas */}
                <Link
                  href="/categories/dupattas"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 text-neutral-800 hover:bg-neutral-50 rounded-xl text-sm font-semibold transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <Shirt className="w-4.5 h-4.5 text-[#800020]" />
                    <span>Dupattas & Stoles</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Link>

                {/* New Arrivals */}
                <Link
                  href="/categories/new-arrivals"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 text-neutral-800 hover:bg-neutral-50 rounded-xl text-sm font-semibold transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <Tag className="w-4.5 h-4.5 text-[#800020]" />
                    <span>New Arrivals</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Link>

                {/* Festive Collection */}
                <Link
                  href="/categories/festive"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 text-neutral-800 hover:bg-neutral-50 rounded-xl text-sm font-semibold transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <Sparkles className="w-4.5 h-4.5 text-amber-600" />
                    <span>Festive Collection</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Link>

                {/* Sale */}
                <Link
                  href="/offers"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 text-[#800020] bg-rose-50/70 hover:bg-rose-100/70 rounded-xl text-sm font-bold transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <Percent className="w-4.5 h-4.5 text-[#800020]" />
                    <span>Special Sale & Offers</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#800020]" />
                </Link>

                {/* Collections */}
                <Link
                  href="/collections"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 text-neutral-800 hover:bg-neutral-50 rounded-xl text-sm font-semibold transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <Layers className="w-4.5 h-4.5 text-[#800020]" />
                    <span>Trending Collections</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Link>

              </div>

              {/* Divider Line */}
              <div className="my-2 border-t border-neutral-100" />

              {/* Customer Account & Support List */}
              <div className="p-3 space-y-1">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3.5 px-4 py-2.5 text-neutral-800 hover:bg-neutral-50 rounded-xl text-sm font-semibold"
                >
                  <User className="w-4 h-4 text-neutral-500" />
                  <span>My Account</span>
                </Link>

                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3.5 px-4 py-2.5 text-neutral-800 hover:bg-neutral-50 rounded-xl text-sm font-semibold"
                >
                  <Package className="w-4 h-4 text-neutral-500" />
                  <span>Orders</span>
                </Link>

                <Link
                  href="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 text-neutral-800 hover:bg-neutral-50 rounded-xl text-sm font-semibold"
                >
                  <div className="flex items-center gap-3.5">
                    <Heart className="w-4 h-4 text-neutral-500" />
                    <span>Wishlist</span>
                  </div>
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {wishlistCount}
                  </span>
                </Link>

                <Link
                  href="/profile/addresses"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3.5 px-4 py-2.5 text-neutral-800 hover:bg-neutral-50 rounded-xl text-sm font-semibold"
                >
                  <MapPin className="w-4 h-4 text-neutral-500" />
                  <span>Address Book</span>
                </Link>

                <Link
                  href="/track-order"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3.5 px-4 py-2.5 text-neutral-800 hover:bg-neutral-50 rounded-xl text-sm font-semibold"
                >
                  <Truck className="w-4 h-4 text-neutral-500" />
                  <span>Track Order</span>
                </Link>

                <Link
                  href="/faqs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3.5 px-4 py-2.5 text-neutral-800 hover:bg-neutral-50 rounded-xl text-sm font-semibold"
                >
                  <Headphones className="w-4 h-4 text-neutral-500" />
                  <span>Help Center</span>
                </Link>

                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3.5 px-4 py-2.5 text-neutral-800 hover:bg-neutral-50 rounded-xl text-sm font-semibold"
                >
                  <Phone className="w-4 h-4 text-neutral-500" />
                  <span>Contact Us</span>
                </Link>
              </div>

            </div>

            {/* Bottom Promo Card Box (Matching Mobile Drawer Screenshot) */}
            <div className="p-4">
              <div className="bg-[#FAF0F2] border border-rose-100 rounded-2xl p-4 text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-[#800020] text-white flex items-center justify-center mx-auto">
                  <Percent className="w-4 h-4" />
                </div>
                <h4 className="text-base font-bold text-neutral-900 leading-tight">
                  Get 10% OFF
                </h4>
                <p className="text-xs text-neutral-500">
                  On your first order
                </p>
                <button className="w-full bg-[#800020] hover:bg-[#600018] text-white text-xs font-bold py-2.5 px-4 rounded-xl tracking-wide shadow-xs transition-colors">
                  JOIN NOW
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <Link href="/" className="flex flex-col items-center gap-0.5 text-neutral-700 hover:text-[#800020]">
          <Home className="w-5 h-5 text-[#800020]" />
          <span className="text-[10px] font-bold text-[#800020]">Home</span>
        </Link>

        <Link href="/categories" className="flex flex-col items-center gap-0.5 text-neutral-600 hover:text-[#800020]">
          <Layers className="w-5 h-5" />
          <span className="text-[10px] font-medium">Categories</span>
        </Link>

        <Link href="/wishlist" className="flex flex-col items-center gap-0.5 text-neutral-600 hover:text-[#800020] relative">
          <Heart className="w-5 h-5" />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#800020] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {wishlistCount}
            </span>
          )}
          <span className="text-[10px] font-medium">Wishlist</span>
        </Link>

        <Link href="/cart" className="flex flex-col items-center gap-0.5 text-neutral-600 hover:text-[#800020] relative">
          <ShoppingBag className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#800020] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
          <span className="text-[10px] font-medium">Cart</span>
        </Link>

        <Link href="/profile" className="flex flex-col items-center gap-0.5 text-neutral-600 hover:text-[#800020]">
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Account</span>
        </Link>
      </div>
    </header>
  );
}
