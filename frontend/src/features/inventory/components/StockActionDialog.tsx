'use client';

import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';
import {
  useIncreaseStock,
  useDecreaseStock,
  useAdjustStock,
  useReserveStock,
  useReleaseStock,
  useReturnStock,
  useDamageStock,
} from '../inventory.hooks';
import { InventoryResponse, StockMovementDto, AdjustStockDto } from '../inventory.types';
import { ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/api-error';

const schema = z
  .object({
    action: z.enum(['INCREASE', 'DECREASE', 'ADJUST', 'RESERVE', 'RELEASE', 'RETURN', 'DAMAGE']),
    // ADJUST sets an absolute target quantity (0 is a valid target -- "we
    // have none left"); every other action is a positive magnitude to move.
    quantity: z.number().int(),
    reason: z.string().min(1, 'Reason is required').max(200, 'Reason cannot exceed 200 characters'),
    remarks: z.string().max(500, 'Remarks cannot exceed 500 characters').optional(),
    referenceType: z.string().optional(),
    referenceId: z.string().uuid('Reference ID must be a valid UUID').or(z.literal('')).optional(),
  })
  .superRefine((values, ctx) => {
    const min = values.action === 'ADJUST' ? 0 : 1;
    if (values.quantity < min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['quantity'],
        message:
          values.action === 'ADJUST'
            ? 'Target quantity cannot be negative'
            : 'Quantity must be at least 1',
      });
    }
  });

type FormValues = z.infer<typeof schema>;

interface StockActionDialogProps {
  inventory: InventoryResponse;
  onClose: () => void;
}

export default function StockActionDialog({ inventory, onClose }: StockActionDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const increaseMut = useIncreaseStock();
  const decreaseMut = useDecreaseStock();
  const adjustMut = useAdjustStock();
  const reserveMut = useReserveStock();
  const releaseMut = useReleaseStock();
  const returnMut = useReturnStock();
  const damageMut = useDamageStock();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      action: 'INCREASE',
      quantity: 1,
      reason: '',
      remarks: '',
      referenceType: '',
      referenceId: '',
    },
  });

  const selectedAction = useWatch({ control, name: 'action' });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const payload: StockMovementDto = {
        quantity: values.quantity,
        reason: values.reason,
        remarks: values.remarks || undefined,
      };

      if (values.referenceType) {
        payload.referenceType = values.referenceType;
      }
      if (values.referenceId) {
        payload.referenceId = values.referenceId;
      }

      switch (values.action) {
        case 'INCREASE':
          await increaseMut.mutateAsync({ id: inventory.id, dto: payload });
          break;
        case 'DECREASE':
          await decreaseMut.mutateAsync({ id: inventory.id, dto: payload });
          break;
        case 'ADJUST': {
          const adjustDto: AdjustStockDto = {
            quantity: values.quantity,
            reason: values.reason,
            remarks: values.remarks,
          };
          await adjustMut.mutateAsync({
            id: inventory.id,
            dto: adjustDto,
          });
          break;
        }
        case 'RESERVE':
          await reserveMut.mutateAsync({ id: inventory.id, dto: payload });
          break;
        case 'RELEASE':
          await releaseMut.mutateAsync({ id: inventory.id, dto: payload });
          break;
        case 'RETURN':
          await returnMut.mutateAsync({ id: inventory.id, dto: payload });
          break;
        case 'DAMAGE':
          await damageMut.mutateAsync({ id: inventory.id, dto: payload });
          break;
      }
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, 'Failed to update stock'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#0284c7]">Manage Stock levels</h3>
            <p className="text-[10px] text-neutral-400 mt-0.5">SKU: {inventory.variant?.sku || inventory.variantId}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-3 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* Action type */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Operation</label>
            <select
              {...register('action')}
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-[#0284c7]"
            >
              <option value="INCREASE">Increase Stock</option>
              <option value="DECREASE">Decrease Stock</option>
              <option value="ADJUST">Adjust Stock (Exact Quantity Override)</option>
              <option value="RESERVE">Reserve Stock</option>
              <option value="RELEASE">Release Reserved Stock</option>
              <option value="RETURN">Process Return</option>
              <option value="DAMAGE">Report Damage</option>
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              {selectedAction === 'ADJUST' ? 'New Total Quantity' : 'Quantity'}
            </label>
            <input
              type="number"
              min={selectedAction === 'ADJUST' ? 0 : 1}
              {...register('quantity', { valueAsNumber: true })}
              placeholder={selectedAction === 'ADJUST' ? 'e.g. 47 (from a physical stock count)' : 'Quantity to adjust'}
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-[#0284c7]"
            />
            {errors.quantity && <p className="text-[10px] text-red-600 mt-1">{errors.quantity.message}</p>}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Reason</label>
            <input
              type="text"
              {...register('reason')}
              placeholder="e.g. Inbound purchase order, physical inventory count, damage claim"
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-[#0284c7]"
            />
            {errors.reason && <p className="text-[10px] text-red-600 mt-1">{errors.reason.message}</p>}
          </div>

          {/* Remarks (Optional) */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Remarks (Optional)</label>
            <textarea
              {...register('remarks')}
              rows={2}
              placeholder="Provide internal documentation..."
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-[#0284c7] resize-none"
            />
          </div>

          {/* Optional Reference params (for actions other than ADJUST) */}
          {selectedAction !== 'ADJUST' && (
            <div className="grid grid-cols-2 gap-3 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Ref Type</label>
                <input
                  type="text"
                  {...register('referenceType')}
                  placeholder="e.g. ORDER"
                  className="mt-1 w-full bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-2xs text-neutral-800 focus:outline-none focus:border-[#0284c7]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Ref UUID</label>
                <input
                  type="text"
                  {...register('referenceId')}
                  placeholder="UUID Format"
                  className="mt-1 w-full bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-2xs text-neutral-800 focus:outline-none focus:border-[#0284c7]"
                />
                {errors.referenceId && <p className="text-[9px] text-red-600 mt-1">{errors.referenceId.message}</p>}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0284c7] hover:bg-[#0B3B78] text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm disabled:opacity-55 flex items-center"
            >
              {isSubmitting && <ButtonLoader />} Confirm Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
