'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';
import { useUpdateInventory } from '../inventory.hooks';
import { InventoryResponse } from '../inventory.types';
import { ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/api-error';

const schema = z.object({
  minimumStock: z.number().int().min(0, 'Minimum stock must be at least 0'),
  maximumStock: z.number().int().min(0, 'Maximum stock must be at least 0'),
  reorderLevel: z.number().int().min(0, 'Reorder level must be at least 0'),
  allowBackorder: z.boolean(),
  trackInventory: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface UpdateInventoryDialogProps {
  inventory: InventoryResponse;
  onClose: () => void;
}

export default function UpdateInventoryDialog({ inventory, onClose }: UpdateInventoryDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const updateMut = useUpdateInventory();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      minimumStock: inventory.minimumStock || 0,
      maximumStock: inventory.maximumStock || 0,
      reorderLevel: inventory.reorderLevel || 0,
      allowBackorder: inventory.allowBackorder || false,
      trackInventory: inventory.trackInventory || false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await updateMut.mutateAsync({
        id: inventory.id,
        dto: values,
      });
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorMessage(err, 'Failed to update settings'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#0284c7]">Inventory Settings</h3>
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
          <div className="grid grid-cols-2 gap-4">
            {/* Minimum Stock */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Min Stock</label>
              <input
                type="number"
                {...register('minimumStock', { valueAsNumber: true })}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-[#0284c7]"
              />
              {errors.minimumStock && <p className="text-[10px] text-red-600 mt-1">{errors.minimumStock.message}</p>}
            </div>

            {/* Maximum Stock */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Max Stock</label>
              <input
                type="number"
                {...register('maximumStock', { valueAsNumber: true })}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-[#0284c7]"
              />
              {errors.maximumStock && <p className="text-[10px] text-red-600 mt-1">{errors.maximumStock.message}</p>}
            </div>
          </div>

          {/* Reorder Level */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Reorder Level</label>
            <input
              type="number"
              {...register('reorderLevel', { valueAsNumber: true })}
              className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-[#0284c7]"
            />
            {errors.reorderLevel && <p className="text-[10px] text-red-600 mt-1">{errors.reorderLevel.message}</p>}
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('allowBackorder')}
                className="h-4 w-4 rounded border-neutral-300 text-[#0284c7] focus:ring-[#0284c7] focus:ring-offset-0"
              />
              <div>
                <span className="text-xs font-semibold text-neutral-700">Allow Backorders</span>
                <p className="text-[10px] text-neutral-400">Accept orders when stock is out of stock</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('trackInventory')}
                className="h-4 w-4 rounded border-neutral-300 text-[#0284c7] focus:ring-[#0284c7] focus:ring-offset-0"
              />
              <div>
                <span className="text-xs font-semibold text-neutral-700">Track Inventory</span>
                <p className="text-[10px] text-neutral-400">Enable automatic stock deductions on orders</p>
              </div>
            </label>
          </div>

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
              {isSubmitting && <ButtonLoader />} Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
