'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { customerAuthService } from '@/features/customer/auth.service';
import { getApiErrorMessage } from '@/utils/api-error';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await customerAuthService.forgotPassword(email);
      setMessage('If an account exists for this email, a reset link has been sent.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to send reset email'));
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
        <h1 className="text-lg font-bold font-serif text-[#0284c7]">Forgot Password</h1>
        <div className="w-6" />
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-8 flex-1">
        <form onSubmit={onSubmit} className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-4 shadow-xs">
          <p className="text-xs text-neutral-500">Enter your account email and we will send reset instructions.</p>
          {error && <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
          {message && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">{message}</p>}
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-neutral-700">Email</span>
            <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2.5">
              <Mail className="w-4 h-4 text-neutral-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 text-sm outline-none"
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0284c7] hover:bg-[#0B3B78] disabled:opacity-60 text-white text-sm font-bold py-3 rounded-xl"
          >
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>
      </main>
      <StorefrontFooter />
    </div>
  );
}
