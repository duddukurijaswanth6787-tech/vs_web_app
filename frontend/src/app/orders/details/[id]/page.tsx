'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useCustomerOrder } from '@/features/customer/hooks';
import { formatInr } from '@/features/customer/mappers';
import { getApiErrorMessage } from '@/utils/api-error';
import type { OrderItemDto } from '@/features/customer/orders.service';

export default function OrderDetailsPage() {
  const params = useParams();
  const orderNumber = String(params.id || '');
  const { data: order, isLoading, error } = useCustomerOrder(orderNumber, true);

  if (isLoading) return <div className="p-6">Loading order details...</div>;
  if (error || !order) return <div className="p-6 text-red-600">{getApiErrorMessage(error, 'Order not found')}</div>;

  return (
    <div className="min-h-screen bg-[#FDFBFB] p-4 max-w-2xl mx-auto space-y-6">
      <header className="flex items-center gap-3 py-2">
        <Link href="/orders" className="p-1 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-bold font-serif">Order #{order.orderNumber}</h1>
      </header>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4 shadow-xs">
        <h2 className="font-bold border-b pb-2">Items</h2>
        {order.items?.map((item: OrderItemDto) => (
          <div key={item.id} className="flex justify-between items-center text-sm">
            <span>{item.productName} x {item.quantity}</span>
            <span className="font-bold">{formatInr(Number(item.totalPrice))}</span>
          </div>
        ))}
        <div className="border-t pt-4 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span className="text-[var(--brand-primary)]">{formatInr(Number(order.grandTotal))}</span>
        </div>
      </div>
    </div>
  );
}
