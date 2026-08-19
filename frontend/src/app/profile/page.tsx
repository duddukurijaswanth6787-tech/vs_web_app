'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  Package,
  Heart,
  Bell,
  CreditCard,
  Gift,
  LogOut,
  User,
  ShoppingBag,
  Phone,
  Mail,
  Truck,
  Tag,
  Crown,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  HelpCircle,
  MessageCircle,
} from 'lucide-react';
import Image from 'next/image';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ReviewPromptBanner } from '@/components/storefront/ReviewPromptBanner';
import { useAuth } from '@/hooks/useAuth';
import { PLACEHOLDER_IMAGE } from '@/features/customer/mappers';
import {
  useCustomerProfile,
  useCustomerCart,
  useCustomerWishlist,
  useCustomerAddresses,
  useCustomerOrders,
} from '@/features/customer/hooks';
import type { CartDto } from '@/features/customer/cart.service';

function GuestAccountView() {
  const { data: wishlistData } = useCustomerWishlist();
  const wishlistCount = Array.isArray(wishlistData)
    ? wishlistData.length
    : wishlistData?.items?.length ?? 0;
  const { data: cartData } = useCustomerCart();
  const cartCount = (cartData as CartDto | undefined)?.items?.length ?? (cartData as CartDto | undefined)?.itemCount ?? 0;

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link href="/" className="flex items-center">
            <Image src="/brand/logo-full.png" alt="Vasanthi's Signature" width={1400} height={803} className="h-8 w-auto object-contain" />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/wishlist" className="relative p-1 text-neutral-700 hover:text-[#800020]">
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-4 h-4 px-1 bg-[#800020] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border border-white">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link href="/cart" className="relative p-1 text-neutral-700 hover:text-[#800020]">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-4 h-4 px-1 bg-[#800020] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border border-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-5 flex-1 space-y-5">
        {/* 1. Hero Welcome Banner */}
        <div className="bg-gradient-to-br from-rose-100/70 via-pink-50/60 to-amber-50/40 border border-rose-100/90 rounded-3xl p-5 relative overflow-hidden shadow-xs">
          <div className="relative z-10 pr-24 sm:pr-32 space-y-1">
            <p className="text-xs font-bold text-neutral-800 tracking-wide">Welcome to</p>
            <h2 className="text-2xl font-bold font-serif text-[#800020] tracking-tight leading-tight">
              Vasanthi&apos;s Signature
            </h2>
            <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
              Sign in to access the best shopping experience
            </p>
          </div>

          {/* Decorative Model Image */}
          <div className="absolute right-0 top-0 bottom-0 w-28 sm:w-36 pointer-events-none">
            <Image
              src={PLACEHOLDER_IMAGE}
              alt="Vasanthi Model"
              fill
              sizes="144px"
              className="object-cover object-top"
              style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 50%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 50%)' }}
            />
          </div>

          {/* 2x2 Benefits Grid */}
          <div className="grid grid-cols-2 gap-2.5 mt-5 relative z-10">
            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-2.5 flex items-center gap-2 border border-white/60 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-[#800020] shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-neutral-900 leading-tight truncate">Track Orders</p>
                <p className="text-[9px] text-neutral-500 truncate">Real-time status</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-2.5 flex items-center gap-2 border border-white/60 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-[#800020] shrink-0">
                <Heart className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-neutral-900 leading-tight truncate">Wishlist</p>
                <p className="text-[9px] text-neutral-500 truncate">Save favorite items</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-2.5 flex items-center gap-2 border border-white/60 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-[#800020] shrink-0">
                <Tag className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-neutral-900 leading-tight truncate">Exclusive Offers</p>
                <p className="text-[9px] text-neutral-500 truncate">Special discounts</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-2.5 flex items-center gap-2 border border-white/60 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-[#800020] shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-bold text-neutral-900 leading-tight truncate">Faster Checkout</p>
                <p className="text-[9px] text-neutral-500 truncate">Quick & easy checkout</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Login or Sign Up Card */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-xs space-y-4 text-center">
          <div>
            <h3 className="text-xl font-bold font-serif text-[#800020] tracking-tight">
              Login or Sign Up
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Please login or sign up to continue
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            <Link
              href="/login?mode=phone"
              className="w-full bg-[#800020] hover:bg-[#600018] text-white font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2.5 shadow-sm text-sm transition-all active:scale-[0.98]"
            >
              <Phone className="w-4 h-4" />
              <span>Continue with Mobile Number</span>
            </Link>

            <Link
              href="/login?mode=email"
              className="w-full bg-white border border-[#800020] text-[#800020] hover:bg-rose-50/50 font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2.5 text-sm transition-all active:scale-[0.98]"
            >
              <Mail className="w-4 h-4" />
              <span>Continue with Email</span>
            </Link>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="h-[1px] bg-neutral-200 flex-1" />
            <span className="text-xs text-neutral-400 font-medium">or</span>
            <div className="h-[1px] bg-neutral-200 flex-1" />
          </div>

          {/* Social Icons Row */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => window.location.href = '/login?mode=google'}
              className="w-12 h-12 rounded-full border border-neutral-200 bg-white flex items-center justify-center shadow-2xs hover:bg-neutral-50 active:scale-95 transition-all"
              aria-label="Continue with Google"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </button>

            <button
              onClick={() => window.location.href = '/login?mode=facebook'}
              className="w-12 h-12 rounded-full border border-neutral-200 bg-white flex items-center justify-center shadow-2xs hover:bg-neutral-50 active:scale-95 transition-all"
              aria-label="Continue with Facebook"
            >
              <svg className="w-6 h-6 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>

            <button
              onClick={() => window.location.href = '/login?mode=apple'}
              className="w-12 h-12 rounded-full border border-neutral-200 bg-white flex items-center justify-center shadow-2xs hover:bg-neutral-50 active:scale-95 transition-all"
              aria-label="Continue with Apple"
            >
              <svg className="w-5 h-5 fill-neutral-900" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.82c.62-.75 1.04-1.8 .93-2.85-.9.04-2 .6-2.64 1.34-.58.67-1.09 1.74-.95 2.78 1.01.08 2.04-.52 2.66-1.27z"/>
              </svg>
            </button>
          </div>

          <p className="text-[11px] text-neutral-500 pt-2 leading-relaxed">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="font-bold text-[#800020] hover:underline">
              Terms & Conditions
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-bold text-[#800020] hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}

function AuthenticatedAccountView() {
  const { logout, user } = useAuth();
  const { data: profile } = useCustomerProfile();
  const { data: wishlistData } = useCustomerWishlist();
  const { data: cartData } = useCustomerCart();
  const { data: addressesData } = useCustomerAddresses();
  const { data: ordersData } = useCustomerOrders();

  const profRec = (profile || {}) as Record<string, unknown>;
  const userRec = (user || {}) as Record<string, unknown>;
  const name =
    profile?.firstName || user?.firstName
      ? `${profile?.firstName || user?.firstName || ''} ${profile?.lastName || user?.lastName || ''}`.trim()
      : profile?.email?.split('@')[0] || user?.email?.split('@')[0] || String(userRec.phone || '') || 'Customer';
  const email = profile?.email || user?.email || '';
  const rawPhone = String(profRec.phone || userRec.phone || '');
  const phone = rawPhone ? (rawPhone.startsWith('+') ? rawPhone : `+91 ${rawPhone}`) : '';
  const points = Number(profRec.loyaltyPoints ?? userRec.loyaltyPoints ?? 0);
  const tier = String(profRec.tier || userRec.tier || 'Member');
  const avatarUrl = profile?.avatarUrl || String(userRec.avatarUrl || '') || PLACEHOLDER_IMAGE;

  const wishlistRec = (wishlistData || {}) as Record<string, unknown>;
  const wishlistCount = Array.isArray(wishlistData)
    ? wishlistData.length
    : Array.isArray(wishlistRec.items)
      ? (wishlistRec.items as unknown[]).length
      : Array.isArray(wishlistRec.data)
        ? (wishlistRec.data as unknown[]).length
        : 0;

  const cartRec = (cartData || {}) as Record<string, unknown>;
  const cartCount = Array.isArray(cartRec.items)
    ? (cartRec.items as unknown[]).length
    : Number(cartRec.itemCount ?? 0);

  const addressRec = (addressesData || {}) as Record<string, unknown>;
  const addressesCount = Array.isArray(addressesData)
    ? addressesData.length
    : Array.isArray(addressRec.items)
      ? (addressRec.items as unknown[]).length
      : Array.isArray(addressRec.data)
        ? (addressRec.data as unknown[]).length
        : 0;

  const ordersList = useMemo(() => {
    if (!ordersData) return [];
    if (Array.isArray(ordersData)) return ordersData;
    const typed = ordersData as { orders?: unknown[]; data?: unknown[]; items?: unknown[] };
    if (Array.isArray(typed?.orders)) return typed.orders as never[];
    if (Array.isArray(typed?.data)) return typed.data as never[];
    if (Array.isArray(typed?.items)) return typed.items as never[];
    return [];
  }, [ordersData]);

  const totalOrdersCount = ordersList.length;

  // Order status counts breakdown
  const orderCounts = useMemo(() => {
    let pending = 0;
    let confirmed = 0;
    let shipped = 0;
    let delivered = 0;
    let returns = 0;

    ordersList.forEach((oItem) => {
      const o = oItem as Record<string, unknown>;
      const st = String(o.status || '').toUpperCase();
      if (st.includes('PENDING')) pending++;
      else if (st.includes('CONFIRM') || st.includes('PROCESS')) confirmed++;
      else if (st.includes('SHIP') || st.includes('OUT_FOR_DELIVERY')) shipped++;
      else if (st.includes('DELIVER') || st.includes('COMPLETE')) delivered++;
      else if (st.includes('RETURN') || st.includes('REFUND')) returns++;
    });

    return { pending, confirmed, shipped, delivered, returns };
  }, [ordersList]);

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link href="/" className="flex items-center">
            <Image src="/brand/logo-full.png" alt="Vasanthi's Signature" width={1400} height={803} className="h-8 w-auto object-contain" />
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/wishlist" className="relative p-1 text-neutral-700 hover:text-[#800020]">
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-4 h-4 px-1 bg-[#800020] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border border-white">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link href="/cart" className="relative p-1 text-neutral-700 hover:text-[#800020]">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-4 h-4 px-1 bg-[#800020] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center border border-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-5 flex-1 space-y-4">
        {/* Pending Review Prompt Banner */}
        <ReviewPromptBanner />

        {/* 1. Royal Maroon Customer Card */}
        <div className="bg-gradient-to-br from-[#600018] via-[#800020] to-[#990026] text-white rounded-3xl p-5 shadow-lg relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between gap-3">
            {/* User Profile Summary */}
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-amber-300/80 shadow-md shrink-0">
                <Image src={avatarUrl} alt={name} width={56} height={56} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold font-serif flex items-center gap-1.5">
                  <span>Hi, {name.split(' ')[0]}</span>
                  <span className="text-base">👋</span>
                </h2>
                <p className="text-[11px] text-rose-100 opacity-90 truncate max-w-[150px]">{email}</p>
                <p className="text-[11px] text-rose-100 opacity-90">{phone}</p>
                <div className="pt-1">
                  <Link
                    href="/profile/edit"
                    className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white/15 hover:bg-white/25 text-white px-2.5 py-1 rounded-full border border-white/20 backdrop-blur-xs transition-colors"
                  >
                    <span>View Profile</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Loyalty Points Section */}
            <div className="text-right border-l border-white/20 pl-4 shrink-0 space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-wider text-rose-200">Loyalty Points</p>
              <div className="flex items-center justify-end gap-1.5 text-amber-300">
                <Crown className="w-5 h-5 fill-amber-300" />
                <span className="text-xl font-extrabold font-serif">{points.toLocaleString()}</span>
              </div>
              <div className="inline-flex items-center gap-1 text-[10px] text-amber-200 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-300/30">
                <ShieldCheck className="w-3 h-3" />
                <span>{tier}</span>
              </div>
            </div>
          </div>

          {/* Quick Stat Bar (Orders, Wishlist, Coupons, Addresses) */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/15 text-center">
            <Link href="/orders" className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity">
              <Package className="w-4 h-4 text-rose-200" />
              <span className="text-[10px] text-rose-200">Orders</span>
              <span className="text-xs font-extrabold text-white">{totalOrdersCount}</span>
            </Link>

            <Link href="/wishlist" className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity">
              <Heart className="w-4 h-4 text-rose-200" />
              <span className="text-[10px] text-rose-200">Wishlist</span>
              <span className="text-xs font-extrabold text-white">{wishlistCount}</span>
            </Link>

            <Link href="/offers" className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity">
              <Tag className="w-4 h-4 text-rose-200" />
              <span className="text-[10px] text-rose-200">Coupons</span>
              <span className="text-xs font-extrabold text-white">5</span>
            </Link>

            <Link href="/profile/addresses" className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity">
              <MapPin className="w-4 h-4 text-rose-200" />
              <span className="text-[10px] text-rose-200">Addresses</span>
              <span className="text-xs font-extrabold text-white">{addressesCount}</span>
            </Link>
          </div>
        </div>

        {/* 2. My Orders Status Tracker Card */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">My Orders</h3>
            <Link href="/orders" className="text-xs font-bold text-[#800020] hover:underline flex items-center gap-0.5">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-5 gap-1 text-center pt-1">
            <Link href="/orders?status=PENDING" className="flex flex-col items-center gap-1 group">
              <div className="w-9 h-9 rounded-2xl bg-neutral-50 group-hover:bg-rose-50 flex items-center justify-center text-neutral-700 transition-colors">
                <Clock className="w-4 h-4 text-[#800020]" />
              </div>
              <span className="text-[10px] font-medium text-neutral-600">Pending</span>
              <span className="text-xs font-extrabold text-[#800020]">{orderCounts.pending}</span>
            </Link>

            <Link href="/orders?status=CONFIRMED" className="flex flex-col items-center gap-1 group">
              <div className="w-9 h-9 rounded-2xl bg-neutral-50 group-hover:bg-rose-50 flex items-center justify-center text-neutral-700 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-[#800020]" />
              </div>
              <span className="text-[10px] font-medium text-neutral-600">Confirmed</span>
              <span className="text-xs font-extrabold text-[#800020]">{orderCounts.confirmed}</span>
            </Link>

            <Link href="/orders?status=SHIPPED" className="flex flex-col items-center gap-1 group">
              <div className="w-9 h-9 rounded-2xl bg-neutral-50 group-hover:bg-rose-50 flex items-center justify-center text-neutral-700 transition-colors">
                <Truck className="w-4 h-4 text-[#800020]" />
              </div>
              <span className="text-[10px] font-medium text-neutral-600">Shipped</span>
              <span className="text-xs font-extrabold text-[#800020]">{orderCounts.shipped}</span>
            </Link>

            <Link href="/orders?status=DELIVERED" className="flex flex-col items-center gap-1 group">
              <div className="w-9 h-9 rounded-2xl bg-neutral-50 group-hover:bg-rose-50 flex items-center justify-center text-neutral-700 transition-colors">
                <Package className="w-4 h-4 text-[#800020]" />
              </div>
              <span className="text-[10px] font-medium text-neutral-600">Delivered</span>
              <span className="text-xs font-extrabold text-[#800020]">{orderCounts.delivered}</span>
            </Link>

            <Link href="/returns" className="flex flex-col items-center gap-1 group">
              <div className="w-9 h-9 rounded-2xl bg-neutral-50 group-hover:bg-rose-50 flex items-center justify-center text-neutral-700 transition-colors">
                <RotateCcw className="w-4 h-4 text-[#800020]" />
              </div>
              <span className="text-[10px] font-medium text-neutral-600">Returns</span>
              <span className="text-xs font-extrabold text-[#800020]">{orderCounts.returns}</span>
            </Link>
          </div>
        </div>

        {/* 3. Account Settings Menu Group */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl overflow-hidden shadow-xs">
          <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/50">
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">Account Settings</h3>
          </div>
          <div className="divide-y divide-neutral-100">
            <Link href="/profile/edit" className="flex items-center justify-between px-4 py-3.5 hover:bg-rose-50/30 transition-colors">
              <span className="flex items-center gap-3 text-xs font-semibold text-neutral-800">
                <User className="w-4 h-4 text-[#800020]" />
                <span>My Profile</span>
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </Link>

            <Link href="/profile/addresses" className="flex items-center justify-between px-4 py-3.5 hover:bg-rose-50/30 transition-colors">
              <span className="flex items-center gap-3 text-xs font-semibold text-neutral-800">
                <MapPin className="w-4 h-4 text-[#800020]" />
                <span>Address Book</span>
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </Link>

            <Link href="/profile/payments" className="flex items-center justify-between px-4 py-3.5 hover:bg-rose-50/30 transition-colors">
              <span className="flex items-center gap-3 text-xs font-semibold text-neutral-800">
                <CreditCard className="w-4 h-4 text-[#800020]" />
                <span>Payment Methods</span>
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </Link>

            <Link href="/offers" className="flex items-center justify-between px-4 py-3.5 hover:bg-rose-50/30 transition-colors">
              <span className="flex items-center gap-3 text-xs font-semibold text-neutral-800">
                <Tag className="w-4 h-4 text-[#800020]" />
                <span>My Coupons & Offers</span>
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </Link>

            <Link href="/profile/notifications" className="flex items-center justify-between px-4 py-3.5 hover:bg-rose-50/30 transition-colors">
              <span className="flex items-center gap-3 text-xs font-semibold text-neutral-800">
                <Bell className="w-4 h-4 text-[#800020]" />
                <span>Notifications</span>
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </Link>

            <Link href="/privacy" className="flex items-center justify-between px-4 py-3.5 hover:bg-rose-50/30 transition-colors">
              <span className="flex items-center gap-3 text-xs font-semibold text-neutral-800">
                <ShieldCheck className="w-4 h-4 text-[#800020]" />
                <span>Privacy Settings</span>
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </Link>
          </div>
        </div>

        {/* 4. Refer & Earn Banner */}
        <Link href="/profile/referral" className="bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50/60 border border-rose-100/90 rounded-3xl p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
          <div className="space-y-0.5 pr-2">
            <h4 className="text-xs font-bold text-[#800020]">Refer & Earn</h4>
            <p className="text-[10px] text-neutral-600 leading-snug">
              Invite your friends and earn ₹100 off on their first order
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-white/90 shadow-2xs flex items-center justify-center text-rose-600">
              <Gift className="w-5 h-5 text-[#800020]" />
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </div>
        </Link>

        {/* 5. Customer Support Menu Group */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl overflow-hidden shadow-xs">
          <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50/50">
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">Customer Support</h3>
          </div>
          <div className="divide-y divide-neutral-100">
            <Link href="/faqs" className="flex items-center justify-between px-4 py-3.5 hover:bg-rose-50/30 transition-colors">
              <span className="flex items-center gap-3 text-xs font-semibold text-neutral-800">
                <HelpCircle className="w-4 h-4 text-[#800020]" />
                <span>Help Center</span>
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </Link>

            <Link href="/contact" className="flex items-center justify-between px-4 py-3.5 hover:bg-rose-50/30 transition-colors">
              <span className="flex items-center gap-3 text-xs font-semibold text-neutral-800">
                <MessageCircle className="w-4 h-4 text-[#800020]" />
                <span>Contact Us</span>
              </span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </Link>
          </div>
        </div>

        {/* 6. Logout Button */}
        <button
          type="button"
          onClick={() => logout()}
          className="w-full bg-white border border-rose-200 text-[#800020] hover:bg-rose-50/50 font-bold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs shadow-xs active:scale-[0.98] transition-all"
        >
          <LogOut className="w-4 h-4 text-[#800020]" />
          <span>Logout</span>
        </button>
      </main>

      <MobileBottomNav />
    </div>
  );
}

export default function ProfilePage() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (!isInitializing && !isAuthenticated) {
    return <GuestAccountView />;
  }

  return <AuthenticatedAccountView />;
}
