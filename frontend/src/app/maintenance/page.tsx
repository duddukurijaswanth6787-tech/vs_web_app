'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, Phone, Mail, Home } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { usePublicSettings } from '@/features/customer/hooks';
import { getApiErrorMessage } from '@/utils/api-error';

export default function MaintenancePage() {
  const { data: settings, isLoading, error } = usePublicSettings();

  const storeName = settings?.storeName || 'Vasanthi Designers';
  const message =
    settings?.storeDescription ||
    settings?.metaDescription ||
    'We are currently updating our boutique storefront. Please check back shortly.';
  const phone = settings?.supportPhone || settings?.whatsappNumber;
  const email = settings?.supportEmail;
  const hours = settings?.supportHours;
  const inMaintenance = settings?.maintenanceMode !== false;

  return (
    <div className="w-full min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 text-center shadow-2xs">
        <h1 className="text-xl font-bold font-serif text-[#800020] tracking-tight">
          {storeName}
        </h1>
      </header>

      <main className="max-w-md mx-auto px-4 py-16 flex-1 w-full text-center space-y-6 flex flex-col items-center justify-center">
        {isLoading && <p className="text-sm text-neutral-500">Loading store status…</p>}
        {error && (
          <p className="text-sm text-red-600">{getApiErrorMessage(error, 'Unable to load store settings')}</p>
        )}

        <div className="w-20 h-20 rounded-full bg-rose-100 text-[#800020] flex items-center justify-center mx-auto border border-rose-200">
          <Clock className="w-8 h-8 text-[#800020]" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-[#800020] uppercase tracking-wider bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
            {inMaintenance ? 'Store Under Maintenance' : 'Store Status'}
          </span>
          <h2 className="text-2xl font-bold font-serif text-neutral-900 pt-2">
            {inMaintenance ? "We'll Be Back Soon!" : 'Store is Open'}
          </h2>
          <p className="text-xs text-neutral-500 font-medium max-w-xs mx-auto leading-relaxed">
            {message}
          </p>
        </div>

        {(phone || email || hours) && (
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 text-xs space-y-2 shadow-2xs w-full text-left">
            <h3 className="font-bold text-neutral-900 text-center">Need Assistance?</h3>
            {phone && (
              <p className="text-neutral-600 flex items-center gap-2 justify-center">
                <Phone className="w-3.5 h-3.5 text-[#800020]" />
                <a href={`tel:${phone}`} className="font-bold text-[#800020]">
                  {phone}
                </a>
              </p>
            )}
            {email && (
              <p className="text-neutral-600 flex items-center gap-2 justify-center">
                <Mail className="w-3.5 h-3.5 text-[#800020]" />
                <a href={`mailto:${email}`} className="font-bold text-[#800020]">
                  {email}
                </a>
              </p>
            )}
            {hours && <p className="text-neutral-500 text-center">{hours}</p>}
          </div>
        )}

        {!inMaintenance && (
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#800020] text-white text-xs font-bold px-5 py-2.5 rounded-xl"
          >
            <Home className="w-3.5 h-3.5" /> Continue Shopping
          </Link>
        )}
      </main>

      <StorefrontFooter />
    </div>
  );
}
