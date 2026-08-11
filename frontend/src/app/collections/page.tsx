'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { useCustomerProducts } from '@/features/customer/hooks';
import { PLACEHOLDER_IMAGE } from '@/features/customer/mappers';
import { withVariant } from '@/lib/media-url';

export default function CollectionsPage() {
  const { data, isLoading } = useCustomerProducts({ isFeatured: true, limit: 100 });

  const collections = useMemo(() => {
    const map = new Map<string, { slug: string; title: string; image: string; count: number }>();
    for (const p of data?.data || []) {
      for (const c of p.collections || []) {
        const slug = String(c).toLowerCase().replace(/\s+/g, '-');
        const existing = map.get(slug);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(slug, {
            slug,
            title: String(c),
            image: p.primaryImageUrl || p.images?.[0]?.url || PLACEHOLDER_IMAGE,
            count: 1,
          });
        }
      }
    }
    return Array.from(map.values());
  }, [data]);

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#800020]">Collections</h1>
      </header>

      <main className="max-w-5xl mx-auto w-full px-4 py-6 flex-1">
        {isLoading && <p className="text-sm text-neutral-500">Loading collections…</p>}
        {!isLoading && collections.length === 0 && (
          <p className="text-sm text-neutral-500">No collections published yet</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {collections.map((col) => (
            <Link
              key={col.slug}
              href={`/collections/${col.slug}`}
              className="relative rounded-3xl overflow-hidden min-h-[220px] group"
            >
              <img src={withVariant(col.image, 'large')} alt={col.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="relative z-10 p-5 text-white mt-28">
                <h2 className="text-lg font-bold font-serif">{col.title}</h2>
                <p className="text-xs text-neutral-200 mt-1">{col.count} products</p>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <StorefrontFooter />
      <MobileBottomNav />
    </div>
  );
}
