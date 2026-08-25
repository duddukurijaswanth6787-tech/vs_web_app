'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, Printer, RefreshCw } from 'lucide-react';
import { customerPackingService, PackingJobDto } from '@/features/customer/extra.service';
import { useToast } from '@/components/toast/ToastProvider';
import { getApiErrorMessage } from '@/utils/api-error';

export default function WarehousePackingAdminPage() {
  const { toast } = useToast();

  const { data: queueData, isFetching, refetch } = useQuery({
    queryKey: ['admin', 'packing', 'queue'],
    queryFn: () => customerPackingService.getQueue({ limit: 50 }),
  });
  const jobs = useMemo(() => queueData?.jobs ?? queueData?.data ?? [], [queueData]);

  const stats = useMemo(() => {
    const pending = jobs.filter((j) => ['QUEUED', 'PENDING', 'ASSIGNED'].includes(String(j.status || '').toUpperCase())).length;
    const inProgress = jobs.filter((j) => String(j.status || '').toUpperCase().includes('PROGRESS') || String(j.status || '').toUpperCase() === 'PACKING').length;
    const completed = jobs.filter((j) => String(j.status || '').toUpperCase().includes('COMPLETE')).length;
    return { pending, inProgress, completed, total: jobs.length };
  }, [jobs]);

  const printLabel = async (job: PackingJobDto) => {
    try {
      const result = await customerPackingService.generateLabel(job.id);
      toast('success', 'Label generated', result?.labelUrl || `Job ${job.id.slice(0, 8)} ready to print`);
      await refetch();
    } catch (err) {
      toast('error', 'Label failed', getApiErrorMessage(err));
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-neutral-900 flex items-center gap-2.5">
            <Package className="w-6 h-6 text-[#0284c7]" />
            <span>Warehouse Packing Queue & Station Admin</span>
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Live packing jobs from `/packing/queue`.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="p-2 border border-neutral-300 rounded-xl hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 text-xs font-bold transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-neutral-500" />
          <span>{isFetching ? 'Loading…' : 'Refresh Queue'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-neutral-500 block">Pending Queue</span>
          <span className="text-2xl font-black text-amber-600">{stats.pending}</span>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-neutral-500 block">In-Progress</span>
          <span className="text-2xl font-black text-blue-600">{stats.inProgress}</span>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-neutral-500 block">Completed</span>
          <span className="text-2xl font-black text-emerald-700">{stats.completed}</span>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-neutral-500 block">Total Jobs</span>
          <span className="text-2xl font-black text-[#0284c7]">{stats.total}</span>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
            Live Warehouse Packing Jobs
          </h2>
          <span className="text-xs text-neutral-500 font-bold">{jobs.length} jobs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 text-neutral-600 font-bold uppercase border-b border-neutral-100">
              <tr>
                <th className="p-3">Order / Job</th>
                <th className="p-3">Status</th>
                <th className="p-3">Assigned</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-800 font-medium">
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-neutral-500">
                    {isFetching ? 'Loading queue…' : 'No packing jobs in queue'}
                  </td>
                </tr>
              )}
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="p-3">
                    <p className="font-mono font-bold text-[#0284c7]">
                      {job.orderNumber || job.orderId || job.id}
                    </p>
                    <p className="text-[10px] text-neutral-400 font-mono">{job.id}</p>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-blue-700">
                      {job.status}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-neutral-900">
                    {String(job.assignedToName || job.assignedTo || job.packerId || 'Unassigned')}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => printLabel(job)}
                      className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-[11px] font-bold border border-neutral-200 flex items-center gap-1 transition-colors"
                    >
                      <Printer className="w-3 h-3 text-neutral-600" />
                      <span>Print Label</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
