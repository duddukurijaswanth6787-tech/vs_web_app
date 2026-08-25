'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  ChevronDown,
  Menu,
  X,
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

import { useFeaturedCategories, useCustomerCart, useCustomerWishlist, usePublicSettings, useHomepage } from '@/features/customer/hooks';

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

  const typedCart = cartData as { items?: unknown[]; itemCount?: number } | undefined;
  const cartCount = typedCart?.items?.length ?? typedCart?.itemCount ?? 0;

  const typedWishlist = wishlistData as { items?: unknown[]; data?: unknown[]; length?: number } | undefined;
  const wishlistCount = Array.isArray(wishlistData)
    ? wishlistData.length
    : typedWishlist?.data?.length ?? typedWishlist?.items?.length ?? typedWishlist?.length ?? 0;

  const { data: settings } = usePublicSettings();
  const typedSettings = settings as Record<string, unknown> | undefined;
  const isBarEnabledSetting =
    (typedSettings?.announcementBarEnabled as boolean | undefined) ??
    (typedSettings?.announcement_bar_enabled === 'true' || typedSettings?.announcement_bar_enabled === true) ??
    true;
  const mobileAnnouncementEnabled =
    (typedSettings?.announcementBarMobileEnabled as boolean | undefined) ??
    (typedSettings?.announcement_bar_mobile_enabled === 'true' || typedSettings?.announcement_bar_mobile_enabled === true) ??
    true;
  const announcementText =
    (typedSettings?.announcementBarText as string | undefined) ||
    (typedSettings?.announcement_bar_text as string | undefined) ||
    'Festive Sale is Live! Get up to 30% OFF';
  const announcementLink =
    (typedSettings?.announcementBarLink as string | undefined) ||
    (typedSettings?.announcement_bar_link as string | undefined) ||
    '/offers';
  const announcementLinkText =
    (typedSettings?.announcementBarLinkText as string | undefined) ||
    (typedSettings?.announcement_bar_link_text as string | undefined) ||
    'Shop Now →';
  const announcementBgColor =
    (typedSettings?.announcementBarBgColor as string | undefined) ||
    (typedSettings?.announcement_bar_bg_color as string | undefined) ||
    '#0284c7';
  const announcementTextColor =
    (typedSettings?.announcementBarTextColor as string | undefined) ||
    (typedSettings?.announcement_bar_text_color as string | undefined) ||
    '#FFFFFF';

  const { data: homepageData } = useHomepage();
  const announcementBarEnabled =
    isBarEnabledSetting &&
    (!homepageData ||
      !Array.isArray(homepageData.sections) ||
      homepageData.sections.length === 0 ||
      homepageData.sections.some((s) => (s as Record<string, unknown>).key === 'announcement_bar'));
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 shadow-xs">
      {/* 01 TOP ANNOUNCEMENT BAR */}
      {announcementBarEnabled && (
        <div
          style={{ backgroundColor: announcementBgColor, color: announcementTextColor }}
          className={
            mobileAnnouncementEnabled
              ? "py-1.5 px-3 text-center text-[10px] sm:text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5"
              : "hidden sm:flex py-1.5 px-3 text-center text-xs font-semibold tracking-wide items-center justify-center gap-2"
          }
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
          <span className="truncate">{announcementText}</span>
          {announcementLink && announcementLinkText && (
            <Link href={announcementLink} className="underline font-bold text-amber-300 hover:text-amber-200 shrink-0 ml-0.5">
              {announcementLinkText}
            </Link>
          )}
        </div>
      )}

      {/* Top Header Row */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-8 lg:px-12 py-1 sm:py-3.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">

          {/* Left: Mobile Menu Trigger & Desktop Logo */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 shrink-0 lg:flex-none">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1 text-neutral-800 hover:bg-neutral-100 rounded-lg shrink-0"
              aria-label="Open Menu"
            >
              <Menu className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
            </button>

            <Link href="/" className="hidden lg:flex items-center shrink-0">
              <Image
                src="/brand/logo-full.png"
                alt="Vasanthi's Signature"
                width={1400}
                height={803}
                priority
                className="h-12 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Mobile: logo in normal flow, centered between the menu button and the icons --
              a tall wide lockup like this needs the row to actually grow to fit it, which
              absolute-positioning it over just the (much shorter) icon row didn't allow,
              leaving it cramped with almost no breathing room above/below. */}
          <Link href="/" className="lg:hidden flex items-center justify-center">
            <Image
              src="/brand/logo-full.png"
              alt="Vasanthi's Signature"
              width={1400}
              height={803}
              priority
              className="w-[105px] sm:w-[190px] h-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-neutral-700">
            <Link href="/" className="hover:text-[#0284c7] transition-colors font-bold text-[#0284c7] whitespace-nowrap">
              Home
            </Link>
            {navCategories && navCategories.length > 0 ? (
              navCategories.slice(0, 6).map((cat: { id?: string; slug?: string; name?: string }) => (
                <Link
                  key={cat.id || cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="hover:text-[#0284c7] transition-colors whitespace-nowrap font-medium text-neutral-700"
                >
                  {cat.name}
                </Link>
              ))
            ) : (
              <>
                <Link href="/categories/new-arrivals" className="hover:text-[#0284c7] transition-colors whitespace-nowrap">
                  New Arrivals
                </Link>
                <Link href="/categories/collections" className="hover:text-[#0284c7] transition-colors whitespace-nowrap">
                  Collections
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-3 flex-1 shrink-0 lg:flex-none">
            <div className="hidden lg:block relative w-56 xl:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                id="desktop-search-input"
                type="text"
                aria-label="Search for sarees, kurtis, lehengas"
                placeholder="Search for sarees, kurtis, lehengas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }}
                className="w-full bg-neutral-50 border border-neutral-200/80 rounded-full py-2 pl-9 pr-3 text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]/20 placeholder:text-neutral-400"
              />
            </div>
            <Link href="/wishlist" className="relative p-1.5 text-neutral-800 hover:text-[#0284c7] transition-colors shrink-0" aria-label="Wishlist">
              <Heart className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-[#0284c7] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border border-white">
                {wishlistCount}
              </span>
            </Link>

            <Link href="/cart" className="relative p-1.5 text-neutral-800 hover:text-[#0284c7] transition-colors shrink-0" aria-label="Cart">
              <ShoppingBag className="w-5.5 h-5.5 sm:w-6 sm:h-6" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 bg-[#0284c7] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border border-white">
                {cartCount}
              </span>
            </Link>

            <Link href="/profile" className="hidden sm:block p-1.5 text-neutral-800 hover:text-[#0284c7] transition-colors shrink-0">
              <User className="w-6 h-6" />
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div className="mt-1.5 relative w-full lg:hidden">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            id="mobile-search-input"
            type="text"
            aria-label="Search products on mobile"
            placeholder="Search for sarees, kurtis, lehengas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }}
            className="w-full bg-neutral-50 border border-neutral-200/80 rounded-full py-2 pl-10 pr-4 text-xs text-neutral-900 focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]/20 placeholder:text-neutral-400"
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
              <div className="p-4 flex items-center justify-between border-b border-neutral-100 bg-[#EAF4FF]">
                <div className="flex items-center gap-2.5">
                  <Image
                    src="/brand/logo-full.png"
                    alt="Vasanthi's Signature"
                    width={1400}
                    height={803}
                    className="h-10 w-auto object-contain"
                  />
                  <span className="text-[10px] font-semibold text-rose-800 uppercase tracking-widest">
                    Women&apos;s Boutique
                  </span>
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
                  className="flex items-center gap-3.5 px-4 py-3 rounded-xl bg-[#F3F8FF] text-[#0284c7] font-bold text-sm"
                >
                  <Home className="w-4.5 h-4.5 fill-[#0284c7]" />
                  <span>Home</span>
                </Link>

                {/* Dynamic Database Categories */}
                {navCategories && navCategories.length > 0 ? (
                  navCategories.map((cat: { id?: string; slug?: string; name?: string }) => (
                    <Link
                      key={cat.id || cat.slug}
                      href={`/categories/${cat.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-3 text-neutral-800 hover:bg-neutral-50 rounded-xl text-sm font-semibold transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <Shirt className="w-4.5 h-4.5 text-[#0284c7]" />
                        <span>{cat.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </Link>
                  ))
                ) : (
                  <Link
                    href="/categories"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 text-neutral-600 hover:bg-neutral-50 rounded-xl text-sm font-medium transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <Tag className="w-4.5 h-4.5 text-[#0284c7]" />
                      <span>All Categories</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </Link>
                )}

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
              <div className="bg-[#EAF4FF] border border-[#DCEBFA] rounded-2xl p-4 text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-[#1769D2] text-white flex items-center justify-center mx-auto">
                  <Percent className="w-4 h-4" />
                </div>
                <h4 className="text-base font-bold text-neutral-900 leading-tight">
                  Get 10% OFF
                </h4>
                <p className="text-xs text-neutral-500">
                  On your first order
                </p>
                <button className="w-full bg-[#1769D2] hover:bg-[#0B3B78] text-white text-xs font-bold py-2.5 px-4 rounded-xl tracking-wide shadow-xs transition-colors">
                  JOIN NOW
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </header>
  );
}
