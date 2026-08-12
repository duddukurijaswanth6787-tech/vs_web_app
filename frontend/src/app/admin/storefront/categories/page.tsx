'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useHomepageCategories, useAddHomepageCategory, useRemoveHomepageCategory } from '@/features/storefront/storefront.hooks';
import { PageLoader, ButtonLoader } from '@/components/feedback/FeedbackStates';
import DataTable from '@/components/tables/DataTable';
import type { Column } from '@/components/tables/DataTable';
import type { HomepageCategory } from '@/features/storefront/storefront.types';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { getApiErrorMessage } from '@/utils/api-error';
import { X } from 'lucide-react';

export default function HomepageCategoriesPage() {
  const { data, isLoading } = useHomepageCategories();
  const addMut = useAddHomepageCategory();
  const removeMut = useRemoveHomepageCategory();
  const [showAdd, setShowAdd] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const categories = data ?? [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!categoryId.trim()) return;
    try {
      await addMut.mutateAsync({ categoryId: categoryId.trim() });
      setCategoryId(''); setShowAdd(false);
    } catch (err) { setError(getApiErrorMessage(err, 'Failed to add category')); }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this category from homepage?')) return;
    try { await removeMut.mutateAsync(id); } catch (err) { setError(getApiErrorMessage(err, 'Failed to remove')); }
  };

  const columns: Column<HomepageCategory>[] = [
    { key: 'order', label: 'Order', render: () => <GripVertical className="w-4 h-4 text-neutral-300 cursor-grab" /> },
    { key: 'name', label: 'Category', render: (c) => <span className="font-semibold text-neutral-900">{c.category.name}</span> },
    { key: 'image', label: 'Image', render: (c) => c.image ? <Image src={c.image} alt="" width={48} height={32} className="w-12 h-8 object-cover rounded border border-neutral-200" /> : <div className="w-12 h-8 bg-neutral-100 rounded border" /> },
    { key: 'displayOrder', label: 'Display Order', render: (c) => <span className="text-center block">{c.displayOrder}</span> },
    { key: 'actions', label: '', render: (c) => (
      <button onClick={() => handleRemove(c.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-4 h-4" /></button>
    )},
  ];

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Homepage Categories</h1>
          <p className="text-xs text-neutral-400 mt-1">Categories featured on the homepage</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-sm"><Plus className="w-4 h-4" /> Add Category</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium flex items-center justify-between"><span>{error}</span><button onClick={() => setError(null)}><X className="w-4 h-4" /></button></div>}

      <DataTable
        columns={columns}
        data={categories}
        total={categories.length}
        page={1}
        pageSize={100}
        rowKey={(c) => c.id}
        onPageChange={() => {}}
        emptyMessage="No categories added to homepage yet."
      />

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <h3 className="text-sm font-bold text-neutral-900">Add Homepage Category</h3>
              <button onClick={() => setShowAdd(false)} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Category ID</label>
                <input type="text" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} placeholder="Enter category ID" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm" required />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700">Cancel</button>
                <button type="submit" disabled={addMut.isPending} className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs disabled:opacity-55 flex items-center">{addMut.isPending && <ButtonLoader />} Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
