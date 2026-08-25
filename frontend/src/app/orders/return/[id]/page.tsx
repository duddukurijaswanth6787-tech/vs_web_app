'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerOrder } from '@/features/customer/hooks';
import { customerOrdersService } from '@/features/customer/orders.service';
import { getApiErrorMessage } from '@/utils/api-error';
import type { OrderItemDto } from '@/features/customer/orders.service';

export default function OrderReturnPage() {
  const params = useParams();
  const orderNumber = String(params.id || '');
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();
  const { data: order } = useCustomerOrder(orderNumber, isAuthenticated);
  const [reason, setReason] = useState('Size issue');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const items = useMemo(() => order?.items || [], [order]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order?.id) return;
    setLoading(true);
    setError('');
    try {
      await customerOrdersService.createReturn({
        orderId: order.id,
        reason,
        description,
        items: items.map((i: OrderItemDto) => ({
          orderItemId: i.id,
          quantity: i.quantity,
          reason,
        })),
      });
      router.push('/orders');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create return'));
    } finally {
      setLoading(false);
    }
  };

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link href={`/login?redirect=/orders/return/${orderNumber}`} className="text-sm font-bold text-[#0284c7]">
          Login to request return
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col font-sans">
      <header className="sticky top-0 bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link href={`/orders/details/${orderNumber}`} className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif">Return Order #{orderNumber}</h1>
      </header>
      <main className="max-w-xl mx-auto w-full p-6 space-y-6">
        <form onSubmit={onSubmit} className="bg-white border p-6 rounded-2xl shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">Reason for Return</label>
            <select value={reason} onChange={e => setReason(e.target.value)} className="w-full border p-3 rounded-xl">
              <option>Size issue</option>
              <option>Damaged item</option>
              <option>Not as described</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border p-3 rounded-xl h-32" placeholder="Tell us more..." />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-[#0284c7] text-white py-3 rounded-xl font-bold">
            {loading ? 'Submitting...' : 'Submit Return Request'}
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      </main>
    </div>
  );
}
