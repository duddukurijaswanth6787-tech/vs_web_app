'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star } from 'lucide-react';
import { StorefrontFooter } from '@/components/layout/StorefrontFooter';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerOrder } from '@/features/customer/hooks';
import { customerOrdersService } from '@/features/customer/orders.service';
import { getApiErrorMessage } from '@/utils/api-error';

export default function OrderReviewPage() {
  const params = useParams();
  const orderNumber = String(params.id || '');
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();
  const { data: order, isLoading } = useCustomerOrder(orderNumber, isAuthenticated);
  const items = useMemo(() => order?.items || [], [order]);
  const [productId, setProductId] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    if (items[0]?.productId) setProductId(items[0].productId);
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;
    setLoading(true);
    setError('');
    try {
      await customerOrdersService.createReview(productId, {
        rating,
        title,
        comment,
        orderId: order?.id,
      });
      router.push('/orders');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to submit review'));
    } finally {
      setLoading(false);
    }
  };

  if (!isInitializing && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Link href={`/login?redirect=/orders/review/${orderNumber}`} className="text-sm font-bold text-[#0284c7]">
          Login to review
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBFB] flex flex-col font-sans antialiased text-neutral-900">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-100 px-4 py-3 flex items-center gap-3">
        <Link href="/orders" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif text-[#0284c7]">Review Order</h1>
      </header>

      <main className="max-w-md mx-auto w-full px-4 py-6 flex-1">
        {isLoading && <p className="text-sm text-neutral-500">Loading…</p>}
        <form onSubmit={onSubmit} className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-4">
          {error && <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold">Product</span>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm"
            >
              {items.map((i) => (
                <option key={i.id} value={i.productId}>
                  {i.productName || i.productId}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)}>
                <Star className={`w-5 h-5 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} />
              </button>
            ))}
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Review title"
            className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm"
          />
          <textarea
            required
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience"
            className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={loading || !productId}
            className="w-full bg-[#0284c7] text-white text-sm font-bold py-3 rounded-xl disabled:opacity-60"
          >
            {loading ? 'Submitting…' : 'Submit Review'}
          </button>
        </form>
      </main>
      <StorefrontFooter />
    </div>
  );
}
