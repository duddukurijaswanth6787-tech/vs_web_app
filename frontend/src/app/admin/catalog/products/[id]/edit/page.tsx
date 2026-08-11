'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProduct } from '@/features/catalog/products/product.hooks';
import ProductBuilder from '@/features/catalog/products/components/ProductBuilder';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: product, isLoading, isError, refetch } = useProduct(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <Link
          href="/admin/catalog/products"
          className="p-2 border border-neutral-200 rounded-xl hover:border-neutral-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
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
        <PageError title="Loading Failed" message="Could not fetch product information." retry={refetch} />
      ) : (
        <ProductBuilder
          productId={id}
          initialData={product}
          onSaveSuccess={() => {
            router.push('/admin/catalog/products');
          }}
        />
      )}
    </div>
  );
}
