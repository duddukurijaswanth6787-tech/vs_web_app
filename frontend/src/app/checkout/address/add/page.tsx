'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { useAuth } from '@/hooks/useAuth';
import { usePincodeLookup } from '@/hooks/usePincodeLookup';
import { customerMeService } from '@/features/customer/me.service';
import { useQueryClient } from '@tanstack/react-query';
import { customerKeys } from '@/features/customer/hooks';
import { getApiErrorMessage } from '@/utils/api-error';

const empty = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  postalCode: '',
  city: '',
  state: '',
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
  const [pincodeFilled, setPincodeFilled] = useState(false);
  const { lookup: lookupPincode, isLoading: pincodeLoading, notFound: pincodeNotFound } = usePincodeLookup();

  const handlePostalCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setForm((f) => ({ ...f, postalCode: digits }));
    setPincodeFilled(false);
    if (digits.length === 6) {
      lookupPincode(digits).then((result) => {
        if (result) {
          setForm((f) => ({ ...f, city: result.city, state: result.state }));
          setPincodeFilled(true);
        }
      });
    }
  };

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link href="/login?redirect=/checkout/address/add" className="text-sm font-bold text-[var(--brand-primary)]">
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
    <div className="min-h-screen bg-[var(--page-bg)] flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/checkout/address" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[var(--brand-primary)]">Add Address</h1>
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-6 flex-1">
        <form onSubmit={onSubmit} className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-3">
          {error && <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
          {(Object.keys(empty) as Array<keyof typeof empty>)
            .filter((k) => k !== 'isDefaultShipping' && k !== 'country' && k !== 'postalCode')
            .map((key) => {
              // PIN Code goes first (typed before City/State so the lookup
              // below can auto-fill them) -- insert it right before Address
              // Line 2's next sibling, i.e. right after addressLine2.
              if (key === 'city') {
                return (
                  <React.Fragment key="postal-and-city">
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold">Postal Code</span>
                      <div className="relative">
                        <input
                          required
                          value={form.postalCode}
                          onChange={(e) => handlePostalCodeChange(e.target.value)}
                          placeholder="6-digit PIN — City & State fill in automatically"
                          inputMode="numeric"
                          maxLength={6}
                          className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 pr-9 text-sm outline-none"
                        />
                        {pincodeLoading && (
                          <Loader2 className="w-4 h-4 text-neutral-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                        )}
                        {!pincodeLoading && pincodeFilled && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2" />
                        )}
                      </div>
                      {pincodeNotFound && form.postalCode.length === 6 && (
                        <p className="text-[11px] text-amber-600 font-medium">Couldn&apos;t auto-detect this PIN — enter City &amp; State below.</p>
                      )}
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-semibold">City</span>
                      <input
                        required
                        value={form.city}
                        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                        className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                      />
                    </label>
                  </React.Fragment>
                );
              }
              return (
                <label key={key} className="block space-y-1">
                  <span className="text-xs font-semibold capitalize">{String(key).replace(/([A-Z])/g, ' $1')}</span>
                  <input
                    required={key !== 'addressLine2'}
                    value={String(form[key] || '')}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </label>
              );
            })}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--brand-primary)] text-white text-sm font-bold py-3 rounded-xl disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Save Address'}
          </button>
        </form>
      </main>
      <StorefrontFooter />
    </div>
  );
}
