'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerAddresses, customerKeys } from '@/features/customer/hooks';
import { customerMeService } from '@/features/customer/me.service';
import { useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '@/utils/api-error';
import type { AddressDto } from '@/features/customer/me.service';

export default function AddressListPage() {
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
      qc.invalidateQueries({ queryKey: customerKeys.addresses });
    } catch (err) {
      setActionError(getApiErrorMessage(err));
    }
  };

  const router = useRouter();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push('/login?redirect=/checkout/address');
    }
  }, [isInitializing, isAuthenticated, router]);

  if (isInitializing || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--page-bg)] flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-neutral-200 rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-md animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[var(--brand-primary)] flex items-center justify-center mx-auto">
            <Plus className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-neutral-900 font-serif">Delivery Addresses</h3>
            <p className="text-xs text-neutral-500">Redirecting to login / account...</p>
          </div>
          <Link
            href="/login?redirect=/checkout/address"
            className="block w-full py-3 bg-[var(--brand-primary)] text-white rounded-xl text-xs font-bold hover:opacity-95 shadow-xs"
          >
            Click here to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col font-sans antialiased text-neutral-900 pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/cart" className="p-1 rounded-lg hover:bg-neutral-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold font-serif text-[var(--brand-primary)]">Addresses</h1>
        </div>
        <Link href="/checkout/address/add" className="text-xs font-bold text-[var(--brand-primary)] flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add
        </Link>
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-6 flex-1 space-y-3">
        {isLoading && <p className="text-sm text-neutral-500">Loading addresses…</p>}
        {error && <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>}
        {actionError && <p className="text-sm text-red-600">{actionError}</p>}
        {!isLoading && addresses.length === 0 && (
          <div className="bg-white border border-neutral-200 rounded-3xl p-8 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-sky-50 text-[var(--brand-primary)] flex items-center justify-center mx-auto">
              <Plus className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-neutral-900">No Saved Addresses Found</h3>
              <p className="text-xs text-neutral-500">Add a delivery address to complete your order</p>
            </div>
            <Link
              href="/checkout/address/add"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[var(--brand-primary)] text-white rounded-xl text-xs font-bold hover:opacity-95 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Delivery Address
            </Link>
          </div>
        )}
        {addresses.map((addr: AddressDto) => (
          <div key={addr.id} className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold">{addr.fullName}</p>
                <p className="text-xs text-neutral-600 mt-1">
                  {[addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.postalCode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                <p className="text-xs text-neutral-500 mt-1">{addr.phone}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/checkout/address/edit/${addr.id}`} className="p-1 text-neutral-500">
                  <Pencil className="w-4 h-4" />
                </Link>
                <button type="button" onClick={() => remove(addr.id)} className="p-1 text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <Link
              href={`/checkout?addressId=${addr.id}`}
              className="inline-block text-xs font-bold text-white bg-[var(--brand-primary)] px-3 py-1.5 rounded-lg"
            >
              Deliver here
            </Link>
          </div>
        ))}
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
