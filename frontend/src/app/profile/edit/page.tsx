'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerProfile } from '@/features/customer/hooks';
import { customerMeService } from '@/features/customer/me.service';
import { getApiErrorMessage } from '@/utils/api-error';

export default function ProfileEditPage() {
  const router = useRouter();
  const { isAuthenticated, isInitializing, refetchUser } = useAuth();
  const { data } = useCustomerProfile(isAuthenticated);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || '',
      });
    }
  }, [data]);

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link href="/login?redirect=/profile/edit" className="text-sm font-bold text-[#800020]">
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
        <h1 className="text-lg font-bold font-serif text-[#800020]">Edit Profile</h1>
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-6 flex-1">
        <form onSubmit={onSubmit} className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-4">
          {error && <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
          {(['firstName', 'lastName', 'phone'] as const).map((key) => (
            <label key={key} className="block space-y-1.5">
              <span className="text-xs font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <input
                value={form[key]}
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
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </main>
      <StorefrontFooter />
    </div>
  );
}
