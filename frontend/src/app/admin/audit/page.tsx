'use client';

import React, { useState, useCallback } from 'react';
import { useAuditLogs, useAuditStats } from '@/features/audit/audit.hooks';
import { AuditLogResponse } from '@/features/audit/audit.types';
import { Search, Eye, GitCompare, Radio, RefreshCw, ShieldCheck, Activity } from 'lucide-react';
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
  const [isLive, setIsLive] = useState(true);

  const query = { page, limit: 15, search: search || undefined, module: module || undefined, status: status || undefined };
  const { data, isLoading, isFetching, error, refetch } = useAuditLogs(query, {
    refetchInterval: isLive ? 3000 : false,
  });
  const { data: stats } = useAuditStats();

  const logs = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  const handlePageChange = useCallback((p: number) => setPage(p), []);

  const columns: Column<AuditLogResponse>[] = [
    {
      key: 'createdAt', label: 'Time', sortable: true,
      render: (log) => (
        <span className="font-mono text-neutral-500 text-[11px]">
          {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          <span className="block text-[10px] text-neutral-400">{new Date(log.createdAt).toLocaleDateString()}</span>
        </span>
      ),
    },
    {
      key: 'action', label: 'Action / Event',
      render: (log) => (
        <div>
          <span className="font-semibold text-neutral-900 text-xs">{log.action}</span>
          {log.message && <p className="text-[10px] text-neutral-500 truncate max-w-xs">{log.message}</p>}
        </div>
      ),
    },
    {
      key: 'module', label: 'Module & Resource',
      render: (log) => (
        <div>
          <span className="font-medium text-neutral-700 capitalize text-xs">{log.module}</span>
          <p className="text-[10px] text-neutral-400 font-mono">{log.resource}{log.resourceId ? ` (#${log.resourceId.substring(0, 8)})` : ''}</p>
        </div>
      ),
    },
    {
      key: 'userId', label: 'User / Actor',
      render: (log) => (
        <span className="font-mono text-neutral-600 text-[11px] bg-neutral-100 px-2 py-0.5 rounded">
          {log.userId ? log.userId.substring(0, 10) : log.staffId ? `Staff:${log.staffId.substring(0, 8)}` : 'GUEST / SYSTEM'}
        </span>
      ),
    },
    {
      key: 'ipAddress', label: 'IP / Origin',
      render: (log) => (
        <span className="font-mono text-neutral-400 text-[10px] block">
          {log.ipAddress || 'Internal'}
        </span>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (log) => (
        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
          log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          {log.status}
        </span>
      ),
    },
    {
      key: 'actions', label: '',
      render: (log) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => setSelectedId(log.id)} className="rounded p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100" title="View details">
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={() => setCompareId(log.id)} className="rounded p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50" title="Compare versions">
            <GitCompare className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-serif">Live Audit & Telemetry</h1>
            {isLive && (
              <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Stream
              </span>
            )}
          </div>
          <p className="text-sm text-neutral-500 mt-1">Real-time ledger events, logins, customer orders, and security transactions.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLive((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              isLive
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLive ? 'animate-pulse' : ''}`} />
            {isLive ? 'Live Stream Active (3s)' : 'Enable Live Stream'}
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Events" value={stats?.total ?? '-'} icon={<Activity className="w-4 h-4 text-sky-600" />} />
        <StatCard label="Today" value={stats?.today ?? '-'} icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />} />
        <StatCard label="Active Users" value={stats?.uniqueUsers ?? '-'} icon={<Activity className="w-4 h-4 text-purple-600" />} />
        <StatCard label="Active Modules" value={stats?.modules?.length ?? '-'} icon={<Activity className="w-4 h-4 text-amber-600" />} />
      </div>

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-3 bg-white border border-neutral-200 p-4 rounded-2xl shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input type="text" placeholder="Search action, actor, or entity..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-950" />
        </div>
        <select value={module} onChange={(e) => { setModule(e.target.value); setPage(1); }}
          className="py-2 px-3 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-950 bg-white">
          <option value="">All Modules</option>
          <option value="auth">Auth & Logins</option>
          <option value="orders">Orders & Checkout</option>
          <option value="catalog">Catalog & Products</option>
          <option value="inventory">Inventory & Stock</option>
          <option value="wallet">Wallet & Loyalty</option>
          <option value="shipping">Shipping & Delhivery</option>
          <option value="notification">Notification</option>
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="py-2 px-3 text-xs border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-950 bg-white">
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
        emptyMessage="No audit events recorded yet."
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

function StatCard({ label, value, icon }: { label: string; value: number | string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
      <div>
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-neutral-900 mt-0.5">{value}</p>
      </div>
      {icon && <div className="p-2 bg-neutral-50 rounded-xl">{icon}</div>}
    </div>
  );
}
