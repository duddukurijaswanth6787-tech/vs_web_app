'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, Clock, Navigation } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

const STORES = [
  {
    id: 'hyderabad-flagship',
    name: "Vasanthi's Signature Flagship Boutique",
    city: 'Hyderabad',
    address: 'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
    phone: '+91 98765 43210',
    email: 'jubileehills@vasanthisignature.com',
    hours: 'Mon - Sun: 10:30 AM - 8:30 PM',
    mapUrl: 'https://maps.google.com',
  },
  {
    id: 'vijayawada-boutique',
    name: "Vasanthi's Signature Couture Salon",
    city: 'Vijayawada',
    address: 'M.G. Road, Opp. Gateway Hotel, Labbipet, Vijayawada, Andhra Pradesh 520010',
    phone: '+91 98765 43211',
    email: 'vijayawada@vasanthisignature.com',
    hours: 'Mon - Sun: 10:30 AM - 8:30 PM',
    mapUrl: 'https://maps.google.com',
  },
];

export default function StoresPage() {
  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col font-sans antialiased text-neutral-900 pb-16">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3 shadow-xs">
        <Link href="/" className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[var(--brand-primary)]">Store Locator</h1>
      </header>

      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1 space-y-8">
        <div className="bg-[#051426] text-white rounded-3xl p-6 sm:p-8 space-y-2">
          <span className="text-xs uppercase tracking-widest text-amber-300 font-bold">EXPERIENCE LUXURY IN PERSON</span>
          <h2 className="text-2xl font-bold font-serif">Visit Our Boutiques</h2>
          <p className="text-xs text-sky-100/80 leading-relaxed">
            Step into our sanctuary of bridal silks, custom drapes, and bespoke couture fitting salons.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {STORES.map((store) => (
            <div key={store.id} className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-4 shadow-xs hover:border-sky-200 transition-colors">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-primary)] bg-sky-50 px-2.5 py-0.5 rounded-full">
                  {store.city} Store
                </span>
                <h3 className="font-serif font-bold text-base text-neutral-900">{store.name}</h3>
              </div>

              <div className="space-y-2.5 text-xs text-neutral-600">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[var(--brand-primary)] shrink-0 mt-0.5" />
                  <span>{store.address}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[var(--brand-primary)] shrink-0" />
                  <span className="font-mono">{store.phone}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[var(--brand-primary)] shrink-0" />
                  <span>{store.hours}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <a
                  href={store.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[var(--brand-primary)] text-white text-xs font-bold py-2.5 rounded-xl text-center hover:bg-[var(--brand-primary-dark)] flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Get Directions</span>
                </a>
                <Link
                  href="/contact"
                  className="px-4 py-2.5 border border-neutral-300 text-xs font-bold text-neutral-800 rounded-xl hover:bg-neutral-50"
                >
                  Book Visit
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
