'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useSupportTickets } from '@/features/customer/hooks';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Plus } from 'lucide-react';
import type { SupportTicketResponse } from '@/features/support/support.types';

export default function SupportTicketsPage() {
  const { data, isLoading } = useSupportTickets();
  const tickets: SupportTicketResponse[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (typeof data === 'object' && data !== null && 'data' in data && Array.isArray((data as { data?: unknown }).data)) return (data as { data: SupportTicketResponse[] }).data;
    return [];
  }, [data]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <StorefrontHeader />
      <main className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold font-serif">Support Tickets</h1>
          <Link href="/account/support/new" className="bg-[var(--brand-primary)] text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Ticket
          </Link>
        </div>
        
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border p-4">
            {tickets?.length === 0 ? (
              <p>No tickets found.</p>
            ) : (
              tickets?.map((ticket) => (
                <div key={ticket.id} className="border-b p-4 last:border-0 flex justify-between">
                  <div>
                    <h3 className="font-bold">{ticket.subject}</h3>
                    <p className="text-sm text-neutral-500">{ticket.status} • {new Date(ticket.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
      <MobileBottomNav />
    </div>
  );
}
