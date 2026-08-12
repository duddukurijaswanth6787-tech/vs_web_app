'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Truck, Globe, PackageCheck } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900 pb-16">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3 shadow-xs">
        <Link href="/" className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#800020]">Shipping & Delivery Policy</h1>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1 space-y-8">
        {/* Header Summary */}
        <div className="bg-rose-50/70 border border-rose-100 rounded-3xl p-6 space-y-2">
          <div className="flex items-center gap-2 text-[#800020] font-bold text-sm font-serif">
            <Truck className="w-5 h-5" />
            <span>Worldwide Insured Express Delivery</span>
          </div>
          <p className="text-xs text-neutral-700 leading-relaxed">
            We deliver luxury sarees and bridal wear safely to your doorstep across India and over 50 international destinations using premier courier partners like DTDC, DHL, and FedEx.
          </p>
        </div>

        {/* Timelines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-[#800020] font-bold text-sm">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <span>Domestic Shipping (India)</span>
            </div>
            <ul className="space-y-2 text-xs text-neutral-600">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-neutral-800">Ready-to-Ship Items:</span> Dispatched within 24-48 hours. Delivered in 3-5 business days.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-neutral-800">Pre-Order / Custom Blouse:</span> Dispatched within 7-10 business days.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-neutral-800">Shipping Cost:</span> FREE standard shipping on domestic orders above ₹2,999.
              </li>
            </ul>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-[#800020] font-bold text-sm">
              <Globe className="w-4 h-4 text-blue-600" />
              <span>International Shipping</span>
            </div>
            <ul className="space-y-2 text-xs text-neutral-600">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-neutral-800">Delivery Timeline:</span> 5-8 business days via DHL / FedEx Express.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-neutral-800">Customs & Duties:</span> Import duties or local taxes (if applicable) are paid directly by the recipient upon arrival.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-neutral-800">Order Tracking:</span> Real-time live AWB tracking links sent via email & SMS.
              </li>
            </ul>
          </div>
        </div>

        {/* Tracking Callout */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-serif font-bold text-base text-[#800020]">Have a shipment on the way?</h3>
            <p className="text-xs text-neutral-600">Enter your order ID or tracking number to check shipment status.</p>
          </div>
          <Link href="/track-order" className="bg-[#800020] text-white text-xs font-bold px-6 py-2.5 rounded-xl hover:bg-[#600018] shrink-0">
            Track Your Order
          </Link>
        </div>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
