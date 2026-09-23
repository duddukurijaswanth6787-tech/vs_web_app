'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';
import { useCreateCancellation } from '../cancellation.hooks';
import { ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/api-error';

const schema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters').max(1000, 'Reason cannot exceed 1000 characters'),
});

type FormValues = z.infer<typeof schema>;

interface CreateCancellationDialogProps {
  orderId: string;
  orderNumber: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCancellationDialog({
  orderId,
  orderNumber,
  onClose,
  onSuccess,
}: CreateCancellationDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const cancelMut = useCreateCancellation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      reason: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await cancelMut.mutateAsync({
        orderId,
        reason: values.reason,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, 'Failed to request cancellation'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">Request Order Cancellation</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-2xs text-amber-900 leading-relaxed space-y-1">
            <span className="font-bold block text-amber-950">⚠️ Important Notice:</span>
            <span>Submitting this cancellation will automatically update the order state to <strong>CANCELLED</strong>, release reserved stock, and record this reason for the customer.</span>
          </div>

          <div>
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Order Reference</span>
            <span className="text-xs font-bold text-neutral-800 font-mono">{orderNumber}</span>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider">Cancellation Reason / Customer Note</label>
            <textarea
              {...register('reason')}
              rows={4}
              placeholder="Explain reason (e.g. Test item was placed by accident. Full refund will be processed within 1 business day)..."
              className="mt-1.5 w-full bg-neutral-50 border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-rose-600 focus:bg-white resize-none"
            />
            {errors.reason && <p className="text-[10px] text-red-600 mt-1 font-medium">{errors.reason.message}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition hover:bg-neutral-100 rounded-xl cursor-pointer"
            >
              Back / Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting || cancelMut.isPending}
              className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {(isSubmitting || cancelMut.isPending) && <ButtonLoader />}
              <span>Confirm Order Cancellation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
