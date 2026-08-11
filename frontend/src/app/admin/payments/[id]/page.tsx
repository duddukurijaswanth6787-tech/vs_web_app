'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { usePaymentDetail, useUpdatePaymentStatus } from '@/features/payments/payment.hooks';
import { PaymentStatusBadge } from '@/components/feedback/StatusBadges';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { ArrowLeft, Clock, Info, Database } from 'lucide-react';
import Link from 'next/link';
import { formatMoney, formatDateTime } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';
import CreateRefundDialog from '@/features/refunds/components/CreateRefundDialog';
import { getApiErrorMessage } from '@/utils/api-error';

export default function PaymentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();

  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Queries
  const { data: payment, isLoading, isError, refetch } = usePaymentDetail(id);

  // Mutation
  const updateStatusMut = useUpdatePaymentStatus();

  const handleUpdateStatus = async (nextStatus: string) => {
    setError(null);
    try {
      await updateStatusMut.mutateAsync({
        id,
        status: nextStatus,
      });
      refetch();
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, 'Failed to update payment status'));
    }
  };

  const isEditor = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));

  if (isLoading) {
    return <SectionLoader message="Retrieving transaction ledger..." />;
  }

  if (isError || !payment) {
    return (
      <PageError
        title="Load Failure"
        message="Could not load payment transaction details from server."
        retry={refetch}
      />
    );
  }

  // Allowed transitions
  const getAllowedTransitions = (currentStatus: string): string[] => {
    switch (currentStatus.toUpperCase()) {
      case 'PENDING':
        return ['AUTHORIZED', 'FAILED', 'CAPTURED'];
      case 'AUTHORIZED':
        return ['CAPTURED', 'CANCELLED'];
      default:
        return [];
    }
  };

  const allowedStatuses = getAllowedTransitions(payment.status);
  const showRefundButton = payment.status.toUpperCase() === 'CAPTURED';

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin/payments" className="p-2 hover:bg-neutral-100 rounded-xl transition">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Payment: {payment.paymentNumber}</h1>
              <PaymentStatusBadge status={payment.status} />
            </div>
            <p className="text-xs text-neutral-400 mt-1">Processed on: {formatDateTime(payment.createdAt)}</p>
          </div>
        </div>

        {/* Dynamic Actions */}
        {isEditor && (
          <div className="flex gap-2">
            {allowedStatuses.map((status) => (
              <button
                key={status}
                disabled={updateStatusMut.isPending}
                onClick={() => handleUpdateStatus(status)}
                className="bg-white hover:bg-neutral-50 text-neutral-800 font-semibold py-2 px-3.5 rounded-xl text-xs border border-neutral-200 transition"
              >
                Set {status}
              </button>
            ))}

            {showRefundButton && (
              <button
                onClick={() => setIsRefundOpen(true)}
                className="bg-neutral-900 hover:bg-neutral-850 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm"
              >
                Issue Refund
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-150 p-4 text-xs text-red-650 font-semibold">
          {error}
        </div>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Transaction details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Information summary */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
              <Info className="w-4 h-4 text-neutral-400" />
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Transaction Summary</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Total Amount Paid</span>
                <span className="text-lg font-bold text-neutral-900 block mt-1">{formatMoney(payment.amount, payment.currency)}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Payment Method</span>
                <span className="text-sm font-semibold text-neutral-800 block mt-1 uppercase">{payment.method} via {payment.provider}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-neutral-100">
                <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Gateway Transaction Ref ID</span>
                <span className="font-mono text-neutral-800 block mt-1 text-xs break-all">
                  {payment.transactionId || <span className="text-neutral-300">N/A</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Chronological attempts / Transactions list */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
              <Database className="w-4 h-4 text-neutral-400" />
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Attempt Ledger Logs</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-400 uppercase tracking-wider text-[9px] font-bold border-b border-neutral-200">
                    <th className="p-3">Time</th>
                    <th className="p-3">Event Type</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3">Provider Ref</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {payment.transactions?.map((t) => (
                    <tr key={t.id} className="hover:bg-neutral-50/50 transition">
                      <td className="p-3 font-semibold text-neutral-600">{formatDateTime(t.createdAt)}</td>
                      <td className="p-3 uppercase font-bold text-[10px] text-neutral-500">{t.type}</td>
                      <td className="p-3 text-right font-mono font-bold">{formatMoney(t.amount, payment.currency)}</td>
                      <td className="p-3 font-mono text-[10px] text-neutral-400 break-all">{t.providerRefId || '-'}</td>
                      <td className="p-3 text-right font-bold uppercase text-[10px]">{t.status}</td>
                    </tr>
                  ))}
                  {(!payment.transactions || payment.transactions.length === 0) && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-neutral-400">
                        No sub-transaction logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column: Linked order information */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
              <Clock className="w-4 h-4 text-neutral-400" />
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Associated Order</h3>
            </div>
            
            <div className="text-xs space-y-2">
              <div>
                <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Order ID</span>
                <span className="font-mono text-neutral-850 block mt-0.5">{payment.orderId}</span>
              </div>
              <Link
                href={`/admin/orders/${payment.orderId}`}
                className="text-neutral-900 hover:underline font-bold flex items-center gap-1 mt-3"
              >
                Go to Order Desk &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog: Create Refund */}
      {isRefundOpen && (
        <CreateRefundDialog
          paymentId={payment.id}
          orderId={payment.orderId}
          maxAmount={payment.amount}
          currency={payment.currency}
          onClose={() => setIsRefundOpen(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
