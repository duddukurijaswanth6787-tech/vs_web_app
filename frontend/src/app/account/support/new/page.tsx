'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useCreateSupportTicket } from '@/features/customer/hooks';
import { StorefrontHeader } from '@/components/layout/StorefrontHeader';
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
    <div className="min-h-screen bg-neutral-50">
      <StorefrontHeader />
      <main className="max-w-xl mx-auto p-6">
        <h1 className="text-2xl font-bold font-serif mb-6">Create New Ticket</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <input {...register('subject')} placeholder="Subject" className="w-full border p-2 rounded" required />
          <textarea {...register('description')} placeholder="Description" className="w-full border p-2 rounded h-32" required />
          <button type="submit" className="bg-[#800020] text-white px-6 py-2 rounded-lg">Submit</button>
        </form>
      </main>
    </div>
  );
}
