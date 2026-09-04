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
import {
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  RefreshCw,
  Archive,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react';
import DataTable from '@/components/tables/DataTable';
import type { Column } from '@/components/tables/DataTable';
import { resolveMediaUrl } from '@/lib/media-url';
import { getApiErrorMessage } from '@/utils/api-error';

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

  // Modal State for Single Product Deletion
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  // Modal State for Bulk Product Deletion
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: productsData, isLoading, isError, refetch } = useProducts({
    page,
    limit: 10,
    search,
    status: status || undefined,
    categoryId: categoryId || undefined,
    brandId: brandId || undefined,
  });

  const { data: categoryList } = useCategories({ limit: 100 });
  const { data: brandList } = useBrands({ limit: 100 });
  const deleteProductMut = useDeleteProduct();
  const restoreProductMut = useRestoreProduct();

  const updateQuery = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.set('page', '1');
      router.push(`/admin/catalog/products?${params}`);
    },
    [searchParams, router],
  );

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleConfirmSingleDelete = async () => {
    if (!productToDelete) return;
    setIsProcessing(true);
    try {
      await deleteProductMut.mutateAsync(productToDelete.id);
      showFeedback('success', `Product "${productToDelete.name}" deleted successfully.`);
      setProductToDelete(null);
      refetch();
    } catch (err) {
      showFeedback('error', getApiErrorMessage(err, 'Failed to delete product'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map((id) => deleteProductMut.mutateAsync(id)));
      showFeedback('success', `${ids.length} products deleted successfully.`);
      setSelectedIds(new Set());
      setIsBulkDeleting(false);
      refetch();
    } catch (err) {
      showFeedback('error', getApiErrorMessage(err, 'Failed to delete selected products'));
    } finally {
      setIsProcessing(false);
    }
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
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (p) => (
        <div>
          <div className="font-bold">{p.name}</div>
          <div className="text-[10px] text-neutral-400 truncate max-w-[200px]">
            {p.shortDescription || ''}
          </div>
        </div>
      ),
    },
    {
      key: 'brand',
      label: 'Brand',
      render: (p) => (
        <div>
          <div className="font-medium">{p.brandName || "Vasanthi's Signature"}</div>
          <div className="text-[10px] text-neutral-400 uppercase">{p.type}</div>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (p) => <span className="font-bold">₹{p.basePrice}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (p) => {
        const colors: Record<string, string> = {
          ACTIVE: 'bg-green-50 text-green-700 border-green-100',
          DRAFT: 'bg-yellow-50 text-yellow-700 border-yellow-100',
          ARCHIVED: 'bg-red-50 text-red-700 border-red-100',
        };
        return (
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
              colors[p.status] || 'bg-neutral-50 text-neutral-500'
            }`}
          >
            {p.status}
          </span>
        );
      },
    },
    {
      key: 'featured',
      label: 'Featured',
      render: (p) => (
        <span
          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
            p.isFeatured
              ? 'bg-amber-50 text-amber-700 border border-amber-100'
              : 'bg-neutral-50 text-neutral-400'
          }`}
        >
          {p.isFeatured ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (p) => {
        return (
          <div className="flex gap-1 justify-end">
            <Link
              href={`/admin/catalog/products/${p.id}`}
              className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600 transition-colors"
              title="View details"
            >
              <Eye className="w-4 h-4" />
            </Link>
            <Link
              href={`/admin/catalog/products/${p.id}/edit`}
              className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600 transition-colors"
              title="Edit product"
            >
              <Edit3 className="w-4 h-4" />
            </Link>
            {p.status === 'ARCHIVED' ? (
              <button
                onClick={() =>
                  restoreProductMut
                    .mutateAsync(p.id)
                    .then(() => {
                      showFeedback('success', `Product "${p.name}" restored.`);
                      refetch();
                    })
                    .catch((err) =>
                      showFeedback('error', getApiErrorMessage(err, 'Failed to restore product')),
                    )
                }
                className="p-1.5 hover:bg-green-50 rounded text-green-600 transition-colors"
                title="Restore product"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setProductToDelete(p)}
                className="p-1.5 hover:bg-red-50 rounded text-red-600 transition-colors cursor-pointer"
                title="Delete product"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 relative">
      {/* Toast Feedback Banner */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold transition-all animate-in fade-in slide-in-from-top-4 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-neutral-900">Products</h1>
          <p className="text-xs text-neutral-400 mt-1">
            {productsData?.meta?.total ?? 0} products in catalog
          </p>
        </div>
        <Link
          href="/admin/catalog/products/new"
          className="w-full sm:w-auto justify-center bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" /> Create Product
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateQuery('search', localSearch);
            }}
            className="relative w-full lg:w-80"
          >
            <input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by name, SKU..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-neutral-900"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          </form>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 w-full lg:w-auto">
            <select
              value={status}
              onChange={(e) => updateQuery('status', e.target.value)}
              className="w-full sm:w-auto bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
            >
              <option value="">All Statuses</option>
              {Object.values(ProductStatus).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={categoryId}
              onChange={(e) => updateQuery('categoryId', e.target.value)}
              className="w-full sm:w-auto bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
            >
              <option value="">All Categories</option>
              {categoryList?.data?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={brandId}
              onChange={(e) => updateQuery('brandId', e.target.value)}
              className="w-full sm:w-auto bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs"
            >
              <option value="">All Brands</option>
              {brandList?.data?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products DataTable */}
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
        onSort={() => {}}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        rowKey={(p) => p.id}
        emptyMessage="No products found"
        bulkActions={
          selectedIds.size > 0 ? (
            <button
              onClick={() => setIsBulkDeleting(true)}
              className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100 border border-red-200 transition-colors"
            >
              Delete Selected ({selectedIds.size})
            </button>
          ) : undefined
        }
      />

      {/* Single Product Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => !isProcessing && setProductToDelete(null)}
                disabled={isProcessing}
                className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-neutral-900">Are you sure you want to delete this product?</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                You are about to delete <span className="font-bold text-neutral-800">&quot;{productToDelete.name}&quot;</span> (SKU: <span className="font-mono text-neutral-700 font-bold">{productToDelete.sku}</span>).
              </p>
              <p className="text-[11px] text-rose-600 bg-rose-50/80 border border-rose-100 p-3 rounded-xl">
                ⚠️ This product, its color/size variants, and inventory will be removed from your active store and catalog.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSingleDelete}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting…</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => !isProcessing && setIsBulkDeleting(false)}
                disabled={isProcessing}
                className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-neutral-900">Delete {selectedIds.size} selected products?</h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Are you sure you want to permanently delete these {selectedIds.size} products from your store catalog?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBulkDeleting(false)}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting…</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

