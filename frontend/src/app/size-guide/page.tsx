'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Ruler } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useCmsPage } from '@/features/customer/hooks';
import { getApiErrorMessage } from '@/utils/api-error';

/** Used only if CMS page `size-guide` is missing until seed/admin publish. */
const FALLBACK_HTML = `
  <h2>Women Ethnic Wear Measurement Guide</h2>
  <p>Use this chart to find your perfect fit. Measurements are in inches.</p>
  <table style="width:100%;border-collapse:collapse;text-align:center;font-size:12px">
    <thead>
      <tr style="background:#fff1f2;color:#0284c7">
        <th style="border:1px solid #fecdd3;padding:8px">Size</th>
        <th style="border:1px solid #fecdd3;padding:8px">Bust</th>
        <th style="border:1px solid #fecdd3;padding:8px">Waist</th>
        <th style="border:1px solid #fecdd3;padding:8px">Hip</th>
      </tr>
    </thead>
    <tbody>
      <tr><td style="border:1px solid #e5e5e5;padding:8px;font-weight:700">S</td><td style="border:1px solid #e5e5e5;padding:8px">34"</td><td style="border:1px solid #e5e5e5;padding:8px">28"</td><td style="border:1px solid #e5e5e5;padding:8px">36"</td></tr>
      <tr><td style="border:1px solid #e5e5e5;padding:8px;font-weight:700">M</td><td style="border:1px solid #e5e5e5;padding:8px">36"</td><td style="border:1px solid #e5e5e5;padding:8px">30"</td><td style="border:1px solid #e5e5e5;padding:8px">38"</td></tr>
      <tr><td style="border:1px solid #e5e5e5;padding:8px;font-weight:700">L</td><td style="border:1px solid #e5e5e5;padding:8px">38"</td><td style="border:1px solid #e5e5e5;padding:8px">32"</td><td style="border:1px solid #e5e5e5;padding:8px">40"</td></tr>
      <tr><td style="border:1px solid #e5e5e5;padding:8px;font-weight:700">XL</td><td style="border:1px solid #e5e5e5;padding:8px">40"</td><td style="border:1px solid #e5e5e5;padding:8px">34"</td><td style="border:1px solid #e5e5e5;padding:8px">42"</td></tr>
    </tbody>
  </table>
`;

export default function SizeGuidePage() {
  const { data, isLoading, error, isFetched } = useCmsPage('size-guide');
  const title = data?.title || 'Size & Measurement Guide';
  const contentHtml = data?.content || (isFetched && !data?.content ? FALLBACK_HTML : '');

  return (
    <div className="w-full min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900 pb-20 lg:pb-0">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1 text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold font-serif text-[#0284c7] tracking-tight">{title}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-6 flex-1 w-full">
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Ruler className="w-5 h-5 text-[#0284c7]" />
            <h2 className="text-base font-bold text-neutral-900">{title}</h2>
          </div>

          {isLoading && <p className="text-sm text-neutral-500">Loading size guide from CMS…</p>}

          {!isLoading && contentHtml && (
            <div
              className="text-sm text-neutral-700 leading-relaxed prose prose-sm max-w-none overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          )}

          {!isLoading && !contentHtml && (
            <p className="text-sm text-red-600">
              {getApiErrorMessage(error, 'Publish a CMS page with slug: size-guide')}
            </p>
          )}

          {data?.content ? (
            <p className="text-[11px] text-neutral-400 pt-2">
              Loaded from CMS page <code className="font-mono">size-guide</code>
            </p>
          ) : (
            isFetched && (
              <p className="text-[11px] text-amber-700 pt-2">
                Showing fallback chart. Publish CMS slug <code className="font-mono">size-guide</code> to manage this content.
              </p>
            )
          )}
        </div>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
