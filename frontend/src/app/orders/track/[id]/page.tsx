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
  Calendar,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Info,
  XCircle
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
    (waybill ? 'Delhivery Express' : 'Vasanthi Signature Logistics');

  // Amazon-grade Multi-step order tracking progress calculation
  // Stages: 1. Ordered -> 2. Confirmed & Packed -> 3. Dispatched / In Transit -> 4. Out for Delivery -> 5. Delivered
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
    <div className="min-h-screen bg-[#f8f7f5] flex flex-col font-sans antialiased text-neutral-900 pb-20">
      <StorefrontHeader />

      {/* Header Sticky Navigation */}
      <div className="bg-white/95 backdrop-blur-md border-b border-neutral-200/80 sticky top-0 z-40 px-4 sm:px-8 py-3 shadow-2xs">
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
              title="Refresh live status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[var(--brand-primary)]' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <Link
              href={`/orders/details/${orderNumber}`}
              className="px-3 py-1.5 text-xs font-bold text-[var(--brand-primary)] bg-sky-50 hover:bg-sky-100 border border-sky-100 rounded-xl transition-colors flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" /> Order Invoice
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1 space-y-6">
        {(isOrderLoading || isTrackLoading) && !order && (
          <div className="bg-white rounded-3xl p-12 text-center space-y-3 border border-neutral-200 shadow-2xs">
            <Clock className="w-8 h-8 text-[var(--brand-primary)] animate-spin mx-auto" />
            <p className="text-xs text-neutral-500 font-medium">Connecting to live courier gateway...</p>
          </div>
        )}

        {orderError && !order && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-700">
            {getApiErrorMessage(orderError, 'Failed to load tracking details.')}
          </div>
        )}

        {order && (
          <>
            {/* AMAZON-GRADE LUXURY STATUS HERO CARD */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm relative overflow-hidden space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                      Live Delivery Status
                    </span>
                    {!isCancelled && (
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> On Schedule
                      </span>
                    )}
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[var(--brand-primary)]">
                    {isCancelled
                      ? 'Order Cancelled'
                      : activeStep === 5
                      ? 'Delivered to You 🎉'
                      : activeStep === 4
                      ? 'Out for Delivery Today 🚚'
                      : activeStep === 3
                      ? 'In Transit with Courier ✈️'
                      : activeStep === 2
                      ? 'Confirmed & Being Packed 📦'
                      : 'Order Received & Verified ✨'}
                  </h2>

                  <p className="text-xs sm:text-sm text-neutral-600">
                    {isCancelled
                      ? 'This order was cancelled. Refund processed to source payment method.'
                      : activeStep === 5
                      ? 'Your package has been successfully delivered to the recipient address.'
                      : activeStep === 4
                      ? 'Delhivery driver is out for delivery in your area.'
                      : activeStep === 3
                      ? `Parcel dispatched from warehouse and in transit via ${carrier}.`
                      : 'Our fulfillment center is carefully hand-inspecting and packing your luxury garments.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-[var(--brand-primary)] border border-sky-200 text-xs font-bold shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-[var(--brand-primary)]" />
                    <span>{carrier}</span>
                  </span>
                  {activeStep >= 3 && !isCancelled && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                      <Truck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Air Express</span>
                    </span>
                  )}
                </div>
              </div>

              {/* CANCELLATION NOTICE CARD */}
              {isCancelled && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 text-rose-900">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-rose-950">Shipment Cancelled</h4>
                      <p className="text-xs text-rose-800 leading-relaxed mt-0.5">
                        This order has been cancelled by the boutique.
                      </p>
                    </div>
                  </div>

                  {Boolean((order as any)?.cancelReason) && (
                    <div className="bg-white/90 border border-rose-200 rounded-xl p-3.5 text-2xs space-y-1">
                      <span className="font-bold text-rose-950 uppercase tracking-wider text-[10px] block">
                        Reason &amp; Refund Details:
                      </span>
                      <p className="text-neutral-800 leading-relaxed whitespace-pre-line">{String((order as any).cancelReason)}</p>
                    </div>
                  )}

                  <div className="text-2xs text-rose-900 bg-rose-100/70 border border-rose-200/80 rounded-xl p-2.5 flex items-center gap-2">
                    <span>💳</span>
                    <span><strong>Refund Notice:</strong> 100% of your paid amount will be refunded directly to your original payment account within 1 business day.</span>
                  </div>
                </div>
              )}

              {/* ESTIMATED ARRIVAL HERO BANNER (AMAZON STYLE) */}
              {!isCancelled && (
                <div className="bg-gradient-to-r from-sky-50 via-indigo-50/40 to-amber-50/30 border border-sky-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-white shadow-2xs border border-sky-100 text-[var(--brand-primary)] flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                        Estimated Delivery Arrival
                      </p>
                      <p className="text-base sm:text-lg font-bold text-neutral-900">
                        {liveDelhiveryData?.expectedDeliveryDate
                          ? new Date(liveDelhiveryData.expectedDeliveryDate).toLocaleDateString('en-IN', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Expected in 2–4 Business Days'}
                      </p>
                    </div>
                  </div>
                  {liveDelhiveryData?.statusLocation && (
                    <div className="text-left sm:text-right border-t sm:border-t-0 pt-2.5 sm:pt-0 border-sky-200/50">
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                        Last Checkpoint Location
                      </span>
                      <span className="text-xs font-bold text-neutral-800 flex items-center sm:justify-end gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[var(--brand-primary)]" /> {liveDelhiveryData.statusLocation}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 5-STEP INTERACTIVE PROGRESS STEPPER */}
              {!isCancelled && (
                <div className="pt-3 pb-2">
                  <div className="grid grid-cols-5 gap-2 text-center relative">
                    {/* Background Track Line */}
                    <div className="absolute top-4 left-[10%] right-[10%] h-1.5 bg-neutral-200 z-0 rounded-full" />
                    <div
                      className="absolute top-4 left-[10%] h-1.5 bg-gradient-to-r from-sky-600 to-[var(--brand-primary)] z-0 transition-all duration-700 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, (activeStep - 1) * 25))}%` }}
                    />

                  {/* Step 1: Ordered */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        activeStep >= 1
                          ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-md'
                          : 'bg-white text-neutral-400 border-neutral-300'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div className="space-y-0.5">
                      <p className={`text-xs font-bold ${activeStep >= 1 ? 'text-neutral-900' : 'text-neutral-400'}`}>
                        Ordered
                      </p>
                      <p className="text-[10px] text-neutral-400 hidden sm:block">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                      </p>
                    </div>
                  </div>

                  {/* Step 2: Confirmed & Packed */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        activeStep >= 2
                          ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-md'
                          : 'bg-white text-neutral-400 border-neutral-300'
                      }`}
                    >
                      {activeStep > 2 ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
                    </div>
                    <div className="space-y-0.5">
                      <p className={`text-xs font-bold ${activeStep >= 2 ? 'text-neutral-900' : 'text-neutral-400'}`}>
                        Packed
                      </p>
                      <p className="text-[10px] text-neutral-400 hidden sm:block">Fulfillment</p>
                    </div>
                  </div>

                  {/* Step 3: In Transit */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        activeStep >= 3
                          ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-md animate-pulse'
                          : 'bg-white text-neutral-400 border-neutral-300'
                      }`}
                    >
                      {activeStep > 3 ? <Check className="w-4 h-4 stroke-[3]" /> : <Truck className="w-4 h-4" />}
                    </div>
                    <div className="space-y-0.5">
                      <p className={`text-xs font-bold ${activeStep >= 3 ? 'text-neutral-900' : 'text-neutral-400'}`}>
                        In Transit
                      </p>
                      <p className="text-[10px] text-neutral-400 hidden sm:block">Delhivery Hub</p>
                    </div>
                  </div>

                  {/* Step 4: Out for Delivery */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        activeStep >= 4
                          ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-md'
                          : 'bg-white text-neutral-400 border-neutral-300'
                      }`}
                    >
                      {activeStep > 4 ? <Check className="w-4 h-4 stroke-[3]" /> : '4'}
                    </div>
                    <div className="space-y-0.5">
                      <p className={`text-xs font-bold ${activeStep >= 4 ? 'text-neutral-900' : 'text-neutral-400'}`}>
                        Out for Delivery
                      </p>
                      <p className="text-[10px] text-neutral-400 hidden sm:block">Local Courier</p>
                    </div>
                  </div>

                  {/* Step 5: Delivered */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        activeStep >= 5
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
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
            )}

              {/* WAYBILL BARCODE & TRACKING DETAILS STRIP */}
              {waybill ? (
                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                      Delhivery Tracking Waybill (AWB)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-neutral-900 text-sm bg-white px-3 py-1 rounded-lg border border-neutral-200">
                        {waybill}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyAwb(waybill)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white hover:bg-neutral-100 text-neutral-700 px-2.5 py-1.5 rounded-lg border border-neutral-200 transition-colors cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
                        <span>{copied ? 'Copied!' : 'Copy AWB'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-neutral-500 font-medium">Carrier Status:</span>
                    <span className="font-bold text-sky-900 bg-sky-100 px-3 py-1 rounded-lg border border-sky-200">
                      {liveDelhiveryData?.status || 'In Transit · Handed Over'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-amber-900">
                  <Package className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Your order is confirmed and currently being prepared at our dispatch facility. An automated Delhivery tracking number will appear once the courier scans your package.
                  </span>
                </div>
              )}
            </div>

            {/* TWO-COLUMN DETAILS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* LEFT: ACTIVITY HISTORY & LIVE SCANS (7 COLS) */}
              <div className="md:col-span-7 space-y-6">
                {/* DELHIVERY LIVE SCANS FEED */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[var(--brand-primary)]" />
                      Live Transit History &amp; Checkpoints
                    </h3>
                    <span className="text-[10px] text-neutral-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Scans
                    </span>
                  </div>

                  {scansList.length > 0 ? (
                    <div className="space-y-3">
                      {scansList.map((scan, i) => (
                        <div key={i} className="flex items-start gap-3 p-3.5 bg-neutral-50/80 rounded-2xl border border-neutral-150">
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
                        <div key={idx} className="flex items-start gap-3 p-3.5 bg-neutral-50/80 rounded-2xl border border-neutral-150">
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
                      <p className="text-[11px]">Checkpoints will update dynamically as the courier scans your package at sorting facilities.</p>
                    </div>
                  )}
                </div>

                {/* ITEMS IN THIS SHIPMENT */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200 shadow-2xs space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-800 flex items-center gap-2 border-b border-neutral-100 pb-3">
                    <ShoppingBag className="w-4 h-4 text-[var(--brand-primary)]" />
                    Items in Shipment ({order.items?.length || 0})
                  </h3>

                  <div className="divide-y divide-neutral-100">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="py-3.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                            <Image
                              src={item.productImage || item.product?.media?.[0]?.url || PLACEHOLDER_IMAGE}
                              alt={item.productName}
                              fill
                              sizes="56px"
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
              <div className="md:col-span-5 space-y-6">
                {/* DELIVERY DESTINATION CARD */}
                {shippingAddr && (
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200 shadow-2xs space-y-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-800 flex items-center gap-2 border-b border-neutral-100 pb-3">
                      <MapPin className="w-4 h-4 text-[var(--brand-primary)]" />
                      Delivery Destination
                    </h3>
                    <div className="text-xs space-y-1.5 text-neutral-700">
                      <p className="font-bold text-neutral-900 text-sm">{shippingAddr.fullName || shippingAddr.name}</p>
                      <p className="leading-relaxed text-neutral-600">
                        {[shippingAddr.addressLine1, shippingAddr.addressLine2, shippingAddr.city, shippingAddr.state]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      <p className="font-mono font-bold text-neutral-900 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200 inline-block text-2xs">
                        PIN: {shippingAddr.postalCode || shippingAddr.pincode}
                      </p>
                      {shippingAddr.phone && (
                        <p className="text-neutral-600 font-mono text-[11px] pt-1 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-neutral-400" /> {shippingAddr.phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* CUSTOMER CARE SUPPORT */}
                <div className="bg-gradient-to-br from-white to-sky-50/40 rounded-3xl p-5 border border-neutral-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-[var(--brand-primary)]" />
                    <h4 className="text-xs font-bold text-neutral-900">Need Delivery Assistance?</h4>
                  </div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Have any questions regarding delivery timing or courier tracking? Our dedicated support team is available to assist you.
                  </p>
                  <div className="pt-1 flex flex-col gap-2">
                    <Link
                      href="/contact"
                      className="w-full text-center py-2.5 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-xl text-xs font-bold text-neutral-800 transition-colors shadow-2xs"
                    >
                      Contact Support
                    </Link>
                  </div>
                </div>

                {/* BOTTOM NAVIGATION SHORTCUTS */}
                <div className="space-y-2 pt-1">
                  <Link
                    href={`/orders/details/${orderNumber}`}
                    className="block w-full text-center py-3 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-2xl text-xs font-bold text-neutral-800 transition-colors shadow-2xs"
                  >
                    View Order Details &amp; Invoice
                  </Link>
                  <Link
                    href="/orders"
                    className="block w-full text-center py-3 bg-[var(--brand-primary)] text-white hover:opacity-95 rounded-2xl text-xs font-bold transition-all shadow-xs"
                  >
                    View All Orders
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
