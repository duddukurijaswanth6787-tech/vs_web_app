'use client';

import React, { useState, useCallback } from 'react';
import { useAuditLogs, useAuditStats } from '@/features/audit/audit.hooks';
import { AuditLogResponse } from '@/features/audit/audit.types';
import { Search, Eye, GitCompare } from 'lucide-react';
import DataTable, { Column } from '@/components/tables/DataTable';
import AuditDetailsDrawer from '@/components/audit/AuditDetailsDrawer';
import AuditCompareView from '@/components/audit/AuditCompareView';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);

  const query = { page, limit: 15, search: search || undefined, module: module || undefined, status: status || undefined };
  const { data, isLoading, error, refetch } = useAuditLogs(query);
  const { data: stats } = useAuditStats();

  const logs = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  const handlePageChange = useCallback((p: number) => setPage(p), []);

  const columns: Column<AuditLogResponse>[] = [
    {
      key: 'createdAt', label: 'Time', sortable: true,
      render: (log) => <span className="font-mono text-neutral-500 text-[11px]">{new Date(log.createdAt).toLocaleString()}</span>,
    },
    {
      key: 'action', label: 'Action',
      render: (log) => <span className="font-semibold text-neutral-900">{log.action}</span>,
    },
    {
      key: 'module', label: 'Module',
      render: (log) => (
        <div>
          <span className="font-medium text-neutral-700 capitalize">{log.module}</span>
          <p className="text-[10px] text-neutral-400 font-mono">{log.resource}{log.resourceId ? ` (${log.resourceId.substring(0, 8)})` : ''}</p>
        </div>
      ),
    },
    {
      key: 'userId', label: 'User',
      render: (log) => <span className="font-mono text-neutral-500 text-[11px]">{log.userId?.substring(0, 12) || log.staffId?.substring(0, 12) || 'SYSTEM'}</span>,
    },
    {
      key: 'status', label: 'Status',
      render: (log) => (
        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${log.status === 'SUCCESS' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {log.status}
        </span>
      ),
    },
    {
      key: 'actions', label: '',
      render: (log) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => setSelectedId(log.id)} className="rounded p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100" title="View details">
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setCompareId(log.id)} className="rounded p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50" title="Compare versions">
            <GitCompare className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Audit Logs</h1>
        <p className="text-sm text-neutral-500 mt-1">Review ledger events, administrator mutations, and security transactions.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Events" value={stats?.total ?? '-'} />
        <StatCard label="Today" value={stats?.today ?? '-'} />
        <StatCard label="Active Users" value={stats?.uniqueUsers ?? '-'} />
        <StatCard label="Modules" value={stats?.modules?.length ?? '-'} />
      </div>

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-3 bg-white border border-neutral-200 p-4 rounded-xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input type="text" placeholder="Search action or entity..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950" />
        </div>
        <select value={module} onChange={(e) => { setModule(e.target.value); setPage(1); }}
          className="py-2 px-3 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950 bg-white">
          <option value="">All Modules</option>
          <option value="auth">Auth</option>
          <option value="catalog">Catalog</option>
          <option value="orders">Orders</option>
          <option value="inventory">Inventory</option>
          <option value="wallet">Wallet</option>
          <option value="rag-agent">RAG Agent</option>
          <option value="products">Products</option>
          <option value="media">Media</option>
          <option value="notification">Notification</option>
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="py-2 px-3 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-950 bg-white">
          <option value="">All Statuses</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILURE">Failure</option>
        </select>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={logs}
        total={meta.total}
        page={page}
        pageSize={15}
        loading={isLoading}
        error={!!error}
        onRetry={refetch}
        onPageChange={handlePageChange}
        onRowClick={(log) => setSelectedId(log.id)}
        emptyMessage="No audit logs found."
        rowKey={(log) => log.id}
      />

      {/* Details Drawer */}
      <AuditDetailsDrawer
        auditId={selectedId}
        onClose={() => setSelectedId(null)}
        onCompare={(id) => { setSelectedId(null); setCompareId(id); }}
        open={!!selectedId}
      />

      {/* Compare View */}
      {compareId && (
        <AuditCompareView
          auditId={compareId}
          onClose={() => setCompareId(null)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3 shadow-sm">
      <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-neutral-900 mt-1">{value}</p>
    </div>
  );
}
