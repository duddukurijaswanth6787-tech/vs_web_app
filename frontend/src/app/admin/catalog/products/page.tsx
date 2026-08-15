'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useProducts, useDeleteProduct, useRestoreProduct } from '@/features/catalog/products/product.hooks';
import { useCategories } from '@/features/catalog/categories/category.hooks';
import { useBrands } from '@/features/catalog/brands/brand.hooks';
import { ProductStatus } from '@/features/catalog/products/product.types';
import type { ProductResponse as Product } from '@/features/catalog/products/product.types';
import Link from 'next/link';
import { Plus, Search, Eye, Edit3, Trash2, RefreshCw, Archive } from 'lucide-react';
import DataTable from '@/components/tables/DataTable';
import type { Column } from '@/components/tables/DataTable';
import { resolveMediaUrl } from '@/lib/media-url';

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const categoryId = searchParams.get('categoryId') || '';
  const brandId = searchParams.get('brandId') || '';

  const [localSearch, setLocalSearch] = useState(search);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: productsData, isLoading, isError, refetch } = useProducts({
    page, limit: 10, search, status: status || undefined,
    categoryId: categoryId || undefined, brandId: brandId || undefined,
  });

  const { data: categoryList } = useCategories({ limit: 100 });
  const { data: brandList } = useBrands({ limit: 100 });
  const deleteProductMut = useDeleteProduct();
  const restoreProductMut = useRestoreProduct();

  const updateQuery = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) { params.set(key, value); } else { params.delete(key); }
    params.set('page', '1');
    router.push(`/admin/catalog/products?${params}`);
  }, [searchParams, router]);

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} products?`)) return;
    await Promise.all(Array.from(selectedIds).map((id) => deleteProductMut.mutateAsync(id)));
    setSelectedIds(new Set());
    refetch();
  };

  const columns: Column<Product>[] = [
    {
      key: 'sku',
      label: 'SKU',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 border flex items-center justify-center overflow-hidden relative shrink-0">
            {p.primaryImageUrl ? (
              <Image
                src={resolveMediaUrl(p.primaryImageUrl)}
                alt={p.name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <Archive className="w-4 h-4 text-neutral-400" />
            )}
          </div>
          <span className="font-mono font-semibold text-[10px]">{p.sku}</span>
        </div>
      ),
    },
    { key: 'name', label: 'Name', sortable: true, render: (p) => <div><div className="font-bold">{p.name}</div><div className="text-[10px] text-neutral-400 truncate max-w-[200px]">{p.shortDescription || ''}</div></div> },
    { key: 'brand', label: 'Brand', render: (p) => <div><div className="font-medium">{p.brandName || 'VD Exclusive'}</div><div className="text-[10px] text-neutral-400 uppercase">{p.type}</div></div> },
    { key: 'price', label: 'Price', sortable: true, render: (p) => <span className="font-bold">₹{p.basePrice}</span> },
    { key: 'status', label: 'Status', sortable: true, render: (p) => {
      const colors: Record<string, string> = { ACTIVE: 'bg-green-50 text-green-700 border-green-100', DRAFT: 'bg-yellow-50 text-yellow-700 border-yellow-100', ARCHIVED: 'bg-red-50 text-red-700 border-red-100' };
      return <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${colors[p.status] || 'bg-neutral-50 text-neutral-500'}`}>{p.status}</span>;
    }},
    { key: 'featured', label: 'Featured', render: (p) => <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${p.isFeatured ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-neutral-50 text-neutral-400'}`}>{p.isFeatured ? 'Yes' : 'No'}</span> },
    { key: 'actions', label: 'Actions', render: (p) => {
      return <div className="flex gap-1 justify-end">
        <Link href={`/admin/catalog/products/${p.id}`} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600"><Eye className="w-4 h-4" /></Link>
        <Link href={`/admin/catalog/products/${p.id}/edit`} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600"><Edit3 className="w-4 h-4" /></Link>
        {p.status === 'ARCHIVED' ? (
          <button onClick={() => restoreProductMut.mutateAsync(p.id).then(() => refetch())} className="p-1.5 hover:bg-green-50 rounded text-green-600"><RefreshCw className="w-4 h-4" /></button>
        ) : (
          <button onClick={() => { if (confirm(`Archive "${p.name}"?`)) deleteProductMut.mutateAsync(p.id).then(() => refetch()); }} className="p-1.5 hover:bg-red-50 rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
        )}
      </div>;
    }},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-neutral-900">Products</h1>
          <p className="text-xs text-neutral-400 mt-1">{productsData?.meta?.total ?? 0} products in catalog</p>
        </div>
        <Link href="/admin/catalog/products/new" className="w-full sm:w-auto justify-center bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Create Product
        </Link>
      </div>

      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <form onSubmit={(e) => { e.preventDefault(); updateQuery('search', localSearch); }} className="relative w-full lg:w-80">
            <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search by name, SKU..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-neutral-900" />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          </form>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 w-full lg:w-auto">
            <select value={status} onChange={(e) => updateQuery('status', e.target.value)} className="w-full sm:w-auto bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs">
              <option value="">All Statuses</option>
              {Object.values(ProductStatus).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={categoryId} onChange={(e) => updateQuery('categoryId', e.target.value)} className="w-full sm:w-auto bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs">
              <option value="">All Categories</option>
              {categoryList?.data?.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            <select value={brandId} onChange={(e) => updateQuery('brandId', e.target.value)} className="w-full sm:w-auto bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs">
              <option value="">All Brands</option>
              {brandList?.data?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={productsData?.data ?? []}
        total={productsData?.meta?.total ?? 0}
        page={page}
        pageSize={10}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        onPageChange={(p) => updateQuery('page', String(p))}
        onSort={() => { /* ponytail: add sort params if backend supports them */ }}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        rowKey={(p) => p.id}
        emptyMessage="No products found"
        bulkActions={
          selectedIds.size > 0 ? (
            <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 border border-red-200">
              Delete Selected
            </button>
          ) : undefined
        }
      />
    </div>
  );
}
