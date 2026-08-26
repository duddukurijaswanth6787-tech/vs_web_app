'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { useAuth } from '@/hooks/useAuth';
import { usePincodeLookup } from '@/hooks/usePincodeLookup';
import { useCustomerAddresses } from '@/features/customer/hooks';
import { customerMeService, AddressDto } from '@/features/customer/me.service';
import { useQueryClient } from '@tanstack/react-query';
import { customerKeys } from '@/features/customer/hooks';
import { getApiErrorMessage } from '@/utils/api-error';

interface EditAddressForm {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

const toForm = (a: AddressDto): EditAddressForm => ({
  fullName: a.fullName || '',
  phone: a.phone || '',
  addressLine1: typeof a.addressLine1 === 'string' ? a.addressLine1 : (a.streetAddress || ''),
  addressLine2: typeof a.addressLine2 === 'string' ? a.addressLine2 : '',
  city: a.city || '',
  state: a.state || '',
  postalCode: a.postalCode || '',
  country: typeof a.country === 'string' ? a.country : 'India',
});

export default function EditAddressPage() {
  const params = useParams();
  const id = String(params.id || '');
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();
  const { data } = useCustomerAddresses(isAuthenticated);
  const qc = useQueryClient();
  const [form, setForm] = useState<EditAddressForm | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pincodeFilled, setPincodeFilled] = useState(false);
  const { lookup: lookupPincode, isLoading: pincodeLoading, notFound: pincodeNotFound } = usePincodeLookup();

  const handlePostalCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setForm((f) => (f ? { ...f, postalCode: digits } : f));
    setPincodeFilled(false);
    if (digits.length === 6) {
      lookupPincode(digits).then((result) => {
        if (result) {
          setForm((f) => (f ? { ...f, city: result.city, state: result.state } : f));
          setPincodeFilled(true);
        }
      });
    }
  };

  const addresses = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    const typed = data as { data?: AddressDto[] };
    if (Array.isArray(typed?.data)) return typed.data;
    return [];
  }, [data]);

  const [prevLoadedId, setPrevLoadedId] = useState<string | null>(null);
  if (addresses.length > 0 && prevLoadedId !== id) {
    const found = addresses.find((a) => a.id === id);
    if (found) {
      setPrevLoadedId(id);
      setForm(toForm(found));
    }
  }

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link href={`/login?redirect=/checkout/address/edit/${id}`} className="text-sm font-bold text-[var(--brand-primary)]">
          Login required
        </Link>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setLoading(true);
    setError('');
    try {
      await customerMeService.updateAddress(id, {
        fullName: form.fullName,
        phone: form.phone,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        country: form.country || 'India',
      });
      qc.invalidateQueries({ queryKey: customerKeys.addresses });
      router.push('/checkout/address');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update address'));
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
        <h1 className="text-lg font-bold font-serif text-[var(--brand-primary)]">Edit Address</h1>
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-6 flex-1">
        {!form ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : (
          <form onSubmit={onSubmit} className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-3">
            {error && <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
            {(['fullName', 'phone', 'addressLine1', 'addressLine2'] as const).map((key) => (
              <label key={key} className="block space-y-1">
                <span className="text-xs font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <input
                  required={key !== 'addressLine2'}
                  value={form[key] || ''}
                  onChange={(e) => setForm((f) => (f ? { ...f, [key]: e.target.value } : f))}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                />
              </label>
            ))}

            {/* PIN Code first -- auto-fills City & State below */}
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

            {(['city', 'state'] as const).map((key) => (
              <label key={key} className="block space-y-1">
                <span className="text-xs font-semibold capitalize">{key}</span>
                <input
                  required
                  value={form[key] || ''}
                  onChange={(e) => setForm((f) => (f ? { ...f, [key]: e.target.value } : f))}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                />
              </label>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--brand-primary)] text-white text-sm font-bold py-3 rounded-xl disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Update Address'}
            </button>
          </form>
        )}
      </main>
      <StorefrontFooter />
    </div>
  );
}
