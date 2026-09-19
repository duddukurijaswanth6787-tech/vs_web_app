'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Lock,
  Gift,
  MapPin,
  Truck,
  Clock,
  Plus,
  Check,
  CreditCard,
  Banknote,
  ShieldCheck,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { MobilePageContainer } from '@/components/layout/MobilePageContainer';
import { useAuth } from '@/hooks/useAuth';
import {
  useCheckoutPreview,
  useCustomerAddresses,
  usePlaceOrder,
} from '@/features/customer/hooks';
import { formatInr } from '@/features/customer/mappers';
import { getApiErrorMessage } from '@/utils/api-error';
import { paymentService } from '@/features/payments/payment.service';
import type { OrderPlacePaymentDto } from '@/features/customer/checkout.service';

const DELIVERY_SLOTS = [
  { id: 'MORNING', label: 'Morning (9:00 AM - 1:00 PM)' },
  { id: 'AFTERNOON', label: 'Afternoon (1:00 PM - 6:00 PM)' },
  { id: 'EVENING', label: 'Evening (6:00 PM - 9:00 PM)' },
];

const COUPON_STORAGE_KEY = 'vd_coupon_code';

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addressIdParam = searchParams.get('addressId') || '';
  const { isAuthenticated, isInitializing } = useAuth();
  const { data: addressesData, isLoading: addressesLoading } = useCustomerAddresses(isAuthenticated);
  const placeOrder = usePlaceOrder();

  // Stored coupon
  const [couponCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(COUPON_STORAGE_KEY) || '';
    }
    return '';
  });

  // Selected payment method: 'RAZORPAY' | 'COD'
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY');

  // Selected address state
  const [selectedAddressId, setSelectedAddressId] = useState<string>(addressIdParam);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  // Form states
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [preferredDeliverySlot, setPreferredDeliverySlot] = useState('MORNING');
  const [isGift, setIsGift] = useState(false);
  const [giftWrapMessage, setGiftWrapMessage] = useState('');
  const [notes, setNotes] = useState('');

  // Status & error states
  const [orderError, setOrderError] = useState('');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  const addresses = useMemo(() => {
    if (!addressesData) return [];
    return Array.isArray(addressesData) ? addressesData : (addressesData as any).data || [];
  }, [addressesData]);

  // Sync default address if not set
  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const defaultAddr = addresses.find((a: any) => a.isDefault) || addresses[0];
      if (defaultAddr?.id) {
        setSelectedAddressId(defaultAddr.id);
      }
    }
  }, [addresses, selectedAddressId]);

  const activeAddressId = selectedAddressId || addressIdParam;
  const preview = useCheckoutPreview(activeAddressId || undefined, couponCode || undefined);
  const selectedAddress = addresses.find((a: any) => a.id === activeAddressId);

  if (!isInitializing && !isAuthenticated) {
    router.push('/login?redirect=/checkout');
    return null;
  }

  const openRazorpayModal = (payment: OrderPlacePaymentDto, orderNumber: string) => {
    if (!window.Razorpay) {
      setOrderError('Payment gateway is loading. Please try again in a few seconds.');
      return;
    }

    const rzp = new window.Razorpay({
      key: payment.razorpayKeyId,
      amount: Math.round(payment.amount * 100),
      currency: payment.currency || 'INR',
      order_id: payment.providerOrderId,
      name: "Vasanthi's Signature",
      description: `Order #${orderNumber}`,
      handler: async (response: any) => {
        setIsVerifyingPayment(true);
        setOrderError('');
        try {
          await paymentService.verify(payment.paymentId, {
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          if (typeof window !== 'undefined') localStorage.removeItem(COUPON_STORAGE_KEY);
          router.push(`/checkout/success?orderId=${encodeURIComponent(orderNumber)}`);
        } catch (err: unknown) {
          setOrderError(getApiErrorMessage(err, 'Payment verification failed. Please contact support.'));
          setIsVerifyingPayment(false);
        }
      },
      modal: {
        ondismiss: () => {
          setIsVerifyingPayment(false);
          setOrderError('Payment was cancelled. You can retry paying anytime.');
        },
      },
      theme: {
        color: '#0284c7',
      },
    });

    rzp.open();
  };

  const onPlaceOrder = async () => {
    if (!activeAddressId) {
      setOrderError('Please select or add a delivery address.');
      return;
    }

    setOrderError('');
    try {
      const order = await placeOrder.mutateAsync({
        addressId: activeAddressId,
        paymentMethod,
        couponCode: couponCode || undefined,
        notes: notes || undefined,
        deliveryInstructions: deliveryInstructions || undefined,
        preferredDeliverySlot: preferredDeliverySlot || undefined,
        isGift,
        giftWrapMessage: isGift ? giftWrapMessage || undefined : undefined,
      });

      if (paymentMethod === 'RAZORPAY' && order.payment) {
        openRazorpayModal(order.payment, order.orderNumber);
        return;
      }

      // COD or immediate success
      if (typeof window !== 'undefined') localStorage.removeItem(COUPON_STORAGE_KEY);
      router.push(`/checkout/success?orderId=${encodeURIComponent(order.orderNumber)}`);
    } catch (err: unknown) {
      setOrderError(getApiErrorMessage(err, 'Failed to place order. Please try again.'));
    }
  };

  const isBusy = placeOrder.isPending || isVerifyingPayment;

  return (
    <MobilePageContainer>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/cart" className="p-1 rounded-lg hover:bg-neutral-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-neutral-700" />
          </Link>
          <div>
            <h1 className="text-lg font-bold font-serif text-[var(--brand-primary)]">Checkout</h1>
            <p className="text-[11px] text-neutral-500 font-sans">Review & Complete Order</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <Lock className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit SSL Secure
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-5 text-xs">
        {/* Error Alert */}
        {orderError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-2.5 text-red-700 animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-xs">Order Notification</p>
              <p className="text-xs leading-relaxed">{orderError}</p>
            </div>
          </div>
        )}

        {/* 1. Delivery Address Selection */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
            <h2 className="font-bold text-neutral-900 flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-[var(--brand-primary)]" />
              <span>1. Delivery Address</span>
            </h2>
            <div className="flex items-center gap-2">
              {addresses.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowAddressPicker(!showAddressPicker)}
                  className="text-xs font-semibold text-[var(--brand-primary)] hover:underline cursor-pointer"
                >
                  {showAddressPicker ? 'Done' : 'Change Address'}
                </button>
              )}
              <Link
                href="/checkout/address/edit"
                className="text-xs font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add New
              </Link>
            </div>
          </div>

          {addressesLoading ? (
            <p className="text-neutral-400 py-2 text-center">Loading addresses...</p>
          ) : selectedAddress ? (
            <div className="bg-sky-50/40 p-3.5 rounded-xl border border-sky-100/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-900 text-xs">{selectedAddress.fullName}</span>
                <span className="text-[10px] font-bold bg-[var(--brand-primary)] text-white px-2 py-0.5 rounded-md uppercase">
                  {selectedAddress.label || selectedAddress.addressType || 'Home'}
                </span>
              </div>
              <p className="text-neutral-600 leading-relaxed text-xs">
                {selectedAddress.addressLine1}, {selectedAddress.addressLine2 ? selectedAddress.addressLine2 + ', ' : ''}
                {selectedAddress.city}, {selectedAddress.state} - <span className="font-semibold text-neutral-900">{selectedAddress.postalCode}</span>
              </p>
              <p className="text-neutral-500 font-mono text-[11px]">Phone: {selectedAddress.phone}</p>
            </div>
          ) : (
            <div className="p-4 text-center text-neutral-500 space-y-2">
              <p>No delivery address found.</p>
              <Link
                href="/checkout/address/edit"
                className="inline-flex items-center gap-1 text-[var(--brand-primary)] font-bold text-xs underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Address to Proceed
              </Link>
            </div>
          )}

          {/* Expandable Address Picker */}
          {showAddressPicker && addresses.length > 1 && (
            <div className="pt-2 space-y-2 border-t border-neutral-100">
              <p className="text-[11px] font-semibold text-neutral-500">Select another saved address:</p>
              <div className="grid gap-2">
                {addresses.map((addr: any) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      (selectedAddressId || selectedAddress?.id) === addr.id
                        ? 'border-[var(--brand-primary)] bg-sky-50/60'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="addressSelect"
                      checked={(selectedAddressId || selectedAddress?.id) === addr.id}
                      onChange={() => {
                        setSelectedAddressId(addr.id);
                        setShowAddressPicker(false);
                      }}
                      className="mt-0.5 accent-[var(--brand-primary)]"
                    />
                    <div className="space-y-0.5 text-xs">
                      <span className="font-bold text-neutral-900">{addr.fullName}</span>
                      <p className="text-neutral-600 text-[11px]">
                        {addr.addressLine1}, {addr.city}, {addr.state} - {addr.postalCode}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 2. Delivery Time Slot & Courier Instructions */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200 shadow-2xs space-y-3">
          <h2 className="font-bold text-neutral-900 flex items-center gap-2 text-sm border-b border-neutral-100 pb-2.5">
            <Truck className="w-4 h-4 text-[var(--brand-primary)]" />
            <span>2. Delivery Slot & Courier Notes</span>
          </h2>

          <div className="space-y-1.5">
            <span className="font-semibold text-neutral-700 flex items-center gap-1 text-xs">
              <Clock className="w-3.5 h-3.5 text-neutral-500" /> Preferred Delivery Window
            </span>
            <div className="grid sm:grid-cols-3 gap-1.5">
              {DELIVERY_SLOTS.map((slot) => (
                <label
                  key={slot.id}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all text-xs ${
                    preferredDeliverySlot === slot.id
                      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 font-bold text-neutral-900'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="deliverySlot"
                    checked={preferredDeliverySlot === slot.id}
                    onChange={() => setPreferredDeliverySlot(slot.id)}
                    className="accent-[var(--brand-primary)]"
                  />
                  <span>{slot.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1 pt-1">
            <span className="font-semibold text-neutral-700 block text-xs">Special Delivery Instructions for Driver</span>
            <input
              type="text"
              placeholder="e.g. Call before arrival / Ring door bell / Leave with flat neighbor"
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl outline-none focus:border-[var(--brand-primary)] text-xs"
            />
          </div>
        </section>

        {/* 3. Luxury Gift Wrap Option */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-[var(--brand-primary)]" />
              <div>
                <span className="font-bold text-neutral-900 text-sm block">Complimentary Gift Packaging</span>
                <span className="text-[11px] text-neutral-500">Premium ribbon box with personalized greeting card</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsGift(!isGift)}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                isGift ? 'bg-[var(--brand-primary)]' : 'bg-neutral-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  isGift ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {isGift && (
            <div className="space-y-1.5 pt-2 border-t border-neutral-100 animate-fadeIn">
              <span className="font-semibold text-neutral-700 block text-xs">Gift Message on Card</span>
              <textarea
                rows={2}
                placeholder="Write your wishes here (e.g. Wishing you a blessed anniversary!)..."
                value={giftWrapMessage}
                onChange={(e) => setGiftWrapMessage(e.target.value)}
                className="w-full p-2.5 border border-neutral-200 rounded-xl outline-none focus:border-[var(--brand-primary)] text-xs"
              />
            </div>
          )}
        </section>

        {/* 4. Payment Method Selection */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200 shadow-2xs space-y-3">
          <h2 className="font-bold text-neutral-900 flex items-center gap-2 text-sm border-b border-neutral-100 pb-2.5">
            <CreditCard className="w-4 h-4 text-[var(--brand-primary)]" />
            <span>3. Payment Method</span>
          </h2>

          <div className="space-y-2">
            {/* Razorpay Online Payment */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                paymentMethod === 'RAZORPAY'
                  ? 'border-[var(--brand-primary)] bg-sky-50/50 shadow-2xs'
                  : 'border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === 'RAZORPAY'}
                onChange={() => setPaymentMethod('RAZORPAY')}
                className="mt-1 accent-[var(--brand-primary)]"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                    UPI / QR, Cards, NetBanking, Wallets
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                    Fast & Secure
                  </span>
                </div>
                <p className="text-neutral-500 text-[11px] leading-relaxed">
                  Pay instantly via PhonePe, Google Pay, Paytm, Credit/Debit Card or NetBanking through Razorpay.
                </p>
              </div>
            </label>

            {/* Cash on Delivery */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                paymentMethod === 'COD'
                  ? 'border-[var(--brand-primary)] bg-sky-50/50 shadow-2xs'
                  : 'border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === 'COD'}
                onChange={() => setPaymentMethod('COD')}
                className="mt-1 accent-[var(--brand-primary)]"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-neutral-600" /> Cash on Delivery (COD)
                  </span>
                  <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md">
                    Pay at Doorstep
                  </span>
                </div>
                <p className="text-neutral-500 text-[11px] leading-relaxed">
                  Pay via Cash or UPI to the delivery courier when your order arrives at your address.
                </p>
              </div>
            </label>
          </div>
        </section>

        {/* 5. Pricing & Order Summary */}
        {preview.data ? (
          <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm space-y-3.5">
            <h2 className="font-bold border-b border-neutral-100 pb-2.5 text-sm text-neutral-900 flex items-center justify-between">
              <span>Price Details ({String(preview.data.itemCount || preview.data.items?.length || 0)} Items)</span>
              {couponCode && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {couponCode}
                </span>
              )}
            </h2>

            <div className="space-y-2 text-neutral-600 text-xs">
              <div className="flex justify-between">
                <span>Total MRP / Subtotal</span>
                <span className="font-medium text-neutral-900">{formatInr(Number(preview.data.subtotal))}</span>
              </div>

              {Number(preview.data.discountTotal) > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon & Promotional Discount</span>
                  <span>-{formatInr(Number(preview.data.discountTotal))}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Estimated Taxes (GST 5%/12%)</span>
                <span>{formatInr(Number(preview.data.taxTotal))}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Delivery / Shipping Fee</span>
                <span>
                  {Number(preview.data.shippingCharge) === 0 ? (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">FREE</span>
                  ) : (
                    formatInr(Number(preview.data.shippingCharge))
                  )}
                </span>
              </div>

              <div className="flex justify-between font-bold text-base pt-3 border-t border-neutral-200 text-neutral-900">
                <span>Total Amount Payable</span>
                <span className="text-[var(--brand-primary)]">{formatInr(Number(preview.data.grandTotal))}</span>
              </div>
            </div>

            <button
              onClick={onPlaceOrder}
              disabled={isBusy || !activeAddressId}
              className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-60"
            >
              <Lock className="w-4 h-4" />
              <span>
                {isVerifyingPayment
                  ? 'Verifying Payment…'
                  : placeOrder.isPending
                  ? 'Placing Order…'
                  : paymentMethod === 'RAZORPAY'
                  ? `Proceed to Pay ${formatInr(Number(preview.data.grandTotal))}`
                  : `Confirm Order (${formatInr(Number(preview.data.grandTotal))})`}
              </span>
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe & Secure Payments • 7-Day Easy Returns Guarantee</span>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-neutral-400 bg-white rounded-2xl border border-neutral-100">
            Calculating checkout pricing...
          </div>
        )}
      </main>
    </MobilePageContainer>
  );
}

export default function CheckoutPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading checkout...</div>}>
      <CheckoutPageContent />
    </React.Suspense>
  );
}

