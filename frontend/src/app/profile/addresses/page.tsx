'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Plus, Trash2, CheckCircle } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerAddresses } from '@/features/customer/hooks';
import { customerMeService, AddressDto } from '@/features/customer/me.service';
import { getApiErrorMessage } from '@/utils/api-error';
import { useQueryClient } from '@tanstack/react-query';

export default function AddressesPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { data, isLoading, error } = useCustomerAddresses(isAuthenticated);
  const queryClient = useQueryClient();

  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  });

  const addresses = useMemo<AddressDto[]>(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    const typed = data as unknown as { data?: AddressDto[] };
    if (Array.isArray(typed?.data)) return typed.data;
    return [];
  }, [data]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await customerMeService.createAddress(formData);
      queryClient.invalidateQueries({ queryKey: ['customer', 'address'] });
      setShowAddForm(false);
      setFormData({
        fullName: '',
        phone: '',
        streetAddress: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        isDefault: false,
      });
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Failed to save address'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await customerMeService.deleteAddress(id);
      queryClient.invalidateQueries({ queryKey: ['customer', 'address'] });
    } catch {
      // Handled quietly
    }
  };

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 bg-[#FDFBFB]">
        <MapPin className="w-10 h-10 text-neutral-300" />
        <p className="text-sm text-neutral-600">Login to view your saved addresses</p>
        <Link href="/login?redirect=/profile/addresses" className="bg-[#800020] text-white text-xs font-bold px-5 py-2.5 rounded-xl">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900 pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold font-serif text-[#800020]">Saved Addresses</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="flex items-center gap-1.5 bg-[#800020] text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-[#600018] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New</span>
        </button>
      </header>

      <main className="max-w-2xl mx-auto w-full px-4 py-6 flex-1 space-y-4">
        {showAddForm && (
          <form onSubmit={handleAddAddress} className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-[#800020]">New Delivery Address</h3>
            {formError && <p className="text-xs text-rose-600 font-medium">{formError}</p>}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Full Name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-[#800020]"
              />
              <input
                type="tel"
                required
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-[#800020]"
              />
            </div>

            <textarea
              required
              rows={2}
              placeholder="House/Flat No, Street, Landmark"
              value={formData.streetAddress}
              onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
              className="w-full text-xs px-3 py-2 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-[#800020]"
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-[#800020]"
              />
              <input
                type="text"
                required
                placeholder="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-[#800020]"
              />
              <input
                type="text"
                required
                placeholder="Pincode"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-neutral-200 rounded-xl focus:outline-hidden focus:border-[#800020]"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="rounded border-neutral-300 text-[#800020] focus:ring-[#800020]"
              />
              <label htmlFor="isDefault" className="text-xs text-neutral-700">Set as default delivery address</label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs font-semibold px-4 py-2 border border-neutral-200 rounded-xl hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="text-xs font-bold px-5 py-2 bg-[#800020] text-white rounded-xl hover:bg-[#600018] disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Save Address'}
              </button>
            </div>
          </form>
        )}

        {isLoading && <p className="text-sm text-neutral-500">Loading addresses…</p>}
        {error && <p className="text-sm text-rose-600">{getApiErrorMessage(error)}</p>}

        {!isLoading && addresses.length === 0 && !showAddForm && (
          <div className="text-center py-16 bg-white border border-neutral-200 rounded-2xl p-6 space-y-3">
            <MapPin className="w-10 h-10 mx-auto text-neutral-300" />
            <p className="text-sm font-semibold text-neutral-700">No saved addresses found</p>
            <p className="text-xs text-neutral-500">Add a delivery address to make checkout faster.</p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-block bg-[#800020] text-white text-xs font-bold px-5 py-2.5 rounded-xl"
            >
              Add First Address
            </button>
          </div>
        )}

        {addresses.map((addr) => (
          <div key={addr.id} className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-2 relative group hover:border-rose-200 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-neutral-900">{addr.fullName}</span>
                {addr.isDefault && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Default
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(addr.id)}
                className="text-neutral-400 hover:text-rose-600 p-1"
                title="Delete address"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              {addr.streetAddress}, {addr.city}, {addr.state} - {addr.postalCode}, {addr.country}
            </p>
            <p className="text-xs text-neutral-500 font-mono">Phone: {addr.phone}</p>
          </div>
        ))}
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
