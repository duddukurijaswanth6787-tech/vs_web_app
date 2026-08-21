'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MapPin, CheckCircle2, AlertCircle, Save, Phone, Tag } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerMeService, AddressDto } from '@/features/customer/me.service';
import { customerKeys } from '@/features/customer/hooks';
import { getApiErrorMessage } from '@/utils/api-error';

function EditAddressForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addressId = searchParams.get('id');

  const queryClient = useQueryClient();

  const { data: rawAddresses, isLoading } = useQuery({
    queryKey: customerKeys.address(),
    queryFn: () => customerMeService.getAddresses(),
  });

  const addresses: AddressDto[] = Array.isArray(rawAddresses)
    ? rawAddresses
    : (rawAddresses as unknown as { data?: AddressDto[] })?.data || [];

  const targetAddress = addresses.find((a) => a.id === addressId);

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    alternatePhone: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN',
    label: 'Home',
    addressType: 'HOME',
    isDefaultShipping: true,
    isDefaultBilling: false,
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (targetAddress) {
      const addr = targetAddress as unknown as Record<string, unknown>;
      setForm({
        fullName: targetAddress.fullName || '',
        phone: targetAddress.phone || '',
        alternatePhone: String(addr.alternatePhone || ''),
        addressLine1: targetAddress.addressLine1 || targetAddress.streetAddress || '',
        addressLine2: targetAddress.addressLine2 || '',
        landmark: String(addr.landmark || ''),
        city: targetAddress.city || '',
        state: targetAddress.state || '',
        postalCode: targetAddress.postalCode || '',
        country: targetAddress.country || 'IN',
        label: targetAddress.label || 'Home',
        addressType: String(addr.addressType || targetAddress.label || 'HOME').toUpperCase(),
        isDefaultShipping: targetAddress.isDefaultShipping ?? targetAddress.isDefault ?? true,
        isDefaultBilling: Boolean(addr.isDefaultBilling),
      });
    }
  }, [targetAddress]);

  const updateMutation = useMutation({
    mutationFn: (dto: Record<string, unknown>) =>
      addressId
        ? customerMeService.updateAddress(addressId, dto)
        : customerMeService.createAddress(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.address() });
      setSuccessMsg('Address saved successfully!');
      setTimeout(() => {
        router.push('/checkout/address');
      }, 1500);
    },
    onError: (err) => {
      setErrorMsg(getApiErrorMessage(err, 'Failed to save address'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    updateMutation.mutate(form);
  };

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/checkout/address" className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-neutral-700" />
        </Link>
        <h1 className="text-base font-bold font-serif text-[#800020]">
          {addressId ? 'Edit Shipping Address' : 'Add New Address'}
        </h1>
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-6 flex-1 space-y-5">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-neutral-400 font-medium">Loading address details...</div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-2xs space-y-4 text-xs">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 font-medium rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium rounded-xl">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Address Type (Enum HOME, WORK, OTHER) */}
            <div>
              <label className="block font-bold text-neutral-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-[#800020]" />
                <span>Address Type / Label</span>
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'HOME', label: 'Home' },
                  { id: 'WORK', label: 'Work' },
                  { id: 'OTHER', label: 'Other' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setForm({ ...form, label: type.label, addressType: type.id })}
                    className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                      form.addressType === type.id
                        ? 'bg-[#800020] text-white border-[#800020]'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name & Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Recipient Name"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl outline-none focus:border-[#800020]"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="10-digit mobile"
                  className="w-full px-3 py-2 border border-neutral-200 rounded-xl outline-none focus:border-[#800020]"
                />
              </div>
            </div>

            {/* Alternate Phone */}
            <div>
              <label className="block font-bold text-neutral-700 mb-1">Alternate Phone (Optional)</label>
              <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2">
                <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <input
                  type="tel"
                  value={form.alternatePhone}
                  onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })}
                  placeholder="Secondary mobile number"
                  className="w-full text-xs outline-none"
                />
              </div>
            </div>

            {/* Address Line 1 */}
            <div>
              <label className="block font-bold text-neutral-700 mb-1">Flat / House / Building / Street *</label>
              <input
                type="text"
                required
                value={form.addressLine1}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                placeholder="House No, Street Name, Area"
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl outline-none focus:border-[#800020]"
              />
            </div>

            {/* Address Line 2 */}
            <div>
              <label className="block font-bold text-neutral-700 mb-1">Address Line 2 (Optional)</label>
              <input
                type="text"
                value={form.addressLine2}
                onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                placeholder="Locality / Sector"
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl outline-none focus:border-[#800020]"
              />
            </div>

            {/* Landmark */}
            <div>
              <label className="block font-bold text-neutral-700 mb-1">Landmark / Directions (Optional)</label>
              <input
                type="text"
                value={form.landmark}
                onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                placeholder="Near Temple, Opposite Metro Station..."
                className="w-full px-3 py-2 border border-neutral-200 rounded-xl outline-none focus:border-[#800020]"
              />
            </div>

            {/* City, State & Pincode */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Hyderabad"
                  className="w-full px-2.5 py-2 border border-neutral-200 rounded-xl outline-none focus:border-[#800020]"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="Telangana"
                  className="w-full px-2.5 py-2 border border-neutral-200 rounded-xl outline-none focus:border-[#800020]"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">PIN Code *</label>
                <input
                  type="text"
                  required
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  placeholder="500001"
                  className="w-full px-2.5 py-2 border border-neutral-200 rounded-xl outline-none focus:border-[#800020]"
                />
              </div>
            </div>

            {/* Default Toggles */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefaultShipping"
                  checked={form.isDefaultShipping}
                  onChange={(e) => setForm({ ...form, isDefaultShipping: e.target.checked })}
                  className="rounded border-neutral-300 text-[#800020] focus:ring-[#800020]"
                />
                <label htmlFor="isDefaultShipping" className="font-bold text-neutral-800 cursor-pointer">
                  Set as default shipping address
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefaultBilling"
                  checked={form.isDefaultBilling}
                  onChange={(e) => setForm({ ...form, isDefaultBilling: e.target.checked })}
                  className="rounded border-neutral-300 text-[#800020] focus:ring-[#800020]"
                />
                <label htmlFor="isDefaultBilling" className="font-bold text-neutral-800 cursor-pointer">
                  Set as default billing address
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full bg-[#800020] hover:bg-[#600018] text-white font-bold py-3 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <Save className="w-4 h-4" />
              <span>{updateMutation.isPending ? 'Saving Address...' : 'Save Address'}</span>
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

export default function EditAddressPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-neutral-400">Loading address...</div>}>
      <EditAddressForm />
    </React.Suspense>
  );
}
