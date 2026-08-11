'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useNewsletters, useRemoveNewsletter } from '@/features/storefront/storefront.hooks';
import { storefrontService } from '@/features/storefront/storefront.service';
import DataTable from '@/components/tables/DataTable';
import type { Column } from '@/components/tables/DataTable';
import type { NewsletterSubscription } from '@/features/storefront/storefront.types';
import { Trash2, Download, Search } from 'lucide-react';
import { getApiErrorMessage } from '@/utils/api-error';

export default function NewsletterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageParam = parseInt(searchParams.get('page') || '1');
  const statusParam = searchParams.get('status') || '';

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useNewsletters({ status: statusParam || undefined, page: pageParam, limit: 10 });
  const deleteMut = useRemoveNewsletter();

  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    value ? params.set(key, value) : params.delete(key);
    if (key !== 'page') params.set('page', '1');
    router.push(`/admin/storefront/newsletter?${params}`);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} subscribers?`)) return;
    await Promise.all(Array.from(selectedIds).map((id) => deleteMut.mutateAsync(id)));
    setSelectedIds(new Set()); refetch();
  };

  const handleExport = async () => {
    try {
      const items = await storefrontService.exportNewsletters();
      const csv = 'Email,Subscribed Date,Source\n' + items.map(i => `"${i.email}","${i.subscribedAt}","${i.source || ''}"`).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'newsletter-subscribers.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { setError(getApiErrorMessage(err, 'Failed to export')); }
  };

  const columns: Column<NewsletterSubscription>[] = [
    { key: 'email', label: 'Email', render: (n) => <span className="font-medium text-neutral-900">{n.email}</span> },
    { key: 'status', label: 'Status', render: (n) => {
      const colors: Record<string, string> = { SUBSCRIBED: 'bg-green-50 text-green-700 border-green-200', UNSUBSCRIBED: 'bg-neutral-100 text-neutral-500 border-neutral-200', PENDING: 'bg-amber-50 text-amber-700 border-amber-200' };
      return <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${colors[n.status] ?? 'bg-neutral-100 text-neutral-500'}`}>{n.status}</span>;
    }},
    { key: 'date', label: 'Subscribed', render: (n) => <span className="text-xs text-neutral-500">{new Date(n.subscribedAt).toLocaleDateString()}</span> },
    { key: 'source', label: 'Source', render: (n) => <span className="text-xs text-neutral-400">{n.source || '—'}</span> },
    { key: 'actions', label: '', render: (n) => (
      <div className="flex justify-end">
        <button onClick={() => { if (confirm('Delete this subscriber?')) deleteMut.mutateAsync(n.id).then(() => refetch()); }} className="p-1.5 hover:bg-red-50 rounded text-red-400"><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Newsletter Subscribers</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage email subscribers and export list</p>
        </div>
        <button onClick={handleExport} className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-sm"><Download className="w-4 h-4" /> Export CSV</button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium">{error}</div>}

      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-neutral-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') updateQuery('q', search); }} placeholder="Search by email..." className="flex-1 bg-transparent border-none outline-none text-sm" />
        </div>
        <select value={statusParam} onChange={(e) => updateQuery('status', e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs">
          <option value="">All Statuses</option>
          <option value="SUBSCRIBED">Subscribed</option>
          <option value="UNSUBSCRIBED">Unsubscribed</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        total={data?.meta?.total ?? 0}
        page={pageParam}
        pageSize={10}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        onPageChange={(p) => { const params = new URLSearchParams(searchParams.toString()); params.set('page', String(p)); router.push(`/admin/storefront/newsletter?${params}`); }}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        rowKey={(n) => n.id}
        emptyMessage="No subscribers yet."
        bulkActions={selectedIds.size > 0 ? (
          <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 border border-red-200">Delete Selected</button>
        ) : undefined}
      />
    </div>
  );
}
