'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Lock, Gift, MapPin, Truck, Clock, MessageSquare, Plus, Check } from 'lucide-react';
import { MobilePageContainer } from '@/components/layout/MobilePageContainer';
import { useAuth } from '@/hooks/useAuth';
import {
  useCheckoutPreview,
  useCustomerAddresses,
  usePlaceOrder,
} from '@/features/customer/hooks';
import { formatInr } from '@/features/customer/mappers';
import { getApiErrorMessage } from '@/utils/api-error';

const DELIVERY_SLOTS = [
  { id: 'MORNING', label: 'Morning (9:00 AM - 1:00 PM)' },
  { id: 'AFTERNOON', label: 'Afternoon (1:00 PM - 6:00 PM)' },
  { id: 'EVENING', label: 'Evening (6:00 PM - 9:00 PM)' },
];

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addressIdParam = searchParams.get('addressId') || '';
  const { isAuthenticated, isInitializing } = useAuth();
  const { data: addressesData } = useCustomerAddresses(isAuthenticated);
  const placeOrder = usePlaceOrder();
  const [orderError, setOrderError] = useState('');

  // Form states
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [preferredDeliverySlot, setPreferredDeliverySlot] = useState('MORNING');
  const [isGift, setIsGift] = useState(false);
  const [giftWrapMessage, setGiftWrapMessage] = useState('');
  const [notes, setNotes] = useState('');

  const addresses = useMemo(() => {
    if (!addressesData) return [];
    return Array.isArray(addressesData) ? addressesData : (addressesData as any).data || [];
  }, [addressesData]);

  const addressId = addressIdParam || addresses.find((a: any) => a.isDefault)?.id || addresses[0]?.id || '';
  const preview = useCheckoutPreview(addressId || undefined);
  const selectedAddress = addresses.find((a: any) => a.id === addressId);

  if (!isInitializing && !isAuthenticated) {
    router.push('/login?redirect=/checkout');
    return null;
  }

  const onPlaceOrder = async () => {
    if (!addressId) {
      setOrderError('Please select or add a shipping address first.');
      return;
    }
    setOrderError('');
    try {
      const order = await placeOrder.mutateAsync({
        addressId,
        paymentMethod: 'COD',
        notes: notes || undefined,
        deliveryInstructions: deliveryInstructions || undefined,
        preferredDeliverySlot: preferredDeliverySlot || undefined,
        isGift,
        giftWrapMessage: isGift ? giftWrapMessage || undefined : undefined,
      });
      router.push(`/checkout/success?orderId=${order.orderNumber}`);
    } catch (err: unknown) {
      setOrderError(getApiErrorMessage(err, 'Failed to place order'));
    }
  };

  return (
    <MobilePageContainer>
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/cart" className="p-1 rounded-lg hover:bg-neutral-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold font-serif text-[var(--brand-primary)]">Checkout</h1>
        </div>
        <div className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <Lock className="w-3 h-3" /> Secure
        </div>
      </header>

      <main className="flex-1 p-4 space-y-5 text-xs">
        {/* Shipping Address Selection */}
        <section className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="font-bold text-neutral-800 flex items-center gap-1.5 text-sm">
              <MapPin className="w-4 h-4 text-[var(--brand-primary)]" />
              <span>Shipping Address</span>
            </h2>
            <Link
              href="/checkout/address/edit"
              className="text-xs font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add New
            </Link>
          </div>

          {selectedAddress ? (
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-900">{selectedAddress.fullName}</span>
                <span className="text-[10px] font-bold bg-[var(--brand-primary)] text-white px-2 py-0.5 rounded-md uppercase">
                  {selectedAddress.label || 'Home'}
                </span>
              </div>
              <p className="text-neutral-600">
                {selectedAddress.addressLine1}, {selectedAddress.addressLine2 ? selectedAddress.addressLine2 + ', ' : ''}
                {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postalCode}
              </p>
              <p className="text-neutral-500 font-mono">Mobile: {selectedAddress.phone}</p>
            </div>
          ) : (
            <div className="p-4 text-center text-neutral-500">
              No shipping address found.{' '}
              <Link href="/checkout/address/edit" className="text-[var(--brand-primary)] font-bold underline">
                Add an address
              </Link>
            </div>
          )}
        </section>

        {/* Courier & Delivery Slot Options */}
        <section className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-2xs space-y-3">
          <h2 className="font-bold text-neutral-800 flex items-center gap-1.5 text-sm border-b pb-2">
            <Truck className="w-4 h-4 text-[var(--brand-primary)]" />
            <span>Preferred Delivery Slot & Instructions</span>
          </h2>

          <div>
            <span className="font-semibold text-neutral-700 block mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-neutral-500" /> Time Slot Preference
            </span>
            <div className="space-y-1.5">
              {DELIVERY_SLOTS.map((slot) => (
                <label
                  key={slot.id}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
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

          <div>
            <span className="font-semibold text-neutral-700 block mb-1">Delivery Instructions for Courier</span>
            <input
              type="text"
              placeholder="e.g. Leave with gate security / Do not bend saree box"
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-xl outline-none focus:border-[var(--brand-primary)]"
            />
          </div>
        </section>

        {/* Luxury Gift Packaging Option */}
        <section className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-[var(--brand-primary)]" />
              <span className="font-bold text-neutral-800 text-sm">Add Complimentary Gift Wrapping</span>
            </div>
            <button
              type="button"
              onClick={() => setIsGift(!isGift)}
              className={`w-10 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                isGift ? 'bg-[var(--brand-primary)]' : 'bg-neutral-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  isGift ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {isGift && (
            <div className="space-y-2 pt-1 animate-fadeIn">
              <span className="font-semibold text-neutral-700 block">Personal Gift Card Message</span>
              <textarea
                rows={2}
                placeholder="Write your gift message here (e.g., Happy Wedding Anniversary!)..."
                value={giftWrapMessage}
                onChange={(e) => setGiftWrapMessage(e.target.value)}
                className="w-full p-2.5 border border-neutral-200 rounded-xl outline-none focus:border-[var(--brand-primary)]"
              />
            </div>
          )}
        </section>

        {/* Special Order Notes */}
        <section className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-2xs space-y-2">
          <h2 className="font-bold text-neutral-800 flex items-center gap-1.5 text-sm">
            <MessageSquare className="w-4 h-4 text-[var(--brand-primary)]" />
            <span>Special Order Notes</span>
          </h2>
          <input
            type="text"
            placeholder="Blouse stitching / custom length request..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-200 rounded-xl outline-none focus:border-[var(--brand-primary)]"
          />
        </section>

        {/* Order Summary & Pricing */}
        {preview.data ? (
          <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm space-y-3">
            <h2 className="font-bold border-b pb-2 text-sm text-neutral-900">Payment & Pricing Breakdown</h2>
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal ({String(preview.data.itemCount || 0)} items)</span>
              <span>{formatInr(Number(preview.data.subtotal))}</span>
            </div>
            {Number(preview.data.discountTotal) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Coupon Discount</span>
                <span>-{formatInr(Number(preview.data.discountTotal))}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-600">
              <span>Estimated Taxes (GST)</span>
              <span>{formatInr(Number(preview.data.taxTotal))}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Shipping & Delivery Fee</span>
              <span>
                {Number(preview.data.shippingCharge) === 0 ? (
                  <span className="text-emerald-700 font-bold">FREE</span>
                ) : (
                  formatInr(Number(preview.data.shippingCharge))
                )}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-neutral-200">
              <span>Grand Total</span>
              <span className="text-[var(--brand-primary)]">{formatInr(Number(preview.data.grandTotal))}</span>
            </div>

            {orderError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 font-medium">
                {orderError}
              </p>
            )}

            <button
              onClick={onPlaceOrder}
              disabled={placeOrder.isPending}
              className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-60"
            >
              <Lock className="w-4 h-4" />
              <span>{placeOrder.isPending ? 'Placing Order...' : 'Confirm & Place Order (Cash on Delivery)'}</span>
            </button>
          </div>
        ) : (
          <div className="p-8 text-center text-neutral-400">Loading checkout summary...</div>
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
