'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Home, Briefcase, MapPin } from 'lucide-react';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { useAuth } from '@/hooks/useAuth';
import { customerMeService } from '@/features/customer/me.service';
import { useQueryClient } from '@tanstack/react-query';
import { customerKeys } from '@/features/customer/hooks';
import { getApiErrorMessage } from '@/utils/api-error';

const initialForm = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  label: 'Home',
  isDefaultShipping: true,
};

export default function ProfileAddAddressPage() {
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link href="/login?redirect=/profile/addresses/add" className="text-sm font-bold text-[#800020]">
          Login required
        </Link>
      </div>
    );
  }

  const validateField = (field: string, val: string) => {
    if (field === 'addressLine2') return '';
    if (!val || !val.trim()) return 'This field is required';
    if (field === 'phone' && val.replace(/\D/g, '').length !== 10) {
      return 'Enter a valid 10-digit mobile number';
    }
    if (field === 'postalCode' && val.replace(/\D/g, '').length !== 6) {
      return 'Enter a valid 6-digit PIN code';
    }
    return '';
  };

  const getFieldError = (field: keyof typeof initialForm) => {
    if (!touched[field]) return '';
    return validateField(field, String(form[field] || ''));
  };

  const handleBlur = (field: string) => {
    setTouched((t) => ({ ...t, [field]: true }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mark all required as touched
    const newTouched: Record<string, boolean> = {};
    let hasError = false;
    (Object.keys(initialForm) as Array<keyof typeof initialForm>).forEach((k) => {
      newTouched[k] = true;
      if (validateField(k, String(form[k] || ''))) {
        hasError = true;
      }
    });
    setTouched(newTouched);

    if (hasError) {
      setError('Please fix the validation errors before saving.');
      return;
    }

    setLoading(true);
    try {
      await customerMeService.createAddress(form);
      qc.invalidateQueries({ queryKey: customerKeys.address() });
      router.push('/profile/addresses');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save address'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <StorefrontHeader />

      <main className="max-w-md mx-auto w-full px-4 py-6 flex-1">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/profile/addresses" className="p-1 rounded-lg hover:bg-neutral-100">
            <ArrowLeft className="w-5 h-5 text-neutral-700" />
          </Link>
          <h1 className="text-lg font-bold font-serif text-[#800020]">Add New Address</h1>
        </div>

        <form onSubmit={onSubmit} className="bg-white border border-neutral-200/90 rounded-3xl p-6 space-y-4 shadow-xs">
          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          {/* Address Label Selector (Home / Work / Other) */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-neutral-700">Address Type</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Home', icon: Home },
                { label: 'Work', icon: Briefcase },
                { label: 'Other', icon: MapPin },
              ].map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, label }))}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    form.label === label
                      ? 'border-[#800020] bg-rose-50/70 text-[#800020]'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-neutral-700">Full Name <span className="text-rose-600">*</span></span>
            <input
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              onBlur={() => handleBlur('fullName')}
              placeholder="Recipient's full name"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors ${
                getFieldError('fullName') ? 'border-red-400 bg-red-50/30' : 'border-neutral-200'
              }`}
            />
            {getFieldError('fullName') && (
              <p className="text-[11px] text-red-600 font-medium">{getFieldError('fullName')}</p>
            )}
          </label>

          {/* Phone */}
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-neutral-700">Mobile Number <span className="text-rose-600">*</span></span>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              onBlur={() => handleBlur('phone')}
              placeholder="10-digit mobile number"
              inputMode="numeric"
              maxLength={10}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors ${
                getFieldError('phone') ? 'border-red-400 bg-red-50/30' : 'border-neutral-200'
              }`}
            />
            {getFieldError('phone') && (
              <p className="text-[11px] text-red-600 font-medium">{getFieldError('phone')}</p>
            )}
          </label>

          {/* Address Line 1 */}
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-neutral-700">Flat, House no., Building, Street <span className="text-rose-600">*</span></span>
            <input
              value={form.addressLine1}
              onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
              onBlur={() => handleBlur('addressLine1')}
              placeholder="Street address line 1"
              className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors ${
                getFieldError('addressLine1') ? 'border-red-400 bg-red-50/30' : 'border-neutral-200'
              }`}
            />
            {getFieldError('addressLine1') && (
              <p className="text-[11px] text-red-600 font-medium">{getFieldError('addressLine1')}</p>
            )}
          </label>

          {/* Address Line 2 */}
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-neutral-700">Area, Colony, Sector, Village (Optional)</span>
            <input
              value={form.addressLine2}
              onChange={(e) => setForm((f) => ({ ...f, addressLine2: e.target.value }))}
              placeholder="Landmark or area"
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none"
            />
          </label>

          {/* City & State Grid */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-neutral-700">City <span className="text-rose-600">*</span></span>
              <input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                onBlur={() => handleBlur('city')}
                placeholder="City"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors ${
                  getFieldError('city') ? 'border-red-400 bg-red-50/30' : 'border-neutral-200'
                }`}
              />
              {getFieldError('city') && (
                <p className="text-[11px] text-red-600 font-medium">{getFieldError('city')}</p>
              )}
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-neutral-700">State <span className="text-rose-600">*</span></span>
              <input
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                onBlur={() => handleBlur('state')}
                placeholder="State"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors ${
                  getFieldError('state') ? 'border-red-400 bg-red-50/30' : 'border-neutral-200'
                }`}
              />
              {getFieldError('state') && (
                <p className="text-[11px] text-red-600 font-medium">{getFieldError('state')}</p>
              )}
            </label>
          </div>

          {/* Postal Code & Country */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-neutral-700">PIN Code <span className="text-rose-600">*</span></span>
              <input
                value={form.postalCode}
                onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                onBlur={() => handleBlur('postalCode')}
                placeholder="6-digit PIN"
                inputMode="numeric"
                maxLength={6}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition-colors ${
                  getFieldError('postalCode') ? 'border-red-400 bg-red-50/30' : 'border-neutral-200'
                }`}
              />
              {getFieldError('postalCode') && (
                <p className="text-[11px] text-red-600 font-medium">{getFieldError('postalCode')}</p>
              )}
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-semibold text-neutral-700">Country</span>
              <input
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                className="w-full border border-neutral-200 bg-neutral-50 rounded-xl px-3 py-2.5 text-sm outline-none text-neutral-700 font-medium"
              />
            </label>
          </div>

          {/* Set as Default Address Checkbox */}
          <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefaultShipping}
              onChange={(e) => setForm((f) => ({ ...f, isDefaultShipping: e.target.checked }))}
              className="w-4 h-4 accent-[#800020] rounded-md"
            />
            <span className="text-xs font-semibold text-neutral-800">Set as default delivery address</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#800020] hover:bg-[#600018] text-white text-sm font-bold py-3.5 rounded-xl disabled:opacity-60 transition-all shadow-xs"
          >
            {loading ? 'Saving…' : 'Save Address'}
          </button>
        </form>
      </main>
      <StorefrontFooter />
    </div>
  );
}
