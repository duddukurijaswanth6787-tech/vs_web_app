'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Lock, User, Phone, Tag, CheckSquare, Square } from 'lucide-react';
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
    confirmPassword: '',
    gender: 'FEMALE',
    referralCode: '',
    agreeToTerms: false,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (key: string, value: unknown) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPhone = form.phone.replace(/\D/g, '');
    if (!form.phone || cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!form.agreeToTerms) {
      setError('You must agree to the Terms of Service & Privacy Policy to register.');
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
        gender: form.gender,
        referralCode: form.referralCode || undefined,
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

          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-neutral-700">First Name *</span>
              <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2.5">
                <User className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => onChange('firstName', e.target.value)}
                  className="flex-1 text-sm outline-none w-full"
                />
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-neutral-700">Last Name</span>
              <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2.5">
                <User className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => onChange('lastName', e.target.value)}
                  className="flex-1 text-sm outline-none w-full"
                />
              </div>
            </label>
          </div>

          {/* Email */}
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-neutral-700">Email Address *</span>
            <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2.5">
              <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => onChange('email', e.target.value)}
                className="flex-1 text-sm outline-none w-full"
              />
            </div>
          </label>

          {/* Mobile & Gender */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-neutral-700">10-Digit Mobile *</span>
              <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2.5">
                <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => onChange('phone', e.target.value)}
                  className="flex-1 text-sm outline-none w-full"
                />
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-neutral-700">Gender</span>
              <select
                value={form.gender}
                onChange={(e) => onChange('gender', e.target.value)}
                className="w-full text-xs border border-neutral-200 rounded-xl px-3 py-3 outline-none focus:border-[#800020] bg-white font-medium text-neutral-800"
              >
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OTHER">Other</option>
                <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
              </select>
            </label>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-neutral-700">Password *</span>
              <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2.5">
                <Lock className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => onChange('password', e.target.value)}
                  className="flex-1 text-sm outline-none w-full"
                />
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-neutral-700">Confirm Password *</span>
              <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2.5">
                <Lock className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={(e) => onChange('confirmPassword', e.target.value)}
                  className="flex-1 text-sm outline-none w-full"
                />
              </div>
            </label>
          </div>

          {/* Referral Code */}
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-neutral-700">Referral / Invite Code (Optional)</span>
            <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2.5">
              <Tag className="w-4 h-4 text-neutral-400 shrink-0" />
              <input
                type="text"
                placeholder="e.g. WELCOME100"
                value={form.referralCode}
                onChange={(e) => onChange('referralCode', e.target.value)}
                className="flex-1 text-sm outline-none w-full uppercase font-mono"
              />
            </div>
          </label>

          {/* Terms & Privacy Consent */}
          <div className="flex items-start gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => onChange('agreeToTerms', !form.agreeToTerms)}
              className="mt-0.5 text-[#800020] hover:scale-105 transition-transform"
            >
              {form.agreeToTerms ? (
                <CheckSquare className="w-4 h-4 text-[#800020]" />
              ) : (
                <Square className="w-4 h-4 text-neutral-300" />
              )}
            </button>
            <span className="text-xs text-neutral-600 leading-snug">
              I agree to Vasanthi Designers&apos;{' '}
              <Link href="/terms" className="text-[#800020] font-semibold underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-[#800020] font-semibold underline">
                Privacy Policy
              </Link>
              .
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#800020] hover:bg-[#600018] disabled:opacity-60 text-white text-sm font-bold py-3 rounded-xl transition-all shadow-md mt-2"
          >
            {loading ? 'Creating Account…' : 'Register'}
          </button>
        </form>
      </main>
      <StorefrontFooter />
    </div>
  );
}
