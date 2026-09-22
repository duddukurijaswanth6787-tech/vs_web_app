'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Lock,
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
  ShoppingBag,
  Loader2,
  CheckCircle2,
  Phone,
  Sparkles,
  Pencil,
  Smartphone,
  Building2,
  Wallet,
  QrCode,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  useCheckoutPreview,
  useCustomerAddresses,
  useCustomerCart,
  usePlaceOrder,
  usePublicSettings,
  useFeatureEnabled,
  customerKeys,
} from '@/features/customer/hooks';
import { usePincodeLookup } from '@/hooks/usePincodeLookup';
import { customerMeService } from '@/features/customer/me.service';
import { customerCartService } from '@/features/customer/cart.service';
import { useQueryClient } from '@tanstack/react-query';
import { formatInr } from '@/features/customer/mappers';
import { getApiErrorMessage } from '@/utils/api-error';
import { paymentService } from '@/features/payments/payment.service';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { withVariant, isLocalOrPlaceholder } from '@/lib/media-url';
import type { OrderPlacePaymentDto } from '@/features/customer/checkout.service';

const DELIVERY_SLOTS = [
  { id: 'MORNING', title: 'Morning', time: '9:00 AM – 1:00 PM' },
  { id: 'AFTERNOON', title: 'Afternoon', time: '1:00 PM – 6:00 PM' },
  { id: 'EVENING', title: 'Evening', time: '6:00 PM – 9:00 PM' },
];

const QUICK_INSTRUCTIONS = [
  'Call before delivery',
  'Leave with neighbor / flat',
  'Leave at security desk',
  'Ring doorbell twice',
];

const COUPON_STORAGE_KEY = 'vd_coupon_code';

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addressIdParam = searchParams.get('addressId') || '';
  const { isAuthenticated, isInitializing, user } = useAuth();
  const qc = useQueryClient();

  const { data: cartData } = useCustomerCart();
  const { data: addressesData, isLoading: addressesLoading } = useCustomerAddresses(isAuthenticated);
  const { data: publicSettings } = usePublicSettings();
  const isCodFeatureOn = useFeatureEnabled('cod');
  const codEnabled = Boolean(publicSettings?.codEnabled ?? isCodFeatureOn);
  const placeOrder = usePlaceOrder();

  // Stored coupon
  const [couponCode, setCouponCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(COUPON_STORAGE_KEY) || '';
    }
    return '';
  });
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);

  // Selected payment method: 'RAZORPAY' | 'COD'
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'COD'>('RAZORPAY');
  // Specific online instrument selection: 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' | 'COD'
  const [selectedPaymentInstrument, setSelectedPaymentInstrument] = useState<'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' | 'COD'>('UPI');

  // Auto-reset payment method to RAZORPAY if COD is disabled by admin
  useEffect(() => {
    if (!codEnabled && (paymentMethod === 'COD' || selectedPaymentInstrument === 'COD')) {
      setPaymentMethod('RAZORPAY');
      setSelectedPaymentInstrument('UPI');
    }
  }, [codEnabled, paymentMethod, selectedPaymentInstrument]);

  // Selected address state
  const [selectedAddressId, setSelectedAddressId] = useState<string>(addressIdParam);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Address Form State (Used for both Create & Edit)
  const [newAddrForm, setNewAddrForm] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
    city: '',
    state: '',
    country: 'India',
    isDefaultShipping: true,
  });
  const [newAddrLoading, setNewAddrLoading] = useState(false);
  const [newAddrError, setNewAddrError] = useState('');
  const [pincodeFilled, setPincodeFilled] = useState(false);
  const { lookup: lookupPincode, isLoading: pincodeLoading, notFound: pincodeNotFound } = usePincodeLookup();

  const handleOpenEditAddress = (addr: any) => {
    if (!addr) return;
    setEditingAddressId(addr.id);
    setNewAddrForm({
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      postalCode: addr.postalCode || '',
      city: addr.city || '',
      state: addr.state || '',
      country: addr.country || 'India',
      isDefaultShipping: Boolean(addr.isDefault || addr.isDefaultShipping),
    });
    setPincodeFilled(Boolean(addr.postalCode && addr.postalCode.length === 6));
    setNewAddrError('');
    setShowNewAddressForm(true);
    setShowAddressPicker(false);
  };

  const handleOpenNewAddress = () => {
    setEditingAddressId(null);
    let defaultName = '';
    let defaultPhone = '';
    if (user) {
      const u = user as unknown as { firstName?: string; lastName?: string; name?: string; phone?: string };
      const rawName = (u.firstName ? `${u.firstName}${u.lastName ? ' ' + u.lastName : ''}` : u.name || '').trim();
      const isGeneric = !rawName || ['customer', 'user', 'guest', 'admin', 'pos_operator'].includes(rawName.toLowerCase());
      defaultName = isGeneric ? '' : rawName;
      defaultPhone = u.phone || '';
    }
    setNewAddrForm({
      fullName: defaultName,
      phone: defaultPhone,
      addressLine1: '',
      addressLine2: '',
      postalCode: '',
      city: '',
      state: '',
      country: 'India',
      isDefaultShipping: addresses.length === 0,
    });
    setPincodeFilled(false);
    setNewAddrError('');
    setShowNewAddressForm(true);
    setShowAddressPicker(false);
  };

  // Form states
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [preferredDeliverySlot, setPreferredDeliverySlot] = useState('MORNING');
  const [notes, setNotes] = useState('');

  // Status & error states
  const [orderError, setOrderError] = useState('');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  const addresses = useMemo(() => {
    if (!addressesData) return [];
    return Array.isArray(addressesData) ? addressesData : (addressesData as any).data || [];
  }, [addressesData]);

  // Pre-fill user details into address form (avoid generic 'customer' or 'user')
  useEffect(() => {
    if (user) {
      const u = user as unknown as { firstName?: string; lastName?: string; name?: string; phone?: string };
      const rawName = (u.firstName ? `${u.firstName}${u.lastName ? ' ' + u.lastName : ''}` : u.name || '').trim();
      const isGeneric = !rawName || ['customer', 'user', 'guest', 'admin', 'pos_operator'].includes(rawName.toLowerCase());
      setNewAddrForm((prev) => ({
        ...prev,
        fullName: prev.fullName || (isGeneric ? '' : rawName),
        phone: prev.phone || u.phone || '',
      }));
    }
  }, [user]);

  // Auto-merge cart and restore Buy Now intent on mount
  useEffect(() => {
    if (isAuthenticated) {
      customerCartService
        .merge()
        .then(() => {
          qc.invalidateQueries({ queryKey: customerKeys.cart() });
        })
        .catch(() => {});

      if (typeof window !== 'undefined') {
        try {
          const buyNowRaw = sessionStorage.getItem('vs_buy_now_item');
          if (buyNowRaw) {
            const buyNowItem = JSON.parse(buyNowRaw);
            if (buyNowItem?.productId && (!cartData?.items || cartData.items.length === 0)) {
              customerCartService
                .addItem({
                  productId: buyNowItem.productId,
                  variantId: buyNowItem.variantId,
                  quantity: buyNowItem.quantity || 1,
                })
                .then(() => {
                  sessionStorage.removeItem('vs_buy_now_item');
                  qc.invalidateQueries({ queryKey: customerKeys.cart() });
                })
                .catch(() => {});
            }
          }
        } catch {}
      }
    }
  }, [isAuthenticated, cartData?.items?.length, qc]);

  // If user has no addresses once loading finishes, automatically show the address form
  useEffect(() => {
    if (!addressesLoading && addresses.length === 0) {
      setShowNewAddressForm(true);
    }
  }, [addressesLoading, addresses.length]);

  // Sync default address if not set
  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const defaultAddr = addresses.find((a: any) => a.isDefault || a.isDefaultShipping) || addresses[0];
      if (defaultAddr?.id) {
        setSelectedAddressId(defaultAddr.id);
      }
    }
  }, [addresses, selectedAddressId]);

  const activeAddressId = selectedAddressId || addressIdParam;
  const preview = useCheckoutPreview(activeAddressId || undefined, couponCode || undefined);
  const selectedAddress = addresses.find((a: any) => a.id === activeAddressId);

  const cartItems = useMemo(() => {
    if (preview.data?.items && preview.data.items.length > 0) {
      return preview.data.items;
    }
    if (cartData?.items && cartData.items.length > 0) {
      return cartData.items;
    }
    return [];
  }, [preview.data?.items, cartData?.items]);

  const fallbackSubtotal = useMemo(() => {
    return cartItems.reduce((acc: number, item: any) => {
      const lineTotal =
        item.totalPrice != null
          ? Number(item.totalPrice)
          : Number(item.unitPrice || item.price || 0) * (item.quantity || 1);
      return acc + (isNaN(lineTotal) ? 0 : lineTotal);
    }, 0);
  }, [cartItems]);
  const isShippingFeeEnabled = Boolean(
    publicSettings?.shippingFeeEnabled === true ||
    publicSettings?.shipping_fee_enabled === 'true'
  );
  const isThresholdEnabled = Boolean(
    publicSettings?.shippingFreeThresholdEnabled === true ||
    publicSettings?.shipping_free_threshold_enabled === 'true'
  );
  const freeShippingThreshold = Number(
    publicSettings?.shippingFreeThreshold ||
    publicSettings?.shipping_free_threshold ||
    0
  );
  const flatShippingFee = Number(
    publicSettings?.shippingFlatFee ||
    publicSettings?.shipping_flat_fee ||
    0
  );

  const isFreeShipping =
    !isShippingFeeEnabled ||
    (isThresholdEnabled && freeShippingThreshold > 0 && fallbackSubtotal >= freeShippingThreshold);
  const fallbackShipping = fallbackSubtotal === 0 || isFreeShipping ? 0 : flatShippingFee;
  const fallbackGrandTotal = Math.max(0, fallbackSubtotal + fallbackShipping);

  const displaySubtotal = preview.data ? Number(preview.data.subtotal) : fallbackSubtotal;
  const displayDiscount = preview.data ? Number(preview.data.discountTotal) : 0;
  const displayTax = preview.data ? Number(preview.data.taxTotal || 0) : 0;
  const displayShipping = preview.data ? Number(preview.data.shippingCharge) : fallbackShipping;
  const displayGrandTotal = preview.data ? Number(preview.data.grandTotal) : fallbackGrandTotal;

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [isInitializing, isAuthenticated, router]);

  const handlePostalCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setNewAddrForm((f) => ({ ...f, postalCode: digits }));
    setPincodeFilled(false);
    if (digits.length === 6) {
      lookupPincode(digits).then((result) => {
        if (result) {
          setNewAddrForm((f) => ({ ...f, city: result.city, state: result.state }));
          setPincodeFilled(true);
        }
      });
    }
  };

  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewAddrError('');
    if (!newAddrForm.fullName.trim() || !newAddrForm.phone.trim() || !newAddrForm.addressLine1.trim() || !newAddrForm.postalCode.trim()) {
      setNewAddrError('Please fill in all mandatory address fields (*).');
      return;
    }
    setNewAddrLoading(true);
    try {
      if (editingAddressId) {
        await customerMeService.updateAddress(editingAddressId, newAddrForm);
        setSelectedAddressId(editingAddressId);
      } else {
        const created = await customerMeService.createAddress(newAddrForm);
        if (created?.id) {
          setSelectedAddressId(created.id);
        }
      }
      await qc.invalidateQueries({ queryKey: customerKeys.addresses });
      await qc.invalidateQueries({ queryKey: customerKeys.address() });
      setShowNewAddressForm(false);
      setEditingAddressId(null);
      setShowAddressPicker(false);
    } catch (err) {
      setNewAddrError(getApiErrorMessage(err, editingAddressId ? 'Failed to update address' : 'Failed to save address'));
    } finally {
      setNewAddrLoading(false);
    }
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponCode(couponInput.trim().toUpperCase());
    if (typeof window !== 'undefined') {
      localStorage.setItem(COUPON_STORAGE_KEY, couponInput.trim().toUpperCase());
    }
    setCouponApplied(true);
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponInput('');
    setCouponApplied(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  };

  if (isInitializing || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-md animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[var(--brand-primary)] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-900 font-serif">Secure Checkout</h3>
            <p className="text-xs text-neutral-500">Redirecting to login / account...</p>
          </div>
          <Link
            href="/login?redirect=/checkout"
            className="block w-full py-3 bg-[var(--brand-primary)] text-white rounded-xl text-xs font-bold hover:opacity-95 shadow-xs"
          >
            Click here to Login
          </Link>
        </div>
      </div>
    );
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
      prefill: {
        name: selectedAddress?.fullName || user?.email || '',
        contact: selectedAddress?.phone || (user as any)?.phone || '',
      },
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
      setOrderError('Please select or add a delivery address to complete your order.');
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
      });

      if (paymentMethod === 'RAZORPAY' && order.payment) {
        openRazorpayModal(order.payment, order.orderNumber);
        return;
      }

      // COD or immediate success
      if (typeof window !== 'undefined') localStorage.removeItem(COUPON_STORAGE_KEY);
      router.push(`/checkout/success?orderId=${encodeURIComponent(order.orderNumber)}`);
    } catch (err: unknown) {
      setOrderError(getApiErrorMessage(err, 'Failed to place order. Please check address and try again.'));
    }
  };

  const isBusy = placeOrder.isPending || isVerifyingPayment;

  return (
    <div className="min-h-screen bg-[#faf9f8] flex flex-col font-sans antialiased text-neutral-900 pb-16">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* TOP HEADER WITH BRAND LOGO & MULTI-STEP PROGRESS BAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Back to Cart */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/cart"
              className="p-2 rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Cart</span>
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/brand/logo-full.png"
                alt="Vasanthi's Signature"
                width={1400}
                height={803}
                className="h-7 sm:h-9 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {/* AMAZON / MYNTRA STYLE STEPPER INDICATOR */}
          <div className="hidden md:flex items-center gap-3 text-xs font-medium">
            <Link href="/cart" className="flex items-center gap-1.5 text-emerald-700 font-bold hover:opacity-80">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px]">
                <Check className="w-3 h-3" />
              </span>
              <span>1. Bag</span>
            </Link>
            <div className="w-8 h-[2px] bg-emerald-500 rounded-full" />
            <div className="flex items-center gap-1.5 text-[var(--brand-primary)] font-bold">
              <span className="w-5 h-5 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center text-[10px] shadow-xs animate-pulse">
                2
              </span>
              <span>2. Address & Delivery</span>
            </div>
            <div className="w-8 h-[2px] bg-neutral-200 rounded-full" />
            <div className="flex items-center gap-1.5 text-neutral-400">
              <span className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-500 flex items-center justify-center text-[10px]">
                3
              </span>
              <span>3. Payment</span>
            </div>
          </div>

          {/* 256-Bit SSL Security Badge */}
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">100% Secure Checkout</span>
            <span className="sm:hidden">SSL Secure</span>
          </div>
        </div>
      </header>

      {/* MAIN CHECKOUT 2-COLUMN CONTAINER */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Error Notification */}
        {orderError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-700 animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-xs">Checkout Attention Required</p>
              <p className="text-xs leading-relaxed">{orderError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ============================================================ */}
          {/* LEFT COLUMN: ADDRESS, SLOTS, GIFT & PAYMENT (7 COLS) */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 space-y-6">
            {/* STEP 1: DELIVERY ADDRESS CARD */}
            <section className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-sky-50 text-[var(--brand-primary)] flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h2 className="font-bold text-neutral-900 text-sm font-serif flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[var(--brand-primary)]" />
                      Delivery Address
                    </h2>
                    <p className="text-[11px] text-neutral-500">Select where you want your order delivered</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {addresses.length > 1 && !showNewAddressForm && (
                    <button
                      type="button"
                      onClick={() => setShowAddressPicker(!showAddressPicker)}
                      className="text-xs font-bold text-[var(--brand-primary)] hover:underline cursor-pointer"
                    >
                      {showAddressPicker ? 'Close' : 'Change'}
                    </button>
                  )}
                  {!showNewAddressForm && (
                    <button
                      type="button"
                      onClick={handleOpenNewAddress}
                      className="text-xs font-bold bg-sky-50 text-[var(--brand-primary)] border border-sky-100 px-3 py-1.5 rounded-xl hover:bg-sky-100 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add New Address
                    </button>
                  )}
                </div>
              </div>

              {/* INLINE ADDRESS FORM (ADD / EDIT) */}
              {showNewAddressForm ? (
                <form onSubmit={handleSaveNewAddress} className="bg-neutral-50/80 border border-neutral-200 rounded-2xl p-4 sm:p-5 space-y-3.5 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2">
                    <span className="text-xs font-bold text-neutral-900 font-serif flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                      {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewAddressForm(false);
                        setEditingAddressId(null);
                      }}
                      className="text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  {newAddrError && (
                    <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-2.5">{newAddrError}</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block space-y-1">
                      <span className="text-[11px] font-semibold text-neutral-700">Full Name *</span>
                      <input
                        required
                        placeholder="Receiver's name"
                        value={newAddrForm.fullName}
                        onChange={(e) => setNewAddrForm({ ...newAddrForm, fullName: e.target.value })}
                        className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--brand-primary)]"
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-[11px] font-semibold text-neutral-700">10-Digit Mobile *</span>
                      <input
                        required
                        type="tel"
                        maxLength={10}
                        placeholder="Mobile number for delivery calls"
                        value={newAddrForm.phone}
                        onChange={(e) => setNewAddrForm({ ...newAddrForm, phone: e.target.value.replace(/\D/g, '') })}
                        className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--brand-primary)]"
                      />
                    </label>
                  </div>

                  {/* Postal Code & Auto Detected City/State */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="block space-y-1">
                      <span className="text-[11px] font-semibold text-neutral-700">Postal Code (PIN) *</span>
                      <div className="relative">
                        <input
                          required
                          maxLength={6}
                          placeholder="6-digit PIN"
                          value={newAddrForm.postalCode}
                          onChange={(e) => handlePostalCodeChange(e.target.value)}
                          className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 pr-8 text-xs outline-none focus:border-[var(--brand-primary)]"
                        />
                        {pincodeLoading && (
                          <Loader2 className="w-3.5 h-3.5 text-neutral-400 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                        )}
                        {!pincodeLoading && pincodeFilled && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 absolute right-2.5 top-1/2 -translate-y-1/2" />
                        )}
                      </div>
                    </label>

                    <label className="block space-y-1">
                      <span className="text-[11px] font-semibold text-neutral-700">City *</span>
                      <input
                        required
                        placeholder="City"
                        value={newAddrForm.city}
                        onChange={(e) => setNewAddrForm({ ...newAddrForm, city: e.target.value })}
                        className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--brand-primary)]"
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-[11px] font-semibold text-neutral-700">State *</span>
                      <input
                        required
                        placeholder="State"
                        value={newAddrForm.state}
                        onChange={(e) => setNewAddrForm({ ...newAddrForm, state: e.target.value })}
                        className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--brand-primary)]"
                      />
                    </label>
                  </div>

                  {/* Delivery Serviceability Verification Banner */}
                  {pincodeFilled && (
                    <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-800 text-xs animate-fadeIn">
                      <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="leading-snug">
                        <strong>Delivery in 3–5 days:</strong> Express delivery available to <strong>{newAddrForm.city ? `${newAddrForm.city}, ${newAddrForm.state}` : 'your location'}</strong>.
                      </span>
                    </div>
                  )}

                  <label className="block space-y-1">
                    <span className="text-[11px] font-semibold text-neutral-700">Flat / House No / Building / Street *</span>
                    <input
                      required
                      placeholder="e.g. Flat 402, Signature Heights, Road No 10"
                      value={newAddrForm.addressLine1}
                      onChange={(e) => setNewAddrForm({ ...newAddrForm, addressLine1: e.target.value })}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--brand-primary)]"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[11px] font-semibold text-neutral-700">Area / Landmark (Optional)</span>
                    <input
                      placeholder="e.g. Near City Center Mall, Banjara Hills"
                      value={newAddrForm.addressLine2}
                      onChange={(e) => setNewAddrForm({ ...newAddrForm, addressLine2: e.target.value })}
                      className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--brand-primary)]"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={newAddrLoading}
                    className="w-full py-2.5 bg-[var(--brand-primary)] text-white rounded-xl text-xs font-bold hover:bg-[var(--brand-primary-dark)] disabled:opacity-60 transition-all shadow-xs cursor-pointer"
                  >
                    {newAddrLoading
                      ? (editingAddressId ? 'Updating Address…' : 'Saving Address…')
                      : (editingAddressId ? 'Save Changes' : 'Save & Deliver to this Address')}
                  </button>
                </form>
              ) : addressesLoading ? (
                <div className="py-6 text-center text-xs text-neutral-400 space-y-2">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-[var(--brand-primary)]" />
                  <p>Loading your saved addresses...</p>
                </div>
              ) : selectedAddress ? (
                <div className="space-y-3">
                  {/* Selected Address Card */}
                  <div className="bg-sky-50/50 border-2 border-[var(--brand-primary)] rounded-2xl p-4 sm:p-5 relative transition-all shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900 text-sm">{selectedAddress.fullName}</span>
                        <span className="text-[10px] font-bold bg-[var(--brand-primary)] text-white px-2 py-0.5 rounded-md uppercase">
                          {selectedAddress.label || selectedAddress.addressType || 'Home'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditAddress(selectedAddress)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-primary)] bg-white border border-sky-200 px-2.5 py-1 rounded-lg hover:bg-sky-50 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--brand-primary)]">
                          <CheckCircle2 className="w-4 h-4 text-[var(--brand-primary)]" /> Selected
                        </span>
                      </div>
                    </div>

                    <p className="text-neutral-700 text-xs leading-relaxed">
                      {selectedAddress.addressLine1}
                      {selectedAddress.addressLine2 ? `, ${selectedAddress.addressLine2}` : ''}, {selectedAddress.city},{' '}
                      {selectedAddress.state} – <span className="font-bold text-neutral-900">{selectedAddress.postalCode}</span>
                    </p>
                    <p className="text-neutral-500 font-mono text-[11px] flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-neutral-400" />
                      Phone: <span className="text-neutral-800 font-semibold">{selectedAddress.phone}</span>
                    </p>

                    {/* Delivery Serviceability Badge on Selected Address */}
                    <div className="pt-2 border-t border-sky-100 flex items-center gap-2 text-emerald-800 text-xs font-medium">
                      <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Serviceable to PIN <strong>{selectedAddress.postalCode}</strong> • Estimated delivery in <strong>3–5 business days</strong>
                      </span>
                    </div>
                  </div>

                  {/* Switch to Other Addresses */}
                  {showAddressPicker && addresses.length > 1 && (
                    <div className="pt-2 space-y-2.5 border-t border-neutral-100 animate-fadeIn">
                      <p className="text-[11px] font-bold text-neutral-700">Choose from your other addresses:</p>
                      <div className="grid gap-2">
                        {addresses.map((addr: any) => (
                          <div
                            key={addr.id}
                            className={`flex items-start justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                              activeAddressId === addr.id
                                ? 'border-[var(--brand-primary)] bg-sky-50/60 font-semibold'
                                : 'border-neutral-200 hover:bg-neutral-50'
                            }`}
                          >
                            <label className="flex items-start gap-3 cursor-pointer flex-1">
                              <input
                                type="radio"
                                name="checkoutAddressSelect"
                                checked={activeAddressId === addr.id}
                                onChange={() => {
                                  setSelectedAddressId(addr.id);
                                  setShowAddressPicker(false);
                                }}
                                className="mt-0.5 accent-[var(--brand-primary)]"
                              />
                              <div className="space-y-0.5 text-xs flex-1">
                                <span className="font-bold text-neutral-900">{addr.fullName}</span>
                                <p className="text-neutral-600 text-[11px]">
                                  {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.state} - {addr.postalCode}
                                </p>
                                <p className="text-neutral-400 text-[10px]">Phone: {addr.phone}</p>
                              </div>
                            </label>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditAddress(addr);
                              }}
                              className="text-[11px] font-bold text-[var(--brand-primary)] hover:underline px-2.5 py-1 bg-white border border-neutral-200 rounded-lg shrink-0 cursor-pointer flex items-center gap-1 shadow-2xs hover:bg-neutral-50"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center bg-neutral-50/70 border border-dashed border-neutral-300 rounded-2xl space-y-3">
                  <div className="w-12 h-12 rounded-full bg-sky-50 text-[var(--brand-primary)] flex items-center justify-center mx-auto">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 font-serif">No Delivery Address Found</h3>
                    <p className="text-xs text-neutral-500 mt-1">Please add an address to continue with your checkout</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-[var(--brand-primary)] text-white rounded-xl text-xs font-bold hover:bg-[var(--brand-primary-dark)] shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Delivery Address Now
                  </button>
                </div>
              )}
            </section>

            {/* STEP 2: DELIVERY SLOT & COURIER INSTRUCTIONS */}
            <section className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
                <div className="w-7 h-7 rounded-xl bg-sky-50 text-[var(--brand-primary)] flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <h2 className="font-bold text-neutral-900 text-sm font-serif flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[var(--brand-primary)]" />
                    Delivery Schedule & Instructions
                  </h2>
                  <p className="text-[11px] text-neutral-500">Pick preferred arrival time & driver notes</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-neutral-700 flex items-center gap-1.5 text-xs">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" /> Preferred Delivery Window
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {DELIVERY_SLOTS.map((slot) => (
                    <label
                      key={slot.id}
                      className={`flex flex-col gap-1 p-3 rounded-2xl border cursor-pointer transition-all text-xs ${
                        preferredDeliverySlot === slot.id
                          ? 'border-[var(--brand-primary)] bg-sky-50/50 font-bold text-neutral-900 shadow-2xs'
                          : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{slot.title}</span>
                        <input
                          type="radio"
                          name="preferredSlot"
                          checked={preferredDeliverySlot === slot.id}
                          onChange={() => setPreferredDeliverySlot(slot.id)}
                          className="accent-[var(--brand-primary)]"
                        />
                      </div>
                      <span className="text-[11px] text-neutral-500 font-normal">{slot.time}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <span className="font-semibold text-neutral-700 block text-xs">Delivery Instructions for Courier</span>
                <input
                  type="text"
                  placeholder="e.g. Call before arrival / Ring bell / Leave with neighbor"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-neutral-200 rounded-xl outline-none focus:border-[var(--brand-primary)] text-xs bg-neutral-50/40"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {QUICK_INSTRUCTIONS.map((hint) => (
                    <button
                      key={hint}
                      type="button"
                      onClick={() => setDeliveryInstructions(hint)}
                      className="text-[10px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      + {hint}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* STEP 3: PAYMENT METHOD SELECTION (AMAZON / ZEPTO STYLE) */}
            <section className="bg-white rounded-3xl p-4 sm:p-6 border border-neutral-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-sky-50 text-[var(--brand-primary)] flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-neutral-900 text-sm font-serif flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[var(--brand-primary)] shrink-0" />
                      Payment Options
                    </h2>
                    <p className="text-[11px] text-neutral-500 truncate">Choose your preferred payment method • 100% Secure</p>
                  </div>
                </div>
                <span className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  <Lock className="w-3 h-3 text-emerald-600" /> 256-bit SSL Encrypted
                </span>
              </div>

              <div className="space-y-2.5">
                {/* OPTION 1: UPI / QR Code (Recommended) */}
                <label
                  onClick={() => {
                    setSelectedPaymentInstrument('UPI');
                    setPaymentMethod('RAZORPAY');
                  }}
                  className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedPaymentInstrument === 'UPI'
                      ? 'border-[var(--brand-primary)] bg-sky-50/50 shadow-xs'
                      : 'border-neutral-200 hover:bg-neutral-50/80'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentInstrument"
                    checked={selectedPaymentInstrument === 'UPI'}
                    onChange={() => {
                      setSelectedPaymentInstrument('UPI');
                      setPaymentMethod('RAZORPAY');
                    }}
                    className="mt-1 accent-[var(--brand-primary)] w-4 h-4"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="font-bold text-neutral-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-[var(--brand-primary)]" />
                        UPI / QR (Google Pay, PhonePe, Paytm, BHIM)
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md shrink-0">
                        ⚡ Fastest &amp; Recommended
                      </span>
                    </div>
                    <p className="text-neutral-600 text-[11px] leading-relaxed">
                      Pay instantly via Google Pay, PhonePe, Paytm, BHIM or scan QR code using any UPI app.
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-medium text-neutral-500">
                      <span className="px-2 py-0.5 bg-white border border-neutral-200 rounded-md font-semibold text-neutral-700">Google Pay</span>
                      <span className="px-2 py-0.5 bg-white border border-neutral-200 rounded-md font-semibold text-neutral-700">PhonePe</span>
                      <span className="px-2 py-0.5 bg-white border border-neutral-200 rounded-md font-semibold text-neutral-700">Paytm</span>
                      <span className="px-2 py-0.5 bg-white border border-neutral-200 rounded-md font-semibold text-neutral-700">BHIM / Any UPI</span>
                    </div>
                  </div>
                </label>

                {/* OPTION 2: Credit / Debit Cards */}
                <label
                  onClick={() => {
                    setSelectedPaymentInstrument('CARD');
                    setPaymentMethod('RAZORPAY');
                  }}
                  className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedPaymentInstrument === 'CARD'
                      ? 'border-[var(--brand-primary)] bg-sky-50/50 shadow-xs'
                      : 'border-neutral-200 hover:bg-neutral-50/80'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentInstrument"
                    checked={selectedPaymentInstrument === 'CARD'}
                    onChange={() => {
                      setSelectedPaymentInstrument('CARD');
                      setPaymentMethod('RAZORPAY');
                    }}
                    className="mt-1 accent-[var(--brand-primary)] w-4 h-4"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="font-bold text-neutral-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-[var(--brand-primary)]" />
                        Credit / Debit Cards
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-500">All Banks Supported</span>
                    </div>
                    <p className="text-neutral-600 text-[11px] leading-relaxed">
                      Visa, MasterCard, RuPay, Maestro, Diners Club, American Express with 3D Secure OTP.
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-medium text-neutral-500">
                      <span className="px-2 py-0.5 bg-white border border-neutral-200 rounded-md font-semibold text-sky-700">VISA</span>
                      <span className="px-2 py-0.5 bg-white border border-neutral-200 rounded-md font-semibold text-red-600">Mastercard</span>
                      <span className="px-2 py-0.5 bg-white border border-neutral-200 rounded-md font-semibold text-emerald-700">RuPay</span>
                      <span className="px-2 py-0.5 bg-white border border-neutral-200 rounded-md font-semibold text-neutral-700">Maestro</span>
                    </div>
                  </div>
                </label>

                {/* OPTION 3: Net Banking */}
                <label
                  onClick={() => {
                    setSelectedPaymentInstrument('NETBANKING');
                    setPaymentMethod('RAZORPAY');
                  }}
                  className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedPaymentInstrument === 'NETBANKING'
                      ? 'border-[var(--brand-primary)] bg-sky-50/50 shadow-xs'
                      : 'border-neutral-200 hover:bg-neutral-50/80'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentInstrument"
                    checked={selectedPaymentInstrument === 'NETBANKING'}
                    onChange={() => {
                      setSelectedPaymentInstrument('NETBANKING');
                      setPaymentMethod('RAZORPAY');
                    }}
                    className="mt-1 accent-[var(--brand-primary)] w-4 h-4"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="font-bold text-neutral-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-[var(--brand-primary)]" />
                        Net Banking
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-500">50+ Indian Banks</span>
                    </div>
                    <p className="text-neutral-600 text-[11px] leading-relaxed">
                      SBI, HDFC Bank, ICICI Bank, Axis Bank, Kotak, Punjab National Bank and all other major banks.
                    </p>
                  </div>
                </label>

                {/* OPTION 4: Wallets */}
                <label
                  onClick={() => {
                    setSelectedPaymentInstrument('WALLET');
                    setPaymentMethod('RAZORPAY');
                  }}
                  className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedPaymentInstrument === 'WALLET'
                      ? 'border-[var(--brand-primary)] bg-sky-50/50 shadow-xs'
                      : 'border-neutral-200 hover:bg-neutral-50/80'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentInstrument"
                    checked={selectedPaymentInstrument === 'WALLET'}
                    onChange={() => {
                      setSelectedPaymentInstrument('WALLET');
                      setPaymentMethod('RAZORPAY');
                    }}
                    className="mt-1 accent-[var(--brand-primary)] w-4 h-4"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="font-bold text-neutral-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-[var(--brand-primary)]" />
                        Wallets &amp; Others
                      </span>
                    </div>
                    <p className="text-neutral-600 text-[11px] leading-relaxed">
                      Amazon Pay, Mobikwik, Airtel Money, Freecharge &amp; more.
                    </p>
                  </div>
                </label>

                {/* OPTION 5: Cash on Delivery (COD) - Disabled / Unavailable like Amazon */}
                <div
                  className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    codEnabled
                      ? selectedPaymentInstrument === 'COD'
                        ? 'border-[var(--brand-primary)] bg-sky-50/50 shadow-xs cursor-pointer'
                        : 'border-neutral-200 hover:bg-neutral-50/80 cursor-pointer'
                      : 'border-neutral-200/60 bg-neutral-50/60 opacity-70 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (codEnabled) {
                      setSelectedPaymentInstrument('COD');
                      setPaymentMethod('COD');
                    }
                  }}
                >
                  <input
                    type="radio"
                    name="paymentInstrument"
                    disabled={!codEnabled}
                    checked={selectedPaymentInstrument === 'COD'}
                    onChange={() => {
                      if (codEnabled) {
                        setSelectedPaymentInstrument('COD');
                        setPaymentMethod('COD');
                      }
                    }}
                    className="mt-1 accent-[var(--brand-primary)] w-4 h-4 disabled:cursor-not-allowed"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="font-bold text-neutral-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-neutral-500" />
                        Cash on Delivery (COD)
                      </span>
                      <span className="text-[10px] font-bold bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-md">
                        {codEnabled ? 'Available' : 'Unavailable (Prepaid Only)'}
                      </span>
                    </div>
                    <p className="text-neutral-500 text-[11px] leading-relaxed">
                      {codEnabled
                        ? 'Pay in cash upon physical delivery at your doorstep.'
                        : 'Cash on Delivery is not available for designer ethnic wear. Please choose any secure online payment option above.'}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: STICKY ORDER SUMMARY & ITEMS (5 COLS) */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
            {/* ORDER SUMMARY BOX */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/90 shadow-md space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="font-bold text-neutral-900 text-sm font-serif flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[var(--brand-primary)]" />
                  <span>Order Summary ({cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'})</span>
                </h3>
                <Link href="/cart" className="text-[11px] font-bold text-[var(--brand-primary)] hover:underline">
                  Edit Bag
                </Link>
              </div>

              {/* MINI CART ITEMS PREVIEW */}
              {cartItems.length > 0 && (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {cartItems.map((item: any, idx: number) => {
                    const rawImg =
                      item.productImage ||
                      item.imageUrl ||
                      item.image ||
                      item.product?.primaryImageUrl ||
                      item.product?.images?.[0]?.url ||
                      item.product?.media?.[0]?.url;
                    const finalImg = rawImg ? withVariant(rawImg, 'medium') : '';

                    const unitPrice = Number(
                      item.unitPrice ||
                      item.price ||
                      (item.totalPrice && item.quantity ? item.totalPrice / item.quantity : 0) ||
                      0
                    );
                    const lineTotal =
                      item.totalPrice != null
                        ? Number(item.totalPrice)
                        : unitPrice * (item.quantity || 1);

                    return (
                      <div key={item.id || idx} className="flex items-center gap-3 py-1.5 border-b border-neutral-100 last:border-0">
                        <div className="w-14 h-16 rounded-xl bg-neutral-100 overflow-hidden relative shrink-0 border border-neutral-200/70 flex items-center justify-center shadow-2xs">
                          {finalImg ? (
                            <img
                              src={finalImg}
                              alt={item.productName || item.product?.name || item.title || 'Product'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 text-[10px] bg-sky-50/50">
                              <ShoppingBag className="w-4 h-4 text-neutral-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-neutral-900 truncate">
                            {item.productName || item.product?.name || 'Designer Dress'}
                          </p>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            Qty: <span className="font-semibold text-neutral-800">{item.quantity}</span>
                            {item.variantName || item.variantTitle ? ` • Size: ${item.variantName || item.variantTitle}` : ''}
                            <span className="text-neutral-400"> ({formatInr(unitPrice)} each)</span>
                          </p>
                          <p className="text-xs font-bold text-[var(--brand-primary)] mt-0.5">
                            {formatInr(lineTotal)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* PROMO CODE / COUPON FORM */}
              <div className="pt-2 border-t border-neutral-100 space-y-2">
                <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" /> Apply Coupon / Voucher
                </span>
                {couponCode ? (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                    <span className="font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> {couponCode} Applied!
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter promo code (e.g. FESTIVE10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-neutral-200 rounded-xl outline-none focus:border-[var(--brand-primary)] text-xs uppercase font-mono"
                    />
                    <button
                      type="submit"
                      disabled={!couponInput.trim()}
                      className="px-4 py-2 bg-[var(--brand-primary)] text-white text-xs font-bold rounded-xl disabled:opacity-50 hover:bg-[var(--brand-primary-dark)] transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>
                )}
              </div>

              {/* DETAILED PRICE BREAKDOWN */}
              {cartItems.length > 0 ? (
                <div className="space-y-2.5 pt-3 border-t border-neutral-100 text-xs text-neutral-600">
                  <div className="flex justify-between">
                    <span>Total MRP / Subtotal</span>
                    <span className="font-semibold text-neutral-900">{formatInr(displaySubtotal)}</span>
                  </div>

                  {displayDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Coupon & Offer Discount</span>
                      <span>-{formatInr(displayDiscount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span>GST & Taxes</span>
                    <span>
                      {displayTax > 0 ? (
                        <span className="font-semibold text-neutral-800">
                          {formatInr(displayTax)} <span className="text-[10px] text-neutral-400 font-normal">(Included in MRP)</span>
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                          ₹0 (Included)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Delivery / Courier Shipping</span>
                    <span>
                      {displayShipping === 0 ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">FREE</span>
                      ) : (
                        formatInr(displayShipping)
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between items-center font-bold text-base pt-3 border-t border-neutral-200 text-neutral-900">
                    <span className="font-serif">Total Amount</span>
                    <span className="text-[var(--brand-primary)] text-lg">
                      {formatInr(displayGrandTotal)}
                    </span>
                  </div>

                  {/* PLACE ORDER / ADDRESS CTA BUTTON */}
                  {!activeAddressId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewAddressForm(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full mt-3 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Delivery Address to Proceed</span>
                    </button>
                  ) : (
                    <button
                      onClick={onPlaceOrder}
                      disabled={isBusy || !activeAddressId}
                      className="w-full mt-3 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-60"
                    >
                      <Lock className="w-4 h-4" />
                      <span>
                        {isVerifyingPayment
                          ? 'Verifying Payment…'
                          : placeOrder.isPending
                          ? 'Placing Order…'
                          : paymentMethod === 'RAZORPAY'
                          ? `Proceed to Pay ${formatInr(displayGrandTotal)}`
                          : `Confirm Order (${formatInr(displayGrandTotal)})`}
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-neutral-400 space-y-2">
                  <ShoppingBag className="w-6 h-6 text-neutral-300 mx-auto" />
                  <p>Your bag is currently empty.</p>
                  <Link
                    href="/"
                    className="inline-block text-[var(--brand-primary)] font-bold text-xs hover:underline mt-1"
                  >
                    Browse Collections & Add Items
                  </Link>
                </div>
              )}

              {/* TRUST BADGES & ASSURANCES */}
              <div className="space-y-2 pt-3 border-t border-neutral-100 text-[11px] text-neutral-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Genuine Designer Apparel Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Insured Express Doorstep Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <StorefrontFooter />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-500 font-sans">Loading checkout...</div>}>
      <CheckoutPageContent />
    </React.Suspense>
  );
}

