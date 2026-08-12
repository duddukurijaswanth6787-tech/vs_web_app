'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Tag, Ticket } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useActiveCoupons, useActiveOffers } from '@/features/customer/hooks';
import { formatInr } from '@/features/customer/mappers';
import { getApiErrorMessage } from '@/utils/api-error';

interface OfferItem {
  id: string;
  name?: string;
  title?: string;
  description?: string;
}

interface CouponItem {
  id: string;
  code: string;
  name?: string;
  description?: string;
  minOrderAmount?: string | number;
  type?: string;
  value?: string | number;
}

export default function OffersPage() {
  const offers = useActiveOffers();
  const coupons = useActiveCoupons();

  const offerList: OfferItem[] = useMemo(() => {
    const d = offers.data;
    if (Array.isArray(d)) return d as unknown as OfferItem[];
    if (d && typeof d === 'object' && 'data' in d && Array.isArray((d as { data?: unknown }).data)) return (d as { data: OfferItem[] }).data;
    return [];
  }, [offers.data]);

  const couponList: CouponItem[] = useMemo(() => {
    const d = coupons.data;
    if (d && typeof d === 'object' && 'data' in d && Array.isArray((d as { data?: unknown }).data)) return (d as { data: CouponItem[] }).data;
    if (Array.isArray(d)) return d as unknown as CouponItem[];
    return [];
  }, [coupons.data]);

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#800020]">Offers & Coupons</h1>
      </header>

      <main className="max-w-3xl mx-auto w-full px-4 py-6 flex-1 space-y-6">
        {(offers.isLoading || coupons.isLoading) && (
          <p className="text-sm text-neutral-500">Loading offers…</p>
        )}
        {(offers.error || coupons.error) && (
          <p className="text-sm text-red-600">
            {getApiErrorMessage(offers.error || coupons.error)}
          </p>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#800020]" /> Active Offers
          </h2>
          {offerList.length === 0 && !offers.isLoading && (
            <p className="text-xs text-neutral-500">No active offers right now</p>
          )}
          {offerList.map((offer) => (
            <div key={offer.id} className="bg-white border border-rose-100 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-[#800020]">{offer.name || offer.title}</h3>
              <p className="text-xs text-neutral-600 mt-1">{offer.description}</p>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Ticket className="w-4 h-4 text-[#800020]" /> Coupons
          </h2>
          {couponList.length === 0 && !coupons.isLoading && (
            <p className="text-xs text-neutral-500">No coupons available</p>
          )}
          {couponList.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-dashed border-[#800020]/40 rounded-2xl p-4 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-extrabold tracking-wider text-[#800020]">{c.code}</p>
                <p className="text-xs text-neutral-600 mt-1">{c.name || c.description}</p>
                {c.minOrderAmount && (
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Min order {formatInr(Number(c.minOrderAmount))}
                  </p>
                )}
              </div>
              <span className="text-xs font-bold bg-rose-50 text-[#800020] px-2 py-1 rounded-lg">
                {c.type === 'PERCENTAGE' ? `${c.value}%` : formatInr(Number(c.value))}
              </span>
            </div>
          ))}
        </section>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
