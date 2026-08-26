'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Phone, Calendar, Save } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerProfile, customerKeys } from '@/features/customer/hooks';
import { customerMeService } from '@/features/customer/me.service';
import { getApiErrorMessage } from '@/utils/api-error';

export default function ProfileEditPage() {
  const router = useRouter();
  const { isAuthenticated, isInitializing, refetchUser } = useAuth();
  const { data } = useCustomerProfile(isAuthenticated);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    gender: 'FEMALE',
    dateOfBirth: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Tracks "have we filled the form from the server yet", NOT the identity of
  // `data`. Keying off identity meant that whenever React Query already had the
  // profile cached -- i.e. every time the customer returned to Edit after a
  // save -- `useState(data)` seeded prevData with that same object, the
  // `data !== prevData` check was false on the first render, and the form
  // rendered blank over a perfectly good profile.
  const [hydrated, setHydrated] = useState(false);

  if (!hydrated && data) {
    setHydrated(true);
    setForm({
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      phone: data.phone || '',
      gender: (data.gender as string) || 'FEMALE',
      // The API sends a full ISO timestamp ('2001-05-12T00:00:00.000Z');
      // <input type="date"> accepts only 'YYYY-MM-DD' and silently renders
      // blank for anything else, so the saved date looked lost.
      dateOfBirth: data.dateOfBirth ? String(data.dateOfBirth).slice(0, 10) : '',
    });
  }

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link href="/login?redirect=/profile/edit" className="text-sm font-bold text-[#0284c7]">
          Login required
        </Link>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await customerMeService.updateProfile(form);
      // refetchUser() only refreshes the auth user; the ['customer','profile']
      // cache this form reads from would still hold the pre-save values, so
      // reopening Edit prefilled the old ones.
      await queryClient.invalidateQueries({ queryKey: customerKeys.profile() });
      await refetchUser();
      router.push('/profile');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update profile'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/profile" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#0284c7]">Edit Personal Details</h1>
      </header>

      <main className="max-w-lg mx-auto w-full px-4 py-6 flex-1">
        <form onSubmit={onSubmit} className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-5 shadow-xs text-xs">
          {error && <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}

          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="font-semibold text-neutral-700">First Name *</span>
              <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2">
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="flex-1 text-xs outline-none w-full focus:ring-2 focus:ring-[#0284c7]/20 rounded px-1"
                />
              </div>
            </label>

            <label className="block space-y-1">
              <span className="font-semibold text-neutral-700">Last Name</span>
              <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2">
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="flex-1 text-xs outline-none w-full"
                />
              </div>
            </label>
          </div>

          {/* Phone & Gender */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="font-semibold text-neutral-700">Mobile Phone</span>
              <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2">
                <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="flex-1 text-xs outline-none w-full focus:ring-2 focus:ring-[#0284c7]/20 rounded px-1"
                />
              </div>
            </label>

            <label className="block space-y-1">
              <span className="font-semibold text-neutral-700">Gender</span>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full text-xs border border-neutral-200 rounded-xl px-2.5 py-2 outline-none focus:ring-2 focus:ring-[#0284c7] focus:border-[#0284c7] bg-white font-medium text-neutral-800 transition-all hover:border-neutral-300"
              >
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </label>
          </div>

          {/* Date of Birth */}
          <label className="block space-y-1">
            <span className="font-semibold text-neutral-700">Date of Birth</span>
            <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2">
              <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="flex-1 text-xs outline-none w-full"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0284c7] hover:bg-[#0B3B78] focus:outline-none focus:ring-2 focus:ring-[#0284c7] focus:ring-offset-2 active:scale-95 text-white text-sm font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2 mt-4"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving…' : 'Save Details'}</span>
          </button>
        </form>
      </main>
      <StorefrontFooter />
    </div>
  );
}
