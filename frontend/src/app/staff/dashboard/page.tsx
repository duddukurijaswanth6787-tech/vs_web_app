'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutGrid, Package, Warehouse, Headset, Clock, ArrowRight, ActivitySquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePackingQueue } from '@/features/customer/hooks';
import { useCurrentShift } from '@/features/pos/pos.hooks';
import { useStaffTickets } from '@/features/support/staff-support.hooks';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '@/features/inventory/inventory.service';
import { StaffPortalNav } from '@/components/staff/StaffPortalNav';
import { StaffLoginGate } from '@/components/staff/StaffLoginGate';
import { getApiErrorMessage } from '@/utils/api-error';

export default function StaffDashboardPage() {
  const { user, isAuthenticated, isStaffUser, isInitializing } = useAuth();

  const packingQuery = usePackingQueue(isAuthenticated && isStaffUser);
  const shiftQuery = useCurrentShift();
  const ticketsQuery = useStaffTickets({ status: 'OPEN', limit: 5 }, isAuthenticated && isStaffUser);
  const movementsQuery = useQuery({
    queryKey: ['staff-dashboard', 'movements'],
    queryFn: () => inventoryService.findMovements({ limit: 5 }),
    enabled: isAuthenticated && isStaffUser,
  });

  if (!isInitializing && (!isAuthenticated || !isStaffUser)) {
    return <StaffLoginGate redirect="/staff/dashboard" />;
  }

  const packingJobs = (() => {
    const data = packingQuery.data;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    const typed = data as { data?: unknown[]; jobs?: unknown[] };
    return typed.data ?? typed.jobs ?? [];
  })();

  return (
    <div className="w-full min-h-screen bg-neutral-900 text-white font-sans antialiased pb-20 sm:pb-0">
      <header className="bg-neutral-950 border-b border-neutral-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Staff Dashboard
            </h1>
            <span className="text-[10px] text-neutral-400">
              {user ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''} · ${user.roles.join(', ')}` : ''}
            </span>
          </div>
        </div>
      </header>

      <StaffPortalNav />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Shift status */}
        <div className="bg-neutral-800 rounded-2xl border border-neutral-700/80 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-rose-400" />
            <div>
              <p className="text-xs font-bold">Till Shift</p>
              <p className="text-[10px] text-neutral-400">
                {shiftQuery.isLoading
                  ? 'Checking...'
                  : shiftQuery.data
                    ? `Open on ${shiftQuery.data.terminalId} since ${new Date(shiftQuery.data.openedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                    : 'No open shift'}
              </p>
            </div>
          </div>
          <Link href="/staff/profile" className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
            Manage <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Quick stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/staff/packing" className="bg-neutral-800 rounded-2xl border border-neutral-700/80 p-4 hover:border-rose-600/60 transition-colors">
            <Package className="w-5 h-5 text-rose-400 mb-2" />
            <p className="text-2xl font-black">{packingQuery.isLoading ? '—' : packingJobs.length}</p>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wide">Jobs in Packing Queue</p>
          </Link>

          <Link href="/staff/warehouse" className="bg-neutral-800 rounded-2xl border border-neutral-700/80 p-4 hover:border-rose-600/60 transition-colors">
            <Warehouse className="w-5 h-5 text-rose-400 mb-2" />
            <p className="text-2xl font-black">{movementsQuery.isLoading ? '—' : (movementsQuery.data?.meta.total ?? 0)}</p>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wide">Stock Movements Logged</p>
          </Link>

          <Link href="/staff/support" className="bg-neutral-800 rounded-2xl border border-neutral-700/80 p-4 hover:border-rose-600/60 transition-colors">
            <Headset className="w-5 h-5 text-rose-400 mb-2" />
            <p className="text-2xl font-black">{ticketsQuery.isLoading ? '—' : (ticketsQuery.data?.meta.total ?? 0)}</p>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wide">Open Support Tickets</p>
          </Link>
        </div>

        {/* Recent warehouse movements */}
        <div className="bg-neutral-800 rounded-2xl border border-neutral-700/80 p-4 space-y-3">
          <h2 className="text-xs font-bold text-white flex items-center gap-2">
            <ActivitySquare className="w-4 h-4 text-rose-400" />
            Recent Inventory Movements
          </h2>
          {movementsQuery.isLoading && <p className="text-xs text-neutral-400">Loading...</p>}
          {movementsQuery.error && <p className="text-xs text-red-400">{getApiErrorMessage(movementsQuery.error)}</p>}
          {movementsQuery.data && movementsQuery.data.data.length === 0 && (
            <p className="text-xs text-neutral-400">No movements logged yet.</p>
          )}
          <div className="space-y-2">
            {movementsQuery.data?.data.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-[11px] border-b border-neutral-700/60 pb-2 last:border-0 last:pb-0">
                <span className="text-neutral-300 font-medium">{m.movementType}</span>
                <span className={m.quantity >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {m.quantity >= 0 ? '+' : ''}{m.quantity}
                </span>
                <span className="text-neutral-500">{new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
