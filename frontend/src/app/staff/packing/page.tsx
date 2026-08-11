'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Package, CheckCircle2, Printer, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePackingQueue } from '@/features/customer/hooks';
import { customerPackingService } from '@/features/customer/extra.service';
import { getApiErrorMessage } from '@/utils/api-error';

export default function StaffPackingPortalPage() {
  const { isAuthenticated, isStaffUser, isInitializing } = useAuth();
  const { data, isLoading, error, refetch } = usePackingQueue(isAuthenticated && isStaffUser);
  const [activeId, setActiveId] = useState<string>('');
  const [message, setMessage] = useState('');

  const jobs = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.jobs)) return data.jobs;
    return [];
  }, [data]);

  const active = jobs.find((j: any) => j.id === activeId) || jobs[0];

  const run = async (action: 'start' | 'label' | 'complete') => {
    if (!active?.id) return;
    setMessage('');
    try {
      if (action === 'start') await customerPackingService.start(active.id);
      if (action === 'label') await customerPackingService.generateLabel(active.id);
      if (action === 'complete') await customerPackingService.complete(active.id);
      setMessage(`Job ${action} successful`);
      refetch();
    } catch (err) {
      setMessage(getApiErrorMessage(err));
    }
  };

  if (!isInitializing && (!isAuthenticated || !isStaffUser)) {
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <p className="text-sm">Staff login required for packing station</p>
          <Link href="/login?redirect=/staff/packing" className="inline-block bg-rose-700 px-4 py-2 rounded-xl text-xs font-bold">
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-neutral-900 text-white font-sans antialiased">
      <header className="bg-neutral-950 border-b border-neutral-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-1 text-neutral-400 hover:text-white rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-rose-400 uppercase tracking-wider">
              Warehouse Staff Packing Station
            </h1>
            <span className="text-[10px] text-neutral-400">
              {active ? `Job ${active.id.slice(0, 8)} • ${active.status || 'QUEUED'}` : 'No active job'}
            </span>
          </div>
        </div>
        <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
          {jobs.length} in queue
        </span>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {isLoading && <p className="text-sm text-neutral-400">Loading packing queue…</p>}
        {error && <p className="text-sm text-red-400">{getApiErrorMessage(error)}</p>}
        {message && <p className="text-sm text-emerald-400">{message}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {jobs.map((job: any) => (
            <button
              key={job.id}
              type="button"
              onClick={() => setActiveId(job.id)}
              className={`text-left p-3 rounded-2xl border ${
                (active?.id || '') === job.id
                  ? 'border-rose-500 bg-rose-950/30'
                  : 'border-neutral-700 bg-neutral-800'
              }`}
            >
              <p className="text-xs font-bold">{job.orderNumber || job.orderId || job.id}</p>
              <p className="text-[10px] text-neutral-400 mt-1">{job.status}</p>
            </button>
          ))}
        </div>

        <div className="bg-neutral-800 rounded-3xl border border-neutral-700/80 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-700 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-rose-400" />
              <span>Packing Job Details</span>
            </h2>
            <button
              onClick={() => run('label')}
              className="bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Label
            </button>
          </div>

          {(active?.items || active?.orderItems || []).length ? (
            <div className="space-y-3">
              {(active.items || active.orderItems).map((item: any) => (
                <div
                  key={item.id || item.sku}
                  className="p-4 rounded-2xl border border-neutral-700 bg-neutral-900/80"
                >
                  <h3 className="text-xs font-bold">{item.productName || item.name}</h3>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {item.sku || item.barcode || item.id}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-400">Select a job from the queue to begin packing.</p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => run('start')}
              className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-xs font-bold py-2.5 rounded-xl"
            >
              Start Packing
            </button>
            <button
              type="button"
              onClick={() => run('complete')}
              className="flex-1 bg-emerald-700 hover:bg-emerald-600 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1"
            >
              <CheckCircle2 className="w-4 h-4" /> Complete
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
