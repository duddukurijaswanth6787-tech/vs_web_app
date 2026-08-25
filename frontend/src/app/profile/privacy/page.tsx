'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Eye, Server, FileText } from 'lucide-react';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export default function ProfilePrivacyPage() {
  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <StorefrontHeader />

      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-serif text-[#0284c7]">Privacy & Data Settings</h1>
            <p className="text-xs text-neutral-500 mt-0.5">Manage your privacy preferences and data protection rights</p>
          </div>
        </div>

        <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 p-4 bg-rose-50/60 border border-rose-100 rounded-2xl">
            <ShieldCheck className="w-8 h-8 text-[#0284c7] shrink-0" />
            <div>
              <p className="text-sm font-bold text-[#0284c7]">Your Privacy is Protected</p>
              <p className="text-xs text-neutral-600 mt-0.5">
                Vasanthi&apos;s Signature encrypts all customer account data and payment information using SSL/TLS enterprise security.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="border border-neutral-200/80 rounded-2xl p-4 space-y-2">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#0284c7]" /> Data Encryption & Security
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                We collect essential personal information (name, shipping address, mobile number) solely to fulfill your orders and personalize your luxury ethnic wear experience. We never sell your personal data to third parties.
              </p>
            </div>

            <div className="border border-neutral-200/80 rounded-2xl p-4 space-y-2">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#0284c7]" /> Communication Preferences
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                You can manage marketing notifications, order tracking SMS alerts, and promotional newsletters anytime under your profile notification preferences.
              </p>
            </div>

            <div className="border border-neutral-200/80 rounded-2xl p-4 space-y-2">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0284c7]" /> Full Privacy Policy
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                For detailed information on data retention, cookies, and your data rights, read our full document below.
              </p>
              <Link href="/privacy" className="inline-block text-xs font-bold text-[#0284c7] hover:underline pt-1">
                Read Full Privacy Policy →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
