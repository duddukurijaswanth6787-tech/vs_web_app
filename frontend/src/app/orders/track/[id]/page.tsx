'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Truck,
  Package,
  PackageCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Copy,
  Check,
  FileText,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Headphones,
} from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerOrder, useOrderTracking } from '@/features/customer/hooks';
import { formatInr, PLACEHOLDER_IMAGE } from '@/features/customer/mappers';
import { getApiErrorMessage } from '@/utils/api-error';
import { apiClient } from '@/lib/api/client';

interface TrackingScan {
  location: string;
  status: string;
  timestamp: string;
}

interface LiveTrackingResponse {
  waybill: string;
  status: string;
  statusLocation?: string;
  statusDateTime?: string;
  instructions?: string;
  expectedDeliveryDate?: string;
  scans?: TrackingScan[];
}

export default function OrderTrackPage() {
  const params = useParams();
  const orderNumber = String(params.id || '');
  const { isAuthenticated, isInitializing } = useAuth();

  const { data: order, isLoading: isOrderLoading, error: orderError, refetch: refetchOrder } = useCustomerOrder(orderNumber, isAuthenticated);
  const { data: trackingData, isLoading: isTrackLoading } = useOrderTracking(orderNumber, isAuthenticated);

  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveDelhiveryData, setLiveDelhiveryData] = useState<LiveTrackingResponse | null>(null);

  const waybill =
    (typeof order?.waybillNumber === 'string' && order.waybillNumber) ||
    (typeof trackingData?.trackingNumber === 'string' && trackingData.trackingNumber) ||
    '';

  // Fetch live Delhivery scans if AWB is present
  useEffect(() => {
    if (waybill) {
      apiClient
        .get(`/shipping/delhivery/track/${encodeURIComponent(waybill)}`)
        .then((res) => {
          if (res.data?.data) {
            setLiveDelhiveryData(res.data.data);
          }
        })
        .catch(() => {});
    }
  }, [waybill]);

  const copyAwb = (awbText: string) => {
    navigator.clipboard.writeText(awbText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchOrder();
      if (waybill) {
        const res = await apiClient.get(`/shipping/delhivery/track/${encodeURIComponent(waybill)}`);
        if (res.data?.data) {
          setLiveDelhiveryData(res.data.data);
        }
      }
    } catch {}
    finally {
      setIsRefreshing(false);
    }
  };

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] flex flex-col font-sans antialiased text-neutral-900">
        <StorefrontHeader />
        <main className="max-w-md mx-auto w-full px-4 py-16 flex-1 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-sky-50 text-[var(--brand-primary)] flex items-center justify-center mx-auto shadow-sm">
            <Truck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-serif text-[var(--brand-primary)]">Track Your Shipment</h2>
            <p className="text-xs text-neutral-500">Please sign in to view real-time delivery status for #{orderNumber}</p>
          </div>
          <Link
            href={`/login?redirect=/orders/track/${orderNumber}`}
            className="block w-full bg-[var(--brand-primary)] text-white text-xs font-bold py-3.5 rounded-2xl shadow-xs hover:opacity-95 transition-all"
          >
            Login to Track Order
          </Link>
        </main>
        <StorefrontFooter />
      </div>
    );
  }

  const rawStatus = String(
    order?.status || trackingData?.currentStatus || trackingData?.status || 'PENDING'
  ).toUpperCase();
  const carrier =
    (typeof order?.courierPartner === 'string' && order.courierPartner) ||
    (typeof trackingData?.carrier === 'string' && trackingData.carrier) ||
    (waybill ? 'Delhivery Express' : 'Vasanthi Logistics');

  // Multi-step order tracking progress calculation
  // Stages: 1. Placed -> 2. Confirmed & Packed -> 3. Shipped / In Transit -> 4. Out for Delivery -> 5. Delivered
  let activeStep = 1;
  if (rawStatus.includes('DELIVER') || rawStatus === 'COMPLETED') {
    activeStep = 5;
  } else if (rawStatus.includes('OUT_FOR_DELIVERY') || rawStatus.includes('OFD')) {
    activeStep = 4;
  } else if (rawStatus.includes('SHIP') || rawStatus.includes('TRANSIT') || waybill) {
    activeStep = 3;
  } else if (rawStatus.includes('PACK') || rawStatus.includes('PROCESS') || rawStatus.includes('CONFIRM')) {
    activeStep = 2;
  }

  const isCancelled = rawStatus.includes('CANCEL');

  const shippingAddr =
    order?.shippingAddress ||
    (Array.isArray(order?.addresses) ? order.addresses.find((a: any) => a.addressType === 'SHIPPING') || order.addresses[0] : null);

  const trackingTimeline = (
    Array.isArray(order?.timeline) && order.timeline.length > 0
      ? order.timeline
      : Array.isArray(trackingData?.timeline)
      ? trackingData.timeline
      : []
  ) as any[];

  const scansList = liveDelhiveryData?.scans || [];

  return (
    <div className="min-h-screen bg-[#faf9f8] flex flex-col font-sans antialiased text-neutral-900 pb-20">
      <StorefrontHeader />

      {/* Header Sticky Bar */}
      <div className="bg-white border-b border-neutral-200/80 sticky top-0 z-40 px-4 sm:px-8 py-3 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/orders"
              className="p-2 rounded-xl text-neutral-600 hover:bg-neutral-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Orders</span>
            </Link>
            <div>
              <h1 className="text-sm sm:text-base font-bold font-serif text-[var(--brand-primary)] flex items-center gap-2">
                <span>Shipment Tracking</span>
                <span className="text-xs font-mono font-normal text-neutral-500">#{orderNumber}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Refresh tracking data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[var(--brand-primary)]' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              href={`/orders/details/${orderNumber}`}
              className="px-3 py-1.5 text-xs font-bold text-[var(--brand-primary)] bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-xl transition-colors flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" /> Order Details
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1 space-y-5">
        {(isOrderLoading || isTrackLoading) && !order && (
          <div className="bg-white rounded-3xl p-10 text-center space-y-3 border border-neutral-200 shadow-2xs">
            <Clock className="w-8 h-8 text-[var(--brand-primary)] animate-spin mx-auto" />
            <p className="text-xs text-neutral-500 font-medium">Fetching live courier &amp; shipment status…</p>
          </div>
        )}

        {orderError && !order && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-700">
            {getApiErrorMessage(orderError, 'Failed to load tracking details.')}
          </div>
        )}

        {order && (
          <>
            {/* HERO TRACKING STATUS BANNER */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-neutral-200 shadow-sm relative overflow-hidden space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Current Status</span>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-[var(--brand-primary)]">
                      {isCancelled
                        ? 'Order Cancelled'
                        : activeStep === 5
                        ? 'Package Delivered 🎉'
                        : activeStep === 4
                        ? 'Out for Delivery Today'
                        : activeStep === 3
                        ? 'In Transit with Courier'
                        : activeStep === 2
                        ? 'Order Confirmed & Packing'
                        : 'Order Placed & Received'}
                    </h2>
                    {!isCancelled && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-500">
                    {isCancelled
                      ? 'This order was cancelled. Refund processed to source account.'
                      : activeStep >= 3
                      ? 'Package is on its way to your delivery address.'
                      : 'We are preparing your items for courier handover.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-[var(--brand-primary)] border border-sky-100 text-xs font-bold shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-[var(--brand-primary)]" />
                    <span>{carrier}</span>
                  </span>
                  {activeStep >= 3 && !isCancelled && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                      <Truck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Express Delivery</span>
                    </span>
                  )}
                </div>
              </div>

              {/* ESTIMATED ARRIVAL BANNER */}
              {!isCancelled && (
                <div className="bg-gradient-to-r from-sky-50 via-indigo-50/50 to-amber-50/30 border border-sky-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-2xs border border-sky-100 text-[var(--brand-primary)] flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Estimated Delivery</p>
                      <p className="text-sm font-bold text-neutral-900">
                        {liveDelhiveryData?.expectedDeliveryDate
                          ? new Date(liveDelhiveryData.expectedDeliveryDate).toLocaleDateString('en-IN', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Expected in 3–5 Business Days'}
                      </p>
                    </div>
                  </div>
                  {liveDelhiveryData?.statusLocation && (
                    <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-sky-200/50">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Last Recorded Location</span>
                      <span className="text-xs font-bold text-neutral-800 flex items-center sm:justify-end gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[var(--brand-primary)]" /> {liveDelhiveryData.statusLocation}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 5-STEP VISUAL PROGRESS BAR */}
              <div className="pt-2">
                <div className="grid grid-cols-5 gap-2 text-center relative">
                  {/* Connecting Track Line */}
                  <div className="absolute top-4 left-[10%] right-[10%] h-1 bg-neutral-200 z-0 rounded-full" />
                  <div
                    className="absolute top-4 left-[10%] h-1 bg-[var(--brand-primary)] z-0 transition-all duration-700 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, (activeStep - 1) * 25))}%` }}
                  />

                  {/* Step 1: Placed */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        activeStep >= 1
                          ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-sm'
                          : 'bg-white text-neutral-400 border-neutral-300'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className={`text-xs font-bold ${activeStep >= 1 ? 'text-neutral-900' : 'text-neutral-400'}`}>
                        Placed
                      </p>
                      <p className="text-[10px] text-neutral-400 hidden sm:block">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Confirmed */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        activeStep >= 2
                          ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-sm'
                          : 'bg-white text-neutral-400 border-neutral-300'
                      }`}
                    >
                      {activeStep > 2 ? <Check className="w-4 h-4" /> : '2'}
                    </div>
                    <div className="space-y-0.5">
                      <p className={`text-xs font-bold ${activeStep >= 2 ? 'text-neutral-900' : 'text-neutral-400'}`}>
                        Confirmed
                      </p>
                      <p className="text-[10px] text-neutral-400 hidden sm:block">Verified</p>
                    </div>
                  </div>

                  {/* Step 3: In Transit */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        activeStep >= 3
                          ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-sm'
                          : 'bg-white text-neutral-400 border-neutral-300'
                      }`}
                    >
                      {activeStep > 3 ? <Check className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                    </div>
                    <div className="space-y-0.5">
                      <p className={`text-xs font-bold ${activeStep >= 3 ? 'text-neutral-900' : 'text-neutral-400'}`}>
                        In Transit
                      </p>
                      <p className="text-[10px] text-neutral-400 hidden sm:block">With Courier</p>
                    </div>
                  </div>

                  {/* Step 4: Out for Delivery */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        activeStep >= 4
                          ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-sm'
                          : 'bg-white text-neutral-400 border-neutral-300'
                      }`}
                    >
                      {activeStep > 4 ? <Check className="w-4 h-4" /> : '4'}
                    </div>
                    <div className="space-y-0.5">
                      <p className={`text-xs font-bold ${activeStep >= 4 ? 'text-neutral-900' : 'text-neutral-400'}`}>
                        Out for Delivery
                      </p>
                      <p className="text-[10px] text-neutral-400 hidden sm:block">Local Hub</p>
                    </div>
                  </div>

                  {/* Step 5: Delivered */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        activeStep >= 5
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-neutral-400 border-neutral-300'
                      }`}
                    >
                      <PackageCheck className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className={`text-xs font-bold ${activeStep >= 5 ? 'text-emerald-700' : 'text-neutral-400'}`}>
                        Delivered
                      </p>
                      <p className="text-[10px] text-neutral-400 hidden sm:block">Completed</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* WAYBILL BARCODE & TRACKING STRIP */}
              {waybill ? (
                <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                      Delhivery AWB Waybill
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-neutral-900 text-sm bg-white px-2.5 py-1 rounded-lg border border-neutral-200">
                        {waybill}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyAwb(waybill)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white hover:bg-neutral-100 text-neutral-700 px-2.5 py-1.5 rounded-lg border border-neutral-200 transition-colors cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-neutral-500 font-medium">Tracking Status:</span>
                    <span className="font-bold text-sky-800 bg-sky-100/80 px-2.5 py-1 rounded-lg border border-sky-200">
                      {liveDelhiveryData?.status || 'Manifested &amp; In Transit'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-amber-900">
                  <Package className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Your order is confirmed and being packed at our warehouse. A Delhivery waybill number will be generated automatically upon dispatch.
                  </span>
                </div>
              )}
            </div>

            {/* TWO-COLUMN LOWER SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* LEFT: ACTIVITY HISTORY & LIVE SCANS (7 COLS) */}
              <div className="md:col-span-7 space-y-5">
                {/* DELHIVERY LIVE SCANS LOG */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-700 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[var(--brand-primary)]" />
                      Live Transit History &amp; Checkpoints
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-semibold">Real-time GPS Logs</span>
                  </div>

                  {scansList.length > 0 ? (
                    <div className="space-y-3">
                      {scansList.map((scan, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-150">
                          <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)] mt-1 shrink-0" />
                          <div className="space-y-0.5 min-w-0 flex-1 text-xs">
                            <p className="font-bold text-neutral-900">{scan.status}</p>
                            <p className="text-[11px] text-neutral-600 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-neutral-400" /> {scan.location}
                            </p>
                            <p className="text-[10px] text-neutral-400">
                              {scan.timestamp ? new Date(scan.timestamp).toLocaleString('en-IN') : 'Logged'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : trackingTimeline.length > 0 ? (
                    <div className="space-y-3">
                      {trackingTimeline.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-150">
                          <div className="w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)] mt-1 shrink-0" />
                          <div className="space-y-0.5 min-w-0 flex-1 text-xs">
                            <p className="font-bold text-neutral-900">{item.status || item.message}</p>
                            {item.message && item.message !== item.status && (
                              <p className="text-[11px] text-neutral-600">{item.message}</p>
                            )}
                            <p className="text-[10px] text-neutral-400">
                              {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-neutral-50 rounded-2xl text-center text-xs text-neutral-500 space-y-1">
                      <p className="font-semibold text-neutral-800">Order Placed &amp; Received</p>
                      <p className="text-[11px]">Checkpoints will update as the courier scans your package at sorting facilities.</p>
                    </div>
                  )}
                </div>

                {/* ITEMS IN THIS SHIPMENT */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200 shadow-2xs space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-700 flex items-center gap-2 border-b border-neutral-100 pb-3">
                    <ShoppingBag className="w-4 h-4 text-[var(--brand-primary)]" />
                    Items in Shipment ({order.items?.length || 0})
                  </h3>

                  <div className="divide-y divide-neutral-100">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                            <Image
                              src={item.productImage || item.product?.media?.[0]?.url || PLACEHOLDER_IMAGE}
                              alt={item.productName}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-neutral-900 line-clamp-1">{item.productName}</p>
                            {item.variantName && (
                              <p className="text-[11px] text-neutral-500">Variant: {item.variantName}</p>
                            )}
                            <p className="text-[11px] text-neutral-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-neutral-900">
                          {formatInr(Number(item.totalPrice || item.unitPrice * item.quantity))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: DESTINATION ADDRESS & CUSTOMER SUPPORT (5 COLS) */}
              <div className="md:col-span-5 space-y-5">
                {/* DELIVERY ADDRESS */}
                {shippingAddr && (
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200 shadow-2xs space-y-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-700 flex items-center gap-2 border-b border-neutral-100 pb-3">
                      <MapPin className="w-4 h-4 text-[var(--brand-primary)]" />
                      Delivery Destination
                    </h3>
                    <div className="text-xs space-y-1 text-neutral-700">
                      <p className="font-bold text-neutral-900 text-sm">{shippingAddr.fullName || shippingAddr.name}</p>
                      <p className="leading-relaxed">
                        {[shippingAddr.addressLine1, shippingAddr.addressLine2, shippingAddr.city, shippingAddr.state]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      <p className="font-mono font-bold text-neutral-900">
                        PIN: {shippingAddr.postalCode || shippingAddr.pincode}
                      </p>
                      {shippingAddr.phone && (
                        <p className="text-neutral-500 font-mono text-[11px] pt-1 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-neutral-400" /> {shippingAddr.phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* CUSTOMER SUPPORT CARD */}
                <div className="bg-gradient-to-br from-white to-sky-50/40 rounded-3xl p-5 border border-neutral-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-[var(--brand-primary)]" />
                    <h4 className="text-xs font-bold text-neutral-900">Need Help with Delivery?</h4>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    If you have questions regarding your shipment or delivery schedule, our customer care team is available 24/7.
                  </p>
                  <div className="pt-1 flex flex-col gap-2">
                    <Link
                      href="/contact"
                      className="w-full text-center py-2.5 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-xl text-xs font-bold text-neutral-800 transition-colors shadow-2xs"
                    >
                      Contact Customer Support
                    </Link>
                  </div>
                </div>

                {/* BOTTOM NAVIGATION ACTIONS */}
                <div className="space-y-2 pt-2">
                  <Link
                    href={`/orders/details/${orderNumber}`}
                    className="block w-full text-center py-3 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-2xl text-xs font-bold text-neutral-800 transition-colors shadow-2xs"
                  >
                    View Full Order &amp; Invoice
                  </Link>
                  <Link
                    href="/orders"
                    className="block w-full text-center py-3 bg-[var(--brand-primary)] text-white hover:opacity-95 rounded-2xl text-xs font-bold transition-all shadow-xs"
                  >
                    View All My Orders
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
