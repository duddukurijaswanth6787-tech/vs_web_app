'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFaqs, useCreateFaq, useUpdateFaq, useDeleteFaq } from '@/features/faqs/faq.hooks';
import { FaqResponse } from '@/features/faqs/faq.types';
import { ButtonLoader } from '@/components/feedback/FeedbackStates';
import { Search, Plus, Trash2, Edit3, X, ThumbsUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { categorizeApiError } from '@/lib/api-error-handler';
import { getApiErrorMessage } from '@/utils/api-error';
import DataTable from '@/components/tables/DataTable';
import type { Column } from '@/components/tables/DataTable';

const faqSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters').max(200),
  answer: z.string().min(5, 'Answer must be at least 5 characters'),
  category: z.string().min(2, 'Category name is required').max(50),
  displayOrder: z.number().int().min(0),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof faqSchema>;

export default function FaqsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const pageParam = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  const [localSearch, setLocalSearch] = useState(search);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeFaq, setActiveFaq] = useState<FaqResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: listData, isLoading, isError, refetch } = useFaqs({ page: pageParam, limit: 10, search: search || undefined, category: category || undefined });
  const deleteMut = useDeleteFaq();

  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) { params.set(key, value); } else { params.delete(key); }
    params.set('page', '1');
    router.push(`/admin/faqs?${params}`);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} FAQs?`)) return;
    await Promise.all(Array.from(selectedIds).map((id) => deleteMut.mutateAsync(id)));
    setSelectedIds(new Set()); refetch();
  };

  const isEditor = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));
  const isSuperAdmin = user?.roles?.includes('super_admin');

  const columns: Column<FaqResponse>[] = [
    { key: 'question', label: 'Question', render: (f) => <div><div className="font-bold text-neutral-900">{f.question}</div><span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 text-[9px] font-bold uppercase">{f.category || 'General'}</span></div> },
    { key: 'answer', label: 'Answer', render: (f) => <span className="text-neutral-600 max-w-[300px] truncate block">{f.answer}</span> },
    { key: 'displayOrder', label: 'Order', render: (f) => <span className="font-semibold text-center block">{f.displayOrder}</span> },
    { key: 'helpfulCount', label: 'Helpful', render: (f) => <span className="font-mono text-neutral-800 text-center block"><ThumbsUp className="w-3.5 h-3.5 text-neutral-400 inline" /> {f.helpfulCount}</span> },
    { key: 'isActive', label: 'Status', render: (f) => <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${f.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-neutral-100 text-neutral-500'}`}>{f.isActive ? 'Active' : 'Inactive'}</span> },
    { key: 'actions', label: 'Actions', render: (f) => (
      <div className="flex justify-end gap-2">
        {isEditor && <button onClick={() => { setActiveFaq(f); setIsDialogOpen(true); }} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600"><Edit3 className="w-4 h-4" /></button>}
        {isSuperAdmin && <button onClick={() => { if (confirm(`Delete FAQ?`)) deleteMut.mutateAsync(f.id).then(() => refetch()); }} className="p-1.5 hover:bg-red-50 rounded text-red-650"><Trash2 className="w-4 h-4" /></button>}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Frequently Asked Questions</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage public user FAQs, group categories, and track customer helpful counts.</p>
        </div>
        {isEditor && <button onClick={() => { setActiveFaq(null); setIsDialogOpen(true); }} className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-sm"><Plus className="w-4 h-4" /> Create FAQ</button>}
      </div>

      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={(e) => { e.preventDefault(); updateQuery('search', localSearch); }} className="relative w-full md:w-80">
          <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search by question or answer..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-neutral-900" />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </form>
        <select value={category} onChange={(e) => updateQuery('category', e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs">
          <option value="">All Categories</option>
          <option value="General">General</option>
          <option value="Shipping">Shipping</option>
          <option value="Returns">Returns</option>
          <option value="Payment">Payment</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={listData?.data ?? []}
        total={listData?.meta?.total ?? 0}
        page={pageParam}
        pageSize={10}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        onPageChange={(p) => { const params = new URLSearchParams(searchParams.toString()); params.set('page', String(p)); router.push(`/admin/faqs?${params}`); }}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        rowKey={(f) => f.id}
        emptyMessage="No FAQs found."
        bulkActions={selectedIds.size > 0 ? (
          <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 border border-red-200">Delete Selected</button>
        ) : undefined}
      />

      {isDialogOpen && <FaqDialog faq={activeFaq} onClose={() => { setIsDialogOpen(false); setActiveFaq(null); }} onSuccess={() => refetch()} />}
    </div>
  );
}

function FaqDialog({ faq, onClose, onSuccess }: { faq: FaqResponse | null; onClose: () => void; onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const createMut = useCreateFaq();
  const updateMut = useUpdateFaq();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(faqSchema),
    defaultValues: { question: faq?.question || '', answer: faq?.answer || '', category: faq?.category || 'General', displayOrder: faq?.displayOrder || 0, isActive: faq?.isActive ?? true },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      if (faq) await updateMut.mutateAsync({ id: faq.id, dto: values });
      else await createMut.mutateAsync(values);
      onSuccess(); onClose();
    } catch (err: unknown) { console.error(categorizeApiError(err)); setError(getApiErrorMessage(err, 'Failed to save FAQ')); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">{faq ? 'Edit FAQ' : 'Create FAQ'}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"><X className="h-5 w-5" /></button>
        </div>
        {error && <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-2.5 text-2xs text-red-650 font-semibold">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 text-xs">
          <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Category</label><select {...register('category')} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5"><option value="General">General</option><option value="Shipping">Shipping</option><option value="Returns">Returns</option><option value="Payment">Payment</option></select></div>
          <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Question</label><input type="text" {...register('question')} placeholder="e.g. How long does standard delivery take?" className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5" />{errors.question && <p className="text-[9px] text-red-650 mt-1">{errors.question.message}</p>}</div>
          <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Answer</label><textarea {...register('answer')} rows={4} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 resize-none" />{errors.answer && <p className="text-[9px] text-red-650 mt-1">{errors.answer.message}</p>}</div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
            <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Display Order</label><input type="number" {...register('displayOrder', { valueAsNumber: true })} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5" /></div>
            <div className="flex items-center pt-5"><input type="checkbox" {...register('isActive')} className="h-4 w-4 rounded border-neutral-300 text-neutral-900" /><label className="ml-2 text-2xs font-bold text-neutral-500 uppercase">Active</label></div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs disabled:opacity-55 flex items-center">{isSubmitting && <ButtonLoader />} {faq ? 'Save Changes' : 'Create FAQ'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
