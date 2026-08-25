'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useCustomerFaqs } from '@/features/customer/hooks';
import { getApiErrorMessage } from '@/utils/api-error';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export default function FaqsPage() {
  const { data, isLoading, error } = useCustomerFaqs();
  const faqs: FaqItem[] = useMemo(() => (data?.data || []) as FaqItem[], [data]);

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#0284c7]">FAQs</h1>
      </header>

      <main className="max-w-3xl mx-auto w-full px-4 py-6 flex-1 space-y-3">
        {isLoading && <p className="text-sm text-neutral-500">Loading FAQs…</p>}
        {error && <p className="text-sm text-red-600">{getApiErrorMessage(error)}</p>}
        {!isLoading && faqs.length === 0 && (
          <div className="text-center py-12 text-sm text-neutral-500">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
            No FAQs published yet
          </div>
        )}
        {faqs.map((faq) => (
          <details
            key={faq.id}
            className="bg-white border border-neutral-200 rounded-2xl p-4 group open:shadow-xs"
          >
            <summary className="text-sm font-bold cursor-pointer list-none flex justify-between gap-3">
              <span>{faq.question}</span>
              <span className="text-neutral-400 group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="text-sm text-neutral-600 mt-3 leading-relaxed whitespace-pre-wrap">
              {faq.answer}
            </p>
          </details>
        ))}
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
