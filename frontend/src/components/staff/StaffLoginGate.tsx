'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, LogIn, ArrowRight } from 'lucide-react';

export function StaffLoginGate({ redirect }: { redirect: string }) {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-8 text-center space-y-6">
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[var(--brand-primary)] p-3 shadow-md mx-auto flex items-center justify-center">
          <Image
            src="/brand/logo-icon.png"
            alt="Vasanthi's Signature"
            width={1024}
            height={1024}
            className="w-full h-full object-contain"
          />
        </div>

        <div>
          <h2 className="text-xl font-bold font-serif text-neutral-900">Staff Portal Access</h2>
          <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
            Please sign in with your staff account credentials to view assigned tasks, record attendance, and manage your shift.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href={`/login?redirect=${encodeURIComponent(redirect)}`}
            className="w-full py-3.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <LogIn className="w-4 h-4" />
            Sign In to Staff Portal
          </Link>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Authorized Store Staff &amp; Team Members</span>
        </div>
      </div>
    </div>
  );
}
