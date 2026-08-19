'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Lock, Phone, Mail, ShieldCheck } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { customerAuthService } from '@/features/customer/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/utils/api-error';
import { sendFirebasePhoneOtp, resetRecaptcha } from '@/lib/firebase/phoneAuth';
import type { ConfirmationResult } from 'firebase/auth';

const RECAPTCHA_CONTAINER_ID = 'firebase-recaptcha-container';

function getFirebaseAuthErrorMessage(err: unknown, fallback: string): string {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case 'auth/invalid-phone-number':
      return 'That doesn’t look like a valid mobile number.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a bit before trying again.';
    case 'auth/quota-exceeded':
      return 'SMS limit reached for this project right now. Please try again later.';
    case 'auth/invalid-verification-code':
      return 'That code is incorrect. Please check and try again.';
    case 'auth/code-expired':
      return 'This code has expired. Request a new one.';
    default:
      return err instanceof Error ? err.message : fallback;
  }
}

function CustomerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { completeTokenLogin, login, refetchUser } = useAuth();

  const [authMode, setAuthMode] = useState<'PHONE' | 'EMAIL'>('PHONE');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const normalizedPhone = useMemo(() => phone.replace(/\D/g, '').slice(-10), [phone]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (normalizedPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setIsLoading(true);
    try {
      // Firebase handles the actual SMS delivery + reCAPTCHA challenge here.
      const result = await sendFirebasePhoneOtp(`+91${normalizedPhone}`, RECAPTCHA_CONTAINER_ID);
      setConfirmationResult(result);
      setOtpSent(true);
    } catch (err) {
      resetRecaptcha();
      setError(getFirebaseAuthErrorMessage(err, 'Failed to send OTP'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!confirmationResult) {
      setError('Please request a new OTP.');
      setOtpSent(false);
      return;
    }
    setIsLoading(true);
    try {
      // Firebase checks the code itself; this just gets us the signed ID
      // token proving that check passed, for the backend to re-verify.
      const credential = await confirmationResult.confirm(otp);
      const idToken = await credential.user.getIdToken();
      await customerAuthService.loginWithFirebasePhone({
        idToken,
        rememberMe: true,
      });
      const profileResult = await completeTokenLogin() as { data?: { roles?: string[] } | null };
      const profile = profileResult?.data;

      const isPosOnly = profile?.roles?.some((r: string) => ['pos_operator', 'pos_staff'].includes(r));
      const isAdminOrSuperAdmin = profile?.roles?.some((r: string) => ['admin', 'super_admin'].includes(r));
      const isPlainStaff = profile?.roles?.includes('staff');
      const isStaffUser = isAdminOrSuperAdmin || isPosOnly || isPlainStaff;

      if (profile && isStaffUser) {
        // Billing-only staff land straight on the standalone POS screen, not
        // the admin console — see app/pos/layout.tsx.
        let destination = isAdminOrSuperAdmin ? '/admin/dashboard' : '/pos';
        if (redirectTo !== '/') destination = redirectTo;
        router.push(destination);
      } else {
        router.push(redirectTo);
      }
    } catch (err) {
      // A firebase/auth error (wrong code, expired) has a `.code`; anything
      // past that point is our own backend rejecting the ID token.
      const message = (err as { code?: string })?.code
        ? getFirebaseAuthErrorMessage(err, 'OTP login failed')
        : getApiErrorMessage(err, 'OTP login failed');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login({ email, password });
      const profileResult = await refetchUser() as { data?: { roles?: string[] } | null };
      const profile = profileResult?.data;
      const isPosOnly = profile?.roles?.some((r: string) => ['pos_operator', 'pos_staff'].includes(r));
      const isAdminOrSuperAdmin = profile?.roles?.some((r: string) => ['admin', 'super_admin'].includes(r));
      const isPlainStaff = profile?.roles?.includes('staff');
      const isStaffUser = isAdminOrSuperAdmin || isPosOnly || isPlainStaff;

      if (profile && isStaffUser) {
        // Billing-only staff land straight on the standalone POS screen, not
        // the admin console — see app/pos/layout.tsx.
        let destination = isAdminOrSuperAdmin ? '/admin/dashboard' : '/pos';
        if (redirectTo !== '/') destination = redirectTo;
        router.push(destination);
      } else {
        router.push(redirectTo);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div suppressHydrationWarning className="w-full max-w-full overflow-x-hidden min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <header suppressHydrationWarning className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center justify-between shadow-2xs">
        <Link href="/" className="p-1 text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Image src="/brand/logo-full.png" alt="Vasanthi's Signature" width={1400} height={803} className="h-9 w-auto object-contain" />
        <div className="w-6" />
      </header>

      <main suppressHydrationWarning className="max-w-md mx-auto px-4 py-8 flex-1 w-full space-y-6">
        <div className="text-center space-y-1">
          <Image src="/brand/logo-full.png" alt="Vasanthi's Signature" width={1400} height={803} className="h-14 w-auto object-contain mx-auto mb-3" />
          <span className="text-xs font-bold text-[#800020] uppercase tracking-wider bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
            Welcome Back
          </span>
          <h2 className="text-2xl font-bold font-serif text-neutral-900 pt-2">Login to Your Account</h2>
          <p className="text-xs text-neutral-500 font-medium">
            Access your orders, saved addresses & loyalty rewards
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-neutral-200/90 p-6 space-y-5 shadow-xs">
          <div className="flex items-center p-1 bg-neutral-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setAuthMode('PHONE');
                setOtpSent(false);
                setConfirmationResult(null);
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                authMode === 'PHONE' ? 'bg-[#800020] text-white shadow-2xs' : 'text-neutral-600'
              }`}
            >
              Mobile Number (OTP)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('EMAIL');
                setOtpSent(false);
                setConfirmationResult(null);
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                authMode === 'EMAIL' ? 'bg-[#800020] text-white shadow-2xs' : 'text-neutral-600'
              }`}
            >
              Email & Password
            </button>
          </div>

          {error && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
          {/* Invisible reCAPTCHA host for Firebase Phone Auth -- must be in the DOM before sendFirebasePhoneOtp() runs. */}
          <div id={RECAPTCHA_CONTAINER_ID} />

          {authMode === 'PHONE' ? (
            !otpSent ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-neutral-700">Mobile Number</span>
                  <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2.5">
                    <Phone className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-500">+91</span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 text-sm outline-none"
                      placeholder="10-digit mobile"
                      inputMode="numeric"
                      maxLength={10}
                    />
                  </div>
                </label>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#800020] hover:bg-[#600018] disabled:opacity-60 text-white text-sm font-bold py-3 rounded-xl"
                >
                  {isLoading ? 'Sending…' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyAndLogin} className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-neutral-700">Enter OTP</span>
                  <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2.5">
                    <ShieldCheck className="w-4 h-4 text-neutral-400" />
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="flex-1 text-sm outline-none tracking-widest"
                      placeholder="6-digit code"
                      inputMode="numeric"
                      maxLength={8}
                    />
                  </div>
                </label>
                <button
                  type="submit"
                  disabled={isLoading || otp.length < 4}
                  className="w-full bg-[#800020] hover:bg-[#600018] disabled:opacity-60 text-white text-sm font-bold py-3 rounded-xl"
                >
                  {isLoading ? 'Verifying…' : 'Verify & Login'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetRecaptcha();
                    setConfirmationResult(null);
                    setOtp('');
                    setOtpSent(false);
                  }}
                  className="w-full text-xs font-semibold text-neutral-500"
                >
                  Change number
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-neutral-700">Email or Username</span>
                <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2.5">
                  <Mail className="w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 text-sm outline-none"
                    placeholder="Username (test123) or Email"
                    required
                  />
                </div>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-neutral-700">Password</span>
                <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2.5">
                  <Lock className="w-4 h-4 text-neutral-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 text-sm outline-none"
                    placeholder="Your password"
                    required
                  />
                </div>
              </label>
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs font-semibold text-[#800020]">
                  Forgot password?
                </Link>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#800020] hover:bg-[#600018] disabled:opacity-60 text-white text-sm font-bold py-3 rounded-xl"
              >
                {isLoading ? 'Signing in…' : 'Login'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-neutral-500">
          New here?{' '}
          <Link href="/register" className="font-bold text-[#800020]">
            Create an account
          </Link>
        </p>
      </main>

      <StorefrontFooter />
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-500 font-sans">Loading...</div>}>
      <CustomerLoginForm />
    </React.Suspense>
  );
}
