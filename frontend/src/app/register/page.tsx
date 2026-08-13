'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Lock, User, Phone } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { customerAuthService } from '@/features/customer/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/utils/api-error';

export default function RegisterPage() {
  const router = useRouter();
  const { completeTokenLogin } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPhone = form.phone.replace(/\D/g, '');
    if (!form.phone || cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      await customerAuthService.register({
        firstName: form.firstName,
        lastName: form.lastName || undefined,
        email: form.email,
        phone: cleanPhone,
        password: form.password,
      });
      await completeTokenLogin();
      router.push('/');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
        <Link href="/login" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#800020]">Create Account</h1>
        <div className="w-6" />
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-8 flex-1">
        <form onSubmit={onSubmit} className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-4 shadow-xs">
          {error && <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}

          {[
            { key: 'firstName', label: 'First name', icon: User, required: true },
            { key: 'lastName', label: 'Last name', icon: User },
            { key: 'email', label: 'Email', icon: Mail, type: 'email', required: true },
            { key: 'phone', label: '10-digit Mobile Number', icon: Phone, required: true },
            { key: 'password', label: 'Password', icon: Lock, type: 'password', required: true },
          ].map((field) => (
            <label key={field.key} className="block space-y-1.5">
              <span className="text-xs font-semibold text-neutral-700">{field.label}</span>
              <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2.5">
                <field.icon className="w-4 h-4 text-neutral-400" />
                <input
                  type={field.type || 'text'}
                  required={field.required}
                  value={form[field.key as keyof typeof form] || ''}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className="flex-1 text-sm outline-none"
                />
              </div>
            </label>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#800020] hover:bg-[#600018] disabled:opacity-60 text-white text-sm font-bold py-3 rounded-xl"
          >
            {loading ? 'Creating…' : 'Register'}
          </button>
        </form>
      </main>
      <StorefrontFooter />
    </div>
  );
}
