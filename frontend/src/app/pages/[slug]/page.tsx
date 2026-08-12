'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { useCmsPage } from '@/features/customer/hooks';
import { getApiErrorMessage } from '@/utils/api-error';

export default function CmsPage() {
  const params = useParams();
  const slug = String(params.slug || '');
  const { data, isLoading, error } = useCmsPage(slug);

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#800020]">
          {data?.title || slug}
        </h1>
      </header>

      <main className="max-w-3xl mx-auto w-full px-4 py-8 flex-1 prose prose-sm">
        {isLoading && <p className="text-sm text-neutral-500">Loading page…</p>}
        {error && <p className="text-sm text-red-600">{getApiErrorMessage(error, 'Page not found')}</p>}
        {(() => {
          const pageData = data as { content?: string; body?: string } | undefined;
          return (
            <>
              {pageData?.content && (
                <div
                  className="text-sm text-neutral-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: pageData.content }}
                />
              )}
              {!isLoading && !error && !pageData?.content && pageData?.body && (
                <div className="text-sm text-neutral-700 whitespace-pre-wrap">{pageData.body}</div>
              )}
            </>
          );
        })()}
      </main>
      <StorefrontFooter />
    </div>
  );
}
