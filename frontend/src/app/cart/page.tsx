'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Trash2,
  Truck,
  ShieldCheck,
  Plus,
  Minus,
  ShoppingBag,
  Tag,
  Lock,
  RotateCcw,
  Gift,
  Heart,
  X,
  ChevronRight,
} from 'lucide-react';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { MobilePageContainer } from '@/components/layout/MobilePageContainer';
import {
  useCustomerCart,
  useCartMutations,
  useWishlistMutations,
  useFeatureEnabled,
} from '@/features/customer/hooks';
import { formatInr, PLACEHOLDER_IMAGE } from '@/features/customer/mappers';
import { getApiErrorMessage } from '@/utils/api-error';
import { withVariant, resolveMediaUrl } from '@/lib/media-url';
import { customerCheckoutService } from '@/features/customer/checkout.service';
import type { CartItemDto } from '@/features/customer/cart.service';

const COUPON_STORAGE_KEY = 'vd_coupon_code';

export default function CartPage() {
  const returnsEnabled = useFeatureEnabled('returns');
  const router = useRouter();
  const { data: cart, isLoading, error, refetch } = useCustomerCart();
  const { updateQuantity, removeItem } = useCartMutations();
  const { add: addToWishlist } = useWishlistMutations();

  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discountAmount: number } | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(COUPON_STORAGE_KEY);
    return stored ? { code: stored, discountAmount: 0 } : null;
  });
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const items = useMemo(
    () => (cart?.items || []).filter((i) => !i.savedForLater),
    [cart],
  );

  const subtotal = cart?.subtotal ?? items.reduce((s, i) => s + Number(i.totalPrice || 0), 0);
  const savings = Number(cart?.totalSavings) || 0;
  const freeShippingThreshold = 999;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const couponItems = useMemo(
    () => items.map((i) => ({ productId: i.productId, price: Number(i.unitPrice), quantity: i.quantity })),
    [items],
  );

  useEffect(() => {
    if (!couponApplied || !subtotal) return;
    let cancelled = false;
    customerCheckoutService
      .validateCoupon(couponApplied.code, subtotal, couponItems)
      .then((result) => {
        if (!cancelled) setCouponApplied({ code: result.code, discountAmount: Number(result.discountAmount) });
      })
      .catch(() => {
        if (!cancelled) {
          setCouponApplied(null);
          if (typeof window !== 'undefined') localStorage.removeItem(COUPON_STORAGE_KEY);
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponApplied?.code, subtotal]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim();
    if (!code) return;
    setCouponError('');
    setApplyingCoupon(true);
    try {
      const result = await customerCheckoutService.validateCoupon(code, subtotal, couponItems);
      setCouponApplied({ code: result.code, discountAmount: Number(result.discountAmount) });
      if (typeof window !== 'undefined') localStorage.setItem(COUPON_STORAGE_KEY, result.code);
    } catch (err) {
      setCouponApplied(null);
      if (typeof window !== 'undefined') localStorage.removeItem(COUPON_STORAGE_KEY);
      setCouponError(getApiErrorMessage(err, 'Invalid coupon code'));
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponCode('');
    setCouponError('');
    if (typeof window !== 'undefined') localStorage.removeItem(COUPON_STORAGE_KEY);
  };

  const handleSaveForLater = async (item: CartItemDto) => {
    try {
      await addToWishlist.mutateAsync(item.productId);
      await removeItem.mutateAsync(item.id);
    } catch {
      await removeItem.mutateAsync(item.id);
    }
  };

  return (
    <MobilePageContainer>
      {/* 1. Storefront Header */}
      <StorefrontHeader />

      {/* 2. Main Cart Content */}
      <main className="flex-1 max-w-[1360px] mx-auto w-full px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Page Title & Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold font-serif text-[var(--brand-primary)] tracking-tight">
              My Cart ({items.length})
            </h1>
            <nav className="flex items-center gap-1 text-[11px] sm:text-xs text-neutral-500 mt-0.5">
              <Link href="/" className="hover:text-[var(--brand-primary)] transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3 h-3 text-neutral-400" />
              <span className="font-semibold text-neutral-800">Cart</span>
            </nav>
          </div>
        </div>

        {/* Mobile Top Trust Banner (3 Pillars Pill Row) */}
        <div className="grid grid-cols-3 gap-2 bg-sky-50/60 border border-sky-100/80 rounded-2xl p-2.5 text-center text-[10px] font-semibold text-neutral-700 shadow-2xs">
          <div className="flex flex-col items-center justify-center gap-1">
            <ShieldCheck className="w-4 h-4 text-[var(--brand-primary)]" />
            <div>
              <p className="font-bold text-[var(--brand-primary)]">Secure Checkout</p>
              <p className="text-[9px] text-neutral-400 font-medium hidden sm:block">100% Safe & Secure</p>
            </div>
          </div>
          {returnsEnabled && (
          <div className="flex flex-col items-center justify-center gap-1 border-x border-sky-200/50 px-1">
            <RotateCcw className="w-4 h-4 text-[var(--brand-primary)]" />
            <div>
              <p className="font-bold text-[var(--brand-primary)]">Easy Returns</p>
              <p className="text-[9px] text-neutral-400 font-medium hidden sm:block">7 Days Return</p>
            </div>
          </div>
          )}
          <div className="flex flex-col items-center justify-center gap-1">
            <Gift className="w-4 h-4 text-[var(--brand-primary)]" />
            <div>
              <p className="font-bold text-[var(--brand-primary)]">COD Available</p>
              <p className="text-[9px] text-neutral-400 font-medium hidden sm:block">Pay on Delivery</p>
            </div>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-12 text-center shadow-xs">
            <div className="w-8 h-8 border-3 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-neutral-600">Loading your cart…</p>
          </div>
        )}

        {error && (
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-xs text-sky-800 flex items-center justify-between shadow-xs">
            <span>{getApiErrorMessage(error, 'Failed to load cart')}</span>
            <button
              onClick={() => refetch()}
              className="bg-[var(--brand-primary)] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-[var(--brand-primary-dark)]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && items.length === 0 && (
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-10 text-center space-y-4 shadow-xs max-w-md mx-auto my-6">
            <div className="w-14 h-14 bg-sky-50 text-[var(--brand-primary)] rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold font-serif text-neutral-900">Your Cart is Empty</h2>
            <p className="text-xs text-neutral-500">
              Explore our luxury collections and add your favorite pieces to the bag!
            </p>
            <Link
              href="/"
              className="inline-block bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-2xs"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {/* Cart Active Items Grid */}
        {!isLoading && items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
            {/* LEFT COLUMN: Items List & Coupons */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-6">
              <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-2xs overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 bg-neutral-50/80 border-b border-neutral-100 text-[11px] font-bold tracking-wider text-neutral-500 uppercase">
                  <div className="col-span-6">PRODUCT</div>
                  <div className="col-span-2 text-center">PRICE</div>
                  <div className="col-span-2 text-center">QUANTITY</div>
                  <div className="col-span-2 text-right">TOTAL</div>
                </div>

                <div className="divide-y divide-neutral-100">
                  {items.map((item) => {
                    const rawImage = item.imageUrl || item.product?.primaryImageUrl || item.product?.images?.[0]?.url;
                    const imageSrc = resolveMediaUrl(rawImage) || PLACEHOLDER_IMAGE;
                    const itemUnitPrice = Number(item.unitPrice || 0);
                    const itemTotalPrice = Number(item.totalPrice || itemUnitPrice * item.quantity);

                    return (
                      <div key={item.id} className="p-3.5 sm:p-6 transition-colors relative">
                        <button
                          type="button"
                          onClick={() => removeItem.mutate(item.id)}
                          className="absolute top-3 right-3 text-neutral-400 hover:text-red-600 p-1"
                          title="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4 items-center">
                          <div className="md:col-span-6 flex gap-3 sm:gap-4 items-start sm:items-center pr-6 md:pr-0">
                            <Link href={`/product/${item.productId}`} className="shrink-0 relative">
                              <Image
                                src={withVariant(imageSrc, 'thumb')}
                                alt={item.productName || 'Product'}
                                width={110}
                                height={130}
                                unoptimized={true}
                                className="w-24 h-28 sm:w-28 sm:h-32 object-cover rounded-2xl border border-neutral-100 shadow-2xs bg-neutral-100"
                              />
                            </Link>

                            <div className="space-y-1 min-w-0 flex-1">
                              <Link
                                href={`/product/${item.productId}`}
                                className="text-xs sm:text-base font-bold text-neutral-900 line-clamp-2 hover:text-[var(--brand-primary)] leading-snug"
                              >
                                {item.productName || 'Product'}
                              </Link>

                              {(item.color || item.size) && (
                                <div className="text-[11px] text-neutral-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                  {item.color && <span>Color: <strong className="text-neutral-700 font-semibold">{item.color}</strong></span>}
                                  {item.color && item.size && <span className="text-neutral-300">|</span>}
                                  {item.size && <span>Size: <strong className="text-neutral-700 font-semibold">{item.size}</strong></span>}
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                <span>In Stock</span>
                              </div>

                              <div className="text-sm font-bold text-[var(--brand-primary)] pt-0.5 md:hidden">
                                {formatInr(itemUnitPrice)}
                              </div>

                              <div className="hidden md:flex items-center gap-4 pt-2">
                                <button
                                  type="button"
                                  onClick={() => handleSaveForLater(item)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-[var(--brand-primary)]"
                                >
                                  <Heart className="w-3.5 h-3.5" />
                                  <span>Save for Later</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeItem.mutate(item.id)}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-red-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Remove</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="hidden md:block md:col-span-2 text-center">
                            <span className="text-sm font-bold text-neutral-900">
                              {formatInr(itemUnitPrice)}
                            </span>
                          </div>

                          <div className="md:col-span-2 flex items-center justify-end md:justify-center">
                            <div className="flex items-center border border-neutral-200/80 rounded-2xl px-2.5 py-1 bg-white shadow-2xs">
                              <button
                                type="button"
                                disabled={updateQuantity.isPending || item.quantity <= 1}
                                onClick={() =>
                                  updateQuantity.mutate({ itemId: item.id, quantity: item.quantity - 1 })
                                }
                                className="w-6 h-6 rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold w-7 text-center text-neutral-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={updateQuantity.isPending}
                                onClick={() =>
                                  updateQuantity.mutate({ itemId: item.id, quantity: item.quantity + 1 })
                                }
                                className="w-6 h-6 rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-100"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="hidden md:flex md:col-span-2 items-center justify-end">
                            <span className="text-base font-bold text-neutral-900">
                              {formatInr(itemTotalPrice)}
                            </span>
                          </div>

                          <div className="col-span-1 flex items-center justify-between border-t border-neutral-100 pt-2.5 mt-1 md:hidden">
                            <button
                              type="button"
                              onClick={() => handleSaveForLater(item)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-[var(--brand-primary)]"
                            >
                              <Heart className="w-3.5 h-3.5 text-neutral-500" />
                              <span>Save for Later</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem.mutate(item.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-sky-600" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coupon & Free Shipping Boxes */}
              <div className="space-y-3">
                <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-[var(--brand-primary)] flex items-center justify-center shrink-0">
                      <Tag className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-neutral-900">Have a coupon code?</span>
                  </div>
                  {couponApplied ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
                      <p className="text-[11px] font-semibold text-emerald-700">
                        ✓ &quot;{couponApplied.code}&quot; applied
                        {couponApplied.discountAmount > 0 && ` — you saved ${formatInr(couponApplied.discountAmount)}`}
                      </p>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-[11px] font-bold text-neutral-500 hover:text-sky-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-800 placeholder-neutral-400 uppercase bg-neutral-50/50 focus:outline-none focus:border-[var(--brand-primary)]"
                      />
                      <button
                        type="submit"
                        disabled={applyingCoupon}
                        className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-2xs disabled:opacity-60"
                      >
                        {applyingCoupon ? 'Checking…' : 'Apply'}
                      </button>
                    </form>
                  )}
                  {couponError && (
                    <p className="text-[11px] font-semibold text-sky-700">{couponError}</p>
                  )}
                </div>

                <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 text-[var(--brand-primary)] flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-neutral-900">
                      {isFreeShipping ? (
                        <span className="text-emerald-700">🎉 You unlocked FREE Shipping!</span>
                      ) : (
                        <>
                          You are <strong className="text-[var(--brand-primary)]">{formatInr(amountToFreeShipping)}</strong> away from FREE Shipping!
                        </>
                      )}
                    </span>
                  </div>

                  <div className="space-y-1 pl-12">
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-sky-600 rounded-full transition-all duration-500"
                        style={{ width: `${freeShippingPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-neutral-400">
                      <span>₹0</span>
                      <span>₹999</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Order Summary Card */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
                <h3 className="text-base sm:text-lg font-bold font-serif text-[var(--brand-primary)] border-b border-neutral-100 pb-3">
                  Order Summary
                </h3>

                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between text-neutral-600">
                    <span>Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                    <span className="font-bold text-neutral-900">{formatInr(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-neutral-600">
                    <span>Shipping</span>
                    <span className="font-bold text-neutral-900">
                      {isFreeShipping ? <span className="text-emerald-700 font-extrabold">FREE</span> : formatInr(700)}
                    </span>
                  </div>

                  {savings > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>You Save</span>
                      <span>- {formatInr(savings)}</span>
                    </div>
                  )}

                  {couponApplied && couponApplied.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Coupon ({couponApplied.code})</span>
                      <span>- {formatInr(couponApplied.discountAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-neutral-900 block">Estimated Total</span>
                    <span className="text-[10px] text-neutral-500 font-medium">(Inclusive of all taxes)</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold font-serif text-[var(--brand-primary)]">
                    {formatInr(Math.max(0, subtotal - (couponApplied?.discountAmount || 0)))}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => router.push('/checkout/address')}
                  className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white text-xs sm:text-sm font-bold tracking-wider uppercase py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4 text-white/80" />
                  <span>Proceed to Checkout</span>
                </button>

                <div className="pt-2 border-t border-neutral-100 grid grid-cols-4 gap-1 text-center text-[9px] sm:text-[10px] font-medium text-neutral-600">
                  <div className="space-y-1">
                    <div className="w-7 h-7 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center mx-auto text-neutral-700">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <span>Secure Payment</span>
                  </div>
                  {returnsEnabled && (
                  <div className="space-y-1">
                    <div className="w-7 h-7 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center mx-auto text-neutral-700">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </div>
                    <span>Easy Returns</span>
                  </div>
                  )}
                  <div className="space-y-1">
                    <div className="w-7 h-7 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center mx-auto text-neutral-700">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <span>7-Day Return</span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-7 h-7 rounded-full bg-neutral-50 border border-neutral-100 flex items-center justify-center mx-auto text-neutral-700">
                      <Gift className="w-3.5 h-3.5" />
                    </div>
                    <span>COD Available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </MobilePageContainer>
  );
}
