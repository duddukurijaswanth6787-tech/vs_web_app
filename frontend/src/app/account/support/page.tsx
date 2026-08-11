'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useSupportTickets } from '@/features/customer/hooks';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { Plus } from 'lucide-react';

export default function SupportTicketsPage() {
  const { data, isLoading } = useSupportTickets();
  const tickets = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray((data as any).data)) return (data as any).data;
    return [];
  }, [data]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <StorefrontHeader />
      <main className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold font-serif">Support Tickets</h1>
          <Link href="/account/support/new" className="bg-[#800020] text-white px-4 py-2 rounded-lg flex items-center gap-2">
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
              tickets?.map((ticket: any) => (
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
    </div>
  );
}
