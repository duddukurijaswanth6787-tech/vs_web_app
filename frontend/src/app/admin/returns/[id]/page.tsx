'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useReturnDetail, useUpdateReturnStatus } from '@/features/returns/return.hooks';
import { ReturnStatus } from '@/features/returns/return.types';
import { ReturnStatusBadge } from '@/components/feedback/StatusBadges';
import { SectionLoader, PageError, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { ArrowLeft, CheckCircle, XCircle, Info, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/utils/api-error';

export default function ReturnDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();

  const [adminNotes, setAdminNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Queries
  const { data: returnData, isLoading, isError, refetch } = useReturnDetail(id);

  // Mutation
  const updateStatusMut = useUpdateReturnStatus();

  const handleUpdateStatus = async (status: ReturnStatus) => {
    setError(null);
    try {
      await updateStatusMut.mutateAsync({
        id,
        dto: {
          status,
          adminNotes: adminNotes || undefined,
        },
      });
      setAdminNotes('');
      refetch();
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, 'Failed to update return status'));
    }
  };

  const isEditor = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));

  if (isLoading) {
    return <SectionLoader message="Retrieving return claim card..." />;
  }

  if (isError || !returnData) {
    return (
      <PageError
        title="Load Failure"
        message="Could not load return request claims details from server."
        retry={refetch}
      />
    );
  }

  const showApprovalActions = returnData.status === ReturnStatus.REQUESTED;
  const showCompletionActions = returnData.status === ReturnStatus.APPROVED;

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin/returns" className="p-2 hover:bg-neutral-100 rounded-xl transition">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Return claim: {returnData.returnNumber}</h1>
              <ReturnStatusBadge status={returnData.status} />
            </div>
            <p className="text-xs text-neutral-400 mt-1">Submitted on: {formatDate(returnData.createdAt)}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-150 p-4 text-xs text-red-650 font-semibold">
          {error}
        </div>
      )}

      {/* Main Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Items and details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Claim items */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
              Claim Items & Quantities
            </h3>
            
            <div className="divide-y divide-neutral-100">
              {returnData.items?.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-start text-xs">
                  <div>
                    <span className="font-bold text-neutral-800 block">Item UUID: {item.orderItemId}</span>
                    {item.reason && <span className="text-[10px] text-neutral-400 block mt-0.5">Item Reason: {item.reason}</span>}
                    {!!item.images?.length && (
                      <div className="flex gap-2 mt-2">
                        {item.images.map((img) => (
                          <a
                            key={img.id}
                            href={img.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-14 h-14 rounded-lg overflow-hidden border border-neutral-200 hover:border-neutral-400 transition"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt="Return evidence" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-neutral-900 block">Qty: {item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Notes / Admin comments */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
              Internal Documentation
            </h3>
            <div className="text-xs space-y-2">
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Customer General Reason:</span>
                <p className="text-neutral-700 mt-1 bg-neutral-50 p-3 rounded-lg border border-neutral-100 font-medium">
                  {returnData.reason}
                </p>
              </div>
              {returnData.refundPreference && (
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Refund Preference:</span>
                  <p className="text-neutral-700 mt-1 bg-neutral-50 p-3 rounded-lg border border-neutral-100 font-medium">
                    {returnData.refundPreference}
                  </p>
                </div>
              )}
              {returnData.adminNotes && (
                <div className="pt-2">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Admin Notes:</span>
                  <p className="text-neutral-700 mt-1 bg-neutral-50 p-3 rounded-lg border border-neutral-100 font-mono">
                    {returnData.adminNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Decisions & admin actions */}
        <div className="space-y-6">
          {/* Admin Decision Desk */}
          {isEditor && (showApprovalActions || showCompletionActions) && (
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
                <Info className="w-4 h-4 text-neutral-400" />
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Claims Action Desk</h3>
              </div>

              {/* Admin comments input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Admin Comments</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Record verification checklist results..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-800 focus:outline-none resize-none"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {showApprovalActions && (
                  <>
                    <button
                      disabled={updateStatusMut.isPending}
                      onClick={() => handleUpdateStatus(ReturnStatus.APPROVED)}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2"
                    >
                      {updateStatusMut.isPending ? <ButtonLoader /> : <CheckCircle className="w-4 h-4" />} Approve Claim
                    </button>
                    <button
                      disabled={updateStatusMut.isPending}
                      onClick={() => handleUpdateStatus(ReturnStatus.REJECTED)}
                      className="bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2 px-4 rounded-xl text-xs transition border border-red-200 flex items-center justify-center gap-2"
                    >
                      {updateStatusMut.isPending ? <ButtonLoader /> : <XCircle className="w-4 h-4" />} Reject Claim
                    </button>
                  </>
                )}

                {showCompletionActions && (
                  <button
                    disabled={updateStatusMut.isPending}
                    onClick={() => handleUpdateStatus(ReturnStatus.COMPLETED)}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2"
                  >
                    {updateStatusMut.isPending ? <ButtonLoader /> : <CheckCircle className="w-4 h-4" />} Mark Restocked & Complete
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Linked order info card */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
              <BookOpen className="w-4 h-4 text-neutral-400" />
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Associated Order</h3>
            </div>
            <div className="text-xs space-y-2">
              <div>
                <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Order UUID</span>
                <span className="font-mono text-neutral-800 block mt-0.5">{returnData.orderId}</span>
              </div>
              <Link
                href={`/admin/orders/${returnData.orderId}`}
                className="text-neutral-900 hover:underline font-bold flex items-center gap-1 mt-3"
              >
                Go to Order Details &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
