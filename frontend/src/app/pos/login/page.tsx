'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShoppingBag,
  Lock,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Store,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function PosLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/pos';
  const { login, isStaffUser } = useAuth();

  const [email, setEmail] = useState('admin@vasanthi.com');
  const [password, setPassword] = useState('Admin@12345');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // If already authenticated as staff, redirect immediately to POS
  React.useEffect(() => {
    if (isStaffUser) {
      router.push(redirectUrl);
    }
  }, [isStaffUser, redirectUrl, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (pin && pin !== '1234' && pin !== '0000') {
        setError('Invalid Quick POS Security PIN. Default PIN is 1234.');
        setIsLoading(false);
        return;
      }

      await login({ email, password });
      router.push(redirectUrl);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Failed to authenticate POS terminal session. Please check your credentials.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fillSuperAdmin = () => {
    setEmail('admin@vasanthi.com');
    setPassword('Admin@12345');
    setPin('1234');
    setError('');
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-neutral-950 p-4 text-white">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/30 via-neutral-950 to-neutral-950 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-white text-neutral-900 rounded-3xl p-8 shadow-2xl border border-neutral-200/80">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 text-amber-400 flex items-center justify-center mb-4 ring-8 ring-neutral-100 shadow-lg">
            <Store className="w-8 h-8" />
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-serif font-extrabold uppercase tracking-widest text-neutral-400">
              Vasanthi&apos;s Signature
            </span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-neutral-900">
            Shopora POS Terminal
          </h1>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs">
            Counter Billing & Retail Cash Register Authorization
          </p>

          <div className="mt-3 flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold px-3 py-1 rounded-full">
            <ShieldCheck className="w-3 h-3 text-amber-600 shrink-0" />
            <span>Super Admin & Counter Staff Terminal Access</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-left text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Store Email / Username
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@vasanthi.com"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label className="block text-left text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-left text-[11px] font-bold text-neutral-700 uppercase tracking-wider">
                Quick Security PIN (Optional)
              </label>
              <span className="text-[10px] text-neutral-400">Default: 1234</span>
            </div>
            <div className="relative">
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="1234"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-center text-base font-mono tracking-widest text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <KeyRound className="w-4 h-4 text-neutral-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
          >
            {isLoading ? (
              <span>Authenticating POS Terminal...</span>
            ) : (
              <>
                <span>🔓 Login & Launch POS Billing</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick Demo Credentials Fill Button */}
          <button
            type="button"
            onClick={fillSuperAdmin}
            className="w-full py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>⚡ Fill Super Admin Credentials (admin@vasanthi.com / 1234)</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-neutral-100 text-center text-[10px] text-neutral-400">
          Shopora Web POS Terminal v2.4 — Powered by Vasanthi&apos;s Signature
        </div>
      </div>
    </div>
  );
}
