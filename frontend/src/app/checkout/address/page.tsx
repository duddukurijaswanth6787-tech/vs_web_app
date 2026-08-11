'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerAddresses, customerKeys } from '@/features/customer/hooks';
import { customerMeService } from '@/features/customer/me.service';
import { useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '@/utils/api-error';

export default function AddressListPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { data, isLoading, error } = useCustomerAddresses(isAuthenticated);
  const qc = useQueryClient();
  const [actionError, setActionError] = useState('');

  const addresses = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
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

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link href="/login?redirect=/checkout/address" className="text-sm font-bold text-[#800020]">
          Login to manage addresses
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/cart" className="p-1 rounded-lg hover:bg-neutral-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold font-serif text-[#800020]">Addresses</h1>
        </div>
        <Link href="/checkout/address/add" className="text-xs font-bold text-[#800020] flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add
        </Link>
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-6 flex-1 space-y-3">
        {isLoading && <p className="text-sm text-neutral-500">Loading addresses…</p>}
        {error && <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>}
        {actionError && <p className="text-sm text-red-600">{actionError}</p>}
        {!isLoading && addresses.length === 0 && (
          <p className="text-sm text-neutral-500 text-center py-10">No saved addresses</p>
        )}
        {addresses.map((addr: any) => (
          <div key={addr.id} className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold">{addr.fullName || addr.name}</p>
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
              href={`/checkout/payment?addressId=${addr.id}`}
              className="inline-block text-xs font-bold text-white bg-[#800020] px-3 py-1.5 rounded-lg"
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
