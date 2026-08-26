'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerAddresses, customerKeys } from '@/features/customer/hooks';
import { customerMeService } from '@/features/customer/me.service';
import { useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '@/utils/api-error';
import type { AddressDto } from '@/features/customer/me.service';

export default function ProfileAddressListPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { data, isLoading, error } = useCustomerAddresses(isAuthenticated);
  const qc = useQueryClient();
  const [actionError, setActionError] = useState('');

  const addresses = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    const typed = data as { data?: unknown[] };
    if (Array.isArray(typed?.data)) return typed.data as never[];
    return [];
  }, [data]);

  const remove = async (id: string) => {
    setActionError('');
    try {
      await customerMeService.deleteAddress(id);
      qc.invalidateQueries({ queryKey: customerKeys.address() });
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4">
        <MapPin className="w-10 h-10 text-neutral-300" />
        <p className="text-sm text-neutral-600">Login to manage your addresses</p>
        <Link href="/login?redirect=/profile/addresses" className="bg-[var(--brand-primary)] text-white text-xs font-bold px-5 py-2.5 rounded-xl">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col font-sans antialiased text-neutral-900">
      <StorefrontHeader />

      <main className="max-w-md mx-auto w-full px-4 py-6 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/profile" className="p-1 rounded-lg hover:bg-neutral-100">
              <ArrowLeft className="w-5 h-5 text-neutral-700" />
            </Link>
            <h1 className="text-lg font-bold font-serif text-[var(--brand-primary)]">Address Book</h1>
          </div>

          <Link
            href="/profile/addresses/add"
            className="inline-flex items-center gap-1 bg-[var(--brand-primary)] text-white text-xs font-bold px-3 py-2 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add New
          </Link>
        </div>

        {isLoading && <p className="text-sm text-neutral-500">Loading addresses…</p>}
        {error && <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>}
        {actionError && <p className="text-sm text-red-600">{actionError}</p>}

        {!isLoading && addresses.length === 0 && (
          <div className="text-center py-12 space-y-3 bg-white border border-neutral-200/80 rounded-3xl p-6">
            <MapPin className="w-8 h-8 text-neutral-300 mx-auto" />
            <p className="text-sm font-semibold text-neutral-600">No saved addresses yet</p>
            <Link
              href="/profile/addresses/add"
              className="inline-block bg-[var(--brand-primary)] text-white text-xs font-bold px-4 py-2.5 rounded-xl"
            >
              Add First Address
            </Link>
          </div>
        )}

        {addresses.map((addr: AddressDto) => (
          <div key={addr.id} className="bg-white border border-neutral-200/90 rounded-2xl p-4 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-900">{addr.fullName}</span>
                {Boolean(addr.label) && (
                  <span className="text-[10px] font-extrabold uppercase bg-sky-50 text-[var(--brand-primary)] px-2 py-0.5 rounded-md">
                    {String(addr.label)}
                  </span>
                )}
                {Boolean(addr.isDefaultShipping) && (
                  <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                    Default
                  </span>
                )}
              </div>
              <button
                onClick={() => remove(addr.id)}
                className="text-xs text-neutral-400 hover:text-red-600 p-1"
                aria-label="Delete address"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              {String(addr.addressLine1 || addr.streetAddress || '')}
              {addr.addressLine2 ? `, ${String(addr.addressLine2)}` : ''}, {String(addr.city || '')}, {String(addr.state || '')} - {String(addr.postalCode || '')}
            </p>
            {Boolean(addr.phone) && <p className="text-xs text-neutral-500">Phone: {String(addr.phone)}</p>}
          </div>
        ))}
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
