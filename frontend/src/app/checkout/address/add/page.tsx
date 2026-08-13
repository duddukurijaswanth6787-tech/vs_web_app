'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { useAuth } from '@/hooks/useAuth';
import { customerMeService } from '@/features/customer/me.service';
import { useQueryClient } from '@tanstack/react-query';
import { customerKeys } from '@/features/customer/hooks';
import { getApiErrorMessage } from '@/utils/api-error';

const empty = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  isDefaultShipping: true,
};

export default function AddAddressPage() {
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link href="/login?redirect=/checkout/address/add" className="text-sm font-bold text-[#800020]">
          Login required
        </Link>
      </div>
    );
  }

  const validateField = (key: string, val: string) => {
    if (key === 'addressLine2') return '';
    if (!val || !val.trim()) return 'This field is required';
    if (key === 'phone' && val.replace(/\D/g, '').length !== 10) return '10-digit phone required';
    if (key === 'postalCode' && val.replace(/\D/g, '').length !== 6) return '6-digit PIN required';
    return '';
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let hasErr = false;
    (Object.keys(empty) as Array<keyof typeof empty>).forEach((k) => {
      if (validateField(k, String(form[k] || ''))) hasErr = true;
    });

    if (hasErr) {
      setError('Please fill in all required address fields correctly.');
      return;
    }

    setLoading(true);
    try {
      await customerMeService.createAddress(form);
      qc.invalidateQueries({ queryKey: customerKeys.address() });
      router.push('/checkout/address');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save address'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/checkout/address" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#800020]">Add Address</h1>
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-6 flex-1">
        <form onSubmit={onSubmit} className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-3">
          {error && <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
          {(Object.keys(empty) as Array<keyof typeof empty>)
            .filter((k) => k !== 'isDefaultShipping' && k !== 'country')
            .map((key) => (
              <label key={key} className="block space-y-1">
                <span className="text-xs font-semibold capitalize">{String(key).replace(/([A-Z])/g, ' $1')}</span>
                <input
                  required={key !== 'addressLine2'}
                  value={String(form[key] || '')}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                />
              </label>
            ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#800020] text-white text-sm font-bold py-3 rounded-xl disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Save Address'}
          </button>
        </form>
      </main>
      <StorefrontFooter />
    </div>
  );
}
