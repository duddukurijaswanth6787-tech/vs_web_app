'use client';

import React from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useProduct } from '@/features/catalog/products/product.hooks';
import ProductBuilder from '@/features/catalog/products/components/ProductBuilder';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

function EditProductPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPage = searchParams.get('fromPage') || '';
  const backUrl = fromPage ? `/admin/catalog/products?page=${fromPage}` : '/admin/catalog/products';
  const params = useParams();
  const id = params.id as string;

  const { data: product, isLoading, isError, refetch } = useProduct(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <Link
          href={backUrl}
          className="p-2 border border-neutral-200 rounded-xl hover:border-neutral-300 transition-colors flex items-center gap-1.5 text-xs font-semibold text-neutral-700"
          title={fromPage ? `Back to Products (Page ${fromPage})` : 'Back to Products'}
        >
          <ArrowLeft className="w-4 h-4" />
          {fromPage && <span className="text-[11px] font-bold text-neutral-500">Page {fromPage}</span>}
        </Link>
        <div>
          <h1 className="text-xl font-bold text-neutral-900 font-sans tracking-tight">Edit Catalog Product</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Modify specifications for {product ? `"${product.name}"` : 'product catalog item'}.
          </p>
        </div>
      </div>

      {isLoading ? (
        <SectionLoader message="Fetching product specifications..." />
      ) : isError || !product ? (
        <div className="bg-white p-12 rounded-2xl border border-neutral-200 shadow-sm text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold text-lg">
            !
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900">Product Not Found</h2>
            <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1">
              This product ID ({id}) could not be found or has been removed from the catalog.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href={backUrl}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl transition"
            >
              Return to Products Catalog
            </Link>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold rounded-xl transition"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <ProductBuilder
          productId={id}
          initialData={product}
          onSaveSuccess={() => {
            router.push(backUrl);
          }}
        />
      )}
    </div>
  );
}

export default function EditProductPage() {
  return (
    <React.Suspense fallback={<SectionLoader message="Loading editor..." />}>
      <EditProductPageContent />
    </React.Suspense>
  );
}

