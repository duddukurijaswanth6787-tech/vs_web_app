'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { customerAuthService } from '@/features/customer/auth.service';
import { getApiErrorMessage } from '@/utils/api-error';

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    customerAuthService
      .validateResetToken(token)
      .then((res) => setTokenValid(res.valid))
      .catch(() => setTokenValid(false))
      .finally(() => setChecking(false));
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await customerAuthService.resetPassword({ token, newPassword: password });
      setDone(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to reset password'));
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
        <h1 className="text-lg font-bold font-serif text-[#0284c7]">Reset Password</h1>
        <div className="w-6" />
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-8 flex-1">
        {checking ? (
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 text-center text-sm text-neutral-500">
            Checking your reset link…
          </div>
        ) : done ? (
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="text-sm font-semibold">Password reset successful.</p>
            <p className="text-xs text-neutral-500">You can now log in with your new password.</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-[#0284c7] hover:bg-[#0B3B78] text-white text-sm font-bold py-3 rounded-xl"
            >
              Go to Login
            </button>
          </div>
        ) : !tokenValid ? (
          <div className="bg-white border border-neutral-200 rounded-3xl p-6 text-center space-y-3">
            <p className="text-sm font-semibold text-red-700">This reset link is invalid or has expired.</p>
            <p className="text-xs text-neutral-500">Reset links expire 15 minutes after they're requested.</p>
            <Link
              href="/forgot-password"
              className="block w-full bg-[#0284c7] hover:bg-[#0B3B78] text-white text-sm font-bold py-3 rounded-xl text-center"
            >
              Request a New Link
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <p className="text-xs text-neutral-500">Choose a new password for your account.</p>
            {error && <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-neutral-700">New Password</span>
              <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2.5">
                <Lock className="w-4 h-4 text-neutral-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 text-sm outline-none"
                />
              </div>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-neutral-700">Confirm Password</span>
              <div className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2.5">
                <Lock className="w-4 h-4 text-neutral-400" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex-1 text-sm outline-none"
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0284c7] hover:bg-[#0B3B78] disabled:opacity-60 text-white text-sm font-bold py-3 rounded-xl"
            >
              {loading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        )}
      </main>
      <StorefrontFooter />
    </div>
  );
}
