'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCustomers, useActivateCustomer, useDeactivateCustomer, useSuspendCustomer } from '@/features/customers/customers.hooks';
import type { UserProfileResponse } from '@/features/customers/customers.types';
import { User, Search, Eye, ToggleLeft, ToggleRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import DataTable from '@/components/tables/DataTable';
import type { Column } from '@/components/tables/DataTable';

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  const [localSearch, setLocalSearch] = useState(search);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = useCustomers({ page, limit: 10, search: search || undefined, status: status || undefined });
  const activateMutation = useActivateCustomer();
  const deactivateMutation = useDeactivateCustomer();
  const suspendMutation = useSuspendCustomer();

  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) { params.set(key, value); } else { params.delete(key); }
    params.set('page', '1');
    router.push(`/admin/customers?${params}`);
  };

  const handleBulkActivate = async () => {
    if (!confirm(`Activate ${selectedIds.size} customers?`)) return;
    await Promise.all(Array.from(selectedIds).map((id) => activateMutation.mutateAsync(id)));
    setSelectedIds(new Set()); refetch();
  };

  const handleBulkDeactivate = async () => {
    if (!confirm(`Deactivate ${selectedIds.size} customers?`)) return;
    await Promise.all(Array.from(selectedIds).map((id) => deactivateMutation.mutateAsync(id)));
    setSelectedIds(new Set()); refetch();
  };

  const columns: Column<UserProfileResponse>[] = [
    { key: 'name', label: 'Customer', render: (c) => (
      <div className="flex items-center gap-3">
        <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-2 text-neutral-500"><User className="h-4 w-4" /></div>
        <div>
          <Link href={`/admin/customers/${c.id}`} className="font-bold text-neutral-900 hover:underline">{c.firstName} {c.lastName || ''}</Link>
          <p className="text-[11px] text-neutral-400 mt-0.5">{c.email}</p>
        </div>
      </div>
    )},
    { key: 'phone', label: 'Phone', render: (c) => <span className="font-semibold text-neutral-600">{c.phone || 'N/A'}</span> },
    { key: 'accountStatus', label: 'Status', render: (c) => {
      const colors: Record<string, string> = { ACTIVE: 'bg-green-50 text-green-700 border-green-100', INACTIVE: 'bg-neutral-100 text-neutral-600 border-neutral-200', SUSPENDED: 'bg-red-50 text-red-700 border-red-100', LOCKED: 'bg-yellow-50 text-yellow-700 border-yellow-100' };
      return <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${colors[c.accountStatus] || ''}`}>{c.accountStatus}</span>;
    }},
    { key: 'createdAt', label: 'Registered', render: (c) => <span className="text-neutral-500">{new Date(c.createdAt).toLocaleDateString()}</span> },
    { key: 'actions', label: 'Actions', render: (c) => (
      <div className="inline-flex items-center gap-1.5">
        <Link href={`/admin/customers/${c.id}`} className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 border border-transparent hover:border-neutral-200"><Eye className="h-4 w-4" /></Link>
        <button onClick={() => { if (confirm(c.accountStatus === 'ACTIVE' ? 'Deactivate?' : 'Activate?')) (c.accountStatus === 'ACTIVE' ? deactivateMutation.mutateAsync(c.id) : activateMutation.mutateAsync(c.id)).then(() => refetch()); }}
          className={`rounded p-1.5 border border-transparent ${c.accountStatus === 'ACTIVE' ? 'text-green-600 hover:bg-green-50 hover:border-green-200' : 'text-neutral-500 hover:bg-neutral-100 hover:border-neutral-200'}`}>
          {c.accountStatus === 'ACTIVE' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
        </button>
        {c.accountStatus !== 'SUSPENDED' && (
          <button onClick={() => { if (confirm('Suspend this account?')) suspendMutation.mutateAsync(c.id).then(() => refetch()); }}
            className="rounded p-1.5 text-red-500 hover:bg-red-50 hover:border-red-200 border border-transparent"><ShieldAlert className="h-4 w-4" /></button>
        )}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Customers</h1>
        <p className="text-sm text-neutral-500 mt-1">Manage customer profiles and account security boundaries.</p>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 bg-white border border-neutral-200 p-3.5 sm:p-4 rounded-xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input type="text" placeholder="Search customers..." value={localSearch}
            onChange={(e) => { setLocalSearch(e.target.value); updateQuery('search', e.target.value); }}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950" />
        </div>
        <select value={status} onChange={(e) => updateQuery('status', e.target.value)}
          className="py-2 px-3 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950 bg-white">
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="LOCKED">Locked</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        total={data?.meta?.total ?? 0}
        page={page}
        pageSize={10}
        loading={isLoading}
        onRetry={refetch}
        onPageChange={(p) => { const params = new URLSearchParams(searchParams.toString()); params.set('page', String(p)); router.push(`/admin/customers?${params}`); }}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        rowKey={(c) => c.id}
        emptyMessage="No customers found."
        bulkActions={selectedIds.size > 0 ? (
          <div className="flex gap-2">
            <button onClick={handleBulkActivate} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 border border-green-200">Activate</button>
            <button onClick={handleBulkDeactivate} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 border border-red-200">Deactivate</button>
          </div>
        ) : undefined}
      />
    </div>
  );
}
