'use client';

import React, { useState } from 'react';
import { Headset, Send, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStaffTickets, useUpdateTicketStatus, useReplyToTicket } from '@/features/support/staff-support.hooks';
import { StaffPortalNav } from '@/components/staff/StaffPortalNav';
import { StaffLoginGate } from '@/components/staff/StaffLoginGate';
import { getApiErrorMessage } from '@/utils/api-error';

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function StaffSupportPage() {
  const { isAuthenticated, isStaffUser, isInitializing } = useAuth();
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [activeId, setActiveId] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [error, setError] = useState('');

  const ticketsQuery = useStaffTickets({ status: statusFilter || undefined, limit: 50 }, isAuthenticated && isStaffUser);
  const updateStatusMutation = useUpdateTicketStatus();
  const replyMutation = useReplyToTicket();

  if (!isInitializing && (!isAuthenticated || !isStaffUser)) {
    return <StaffLoginGate redirect="/staff/support" />;
  }

  const tickets = ticketsQuery.data?.data ?? [];
  const active = tickets.find((t) => t.id === activeId);

  const handleStatusChange = async (status: string) => {
    if (!active) return;
    setError('');
    try {
      await updateStatusMutation.mutateAsync({ id: active.id, payload: { status } });
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !replyMessage.trim()) return;
    setError('');
    try {
      await replyMutation.mutateAsync({ id: active.id, message: replyMessage.trim() });
      setReplyMessage('');
      ticketsQuery.refetch();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="w-full min-h-screen bg-neutral-900 text-white font-sans antialiased pb-20 sm:pb-0">
      <header className="bg-neutral-950 border-b border-neutral-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {active ? (
            <button onClick={() => setActiveId('')} className="flex items-center gap-2 text-sm font-bold text-rose-400">
              <ArrowLeft className="w-4 h-4" /> Back to Queue
            </button>
          ) : (
            <h1 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <Headset className="w-4 h-4" />
              Support Desk
            </h1>
          )}
          <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
            {tickets.length} ticket(s)
          </span>
        </div>
      </header>

      <StaffPortalNav />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {error && <p className="text-xs text-red-400">{error}</p>}

        {!active ? (
          <>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {['', ...STATUS_OPTIONS].map((s) => (
                <button
                  key={s || 'ALL'}
                  onClick={() => setStatusFilter(s)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border ${
                    statusFilter === s ? 'bg-rose-700 border-rose-700 text-white' : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                  }`}
                >
                  {s || 'All'}
                </button>
              ))}
            </div>

            {ticketsQuery.isLoading && <p className="text-xs text-neutral-400">Loading tickets...</p>}
            {ticketsQuery.error && <p className="text-xs text-red-400">{getApiErrorMessage(ticketsQuery.error)}</p>}
            {!ticketsQuery.isLoading && tickets.length === 0 && (
              <p className="text-xs text-neutral-400 text-center py-8">No tickets in this view.</p>
            )}

            <div className="space-y-2.5">
              {tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className="w-full text-left bg-neutral-800 hover:bg-neutral-800/70 rounded-2xl border border-neutral-700/80 p-3.5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold font-mono text-rose-400">{t.ticketNumber}</span>
                    <span className="text-[10px] font-bold uppercase text-neutral-400">{t.status.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs font-semibold mt-1">{t.subject}</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    {t.customerName || 'Customer'} · {t.priority} priority · {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-neutral-800 rounded-2xl border border-neutral-700/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-rose-400">{active.ticketNumber}</span>
                <select
                  value={active.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updateStatusMutation.isPending}
                  className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-[10px] font-bold text-white"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <p className="text-sm font-bold">{active.subject}</p>
              <p className="text-xs text-neutral-400">{active.description}</p>
              <p className="text-[10px] text-neutral-500">
                From {active.customerName || 'Customer'} · {active.category || 'General'} · {active.priority} priority
              </p>
            </div>

            <div className="space-y-2.5">
              {(active.replies ?? []).map((r) => (
                <div
                  key={r.id}
                  className={`max-w-[85%] rounded-2xl p-3 text-xs ${
                    r.isStaff ? 'ml-auto bg-rose-900/40 border border-rose-800/60' : 'bg-neutral-800 border border-neutral-700/80'
                  }`}
                >
                  <p>{r.message}</p>
                  <span className="text-[9px] text-neutral-500 block mt-1">
                    {r.isStaff ? 'Staff' : 'Customer'} · {new Date(r.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              ))}
              {(active.replies ?? []).length === 0 && (
                <p className="text-xs text-neutral-500 text-center py-4">No replies yet.</p>
              )}
            </div>

            <form onSubmit={handleReply} className="flex gap-2">
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type a reply..."
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-rose-600"
              />
              <button
                type="submit"
                disabled={replyMutation.isPending || !replyMessage.trim()}
                className="bg-rose-700 hover:bg-rose-800 disabled:opacity-60 text-white px-4 rounded-xl flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
