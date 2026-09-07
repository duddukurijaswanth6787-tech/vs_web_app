'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useCreateSupportTicket } from '@/features/customer/hooks';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import type { CreateSupportTicketDto } from '@/features/support/support.types';

export default function NewTicketPage() {
  const { register, handleSubmit } = useForm<CreateSupportTicketDto>();
  const createTicket = useCreateSupportTicket();
  const router = useRouter();

  const onSubmit = async (data: CreateSupportTicketDto) => {
    await createTicket.mutateAsync(data);
    router.push('/account/support');
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <StorefrontHeader />
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold font-serif mb-6">Create New Ticket</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-neutral-700">Subject <span className="text-red-500">*</span></span>
            <input {...register('subject')} placeholder="Brief subject of your issue" className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)]" required />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-neutral-700">Description <span className="text-red-500">*</span></span>
            <textarea {...register('description')} placeholder="Describe your issue in detail..." className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-primary)] h-32" required />
          </label>
          <button type="submit" className="bg-[var(--brand-primary)] text-white px-6 py-2 rounded-lg">Submit</button>
        </form>
      </main>
      <MobileBottomNav />
    </div>
  );
}
