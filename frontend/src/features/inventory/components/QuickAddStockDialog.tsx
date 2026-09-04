'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Plus, Package2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useIncreaseStock, useInventoryList } from '../inventory.hooks';
import type { InventoryResponse } from '../inventory.types';
import { ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/api-error';

const schema = z.object({
  inventoryId: z.string().min(1, 'Please select an item to restock'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  reason: z.string().min(1, 'Reason is required').max(200),
  remarks: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface QuickAddStockDialogProps {
  initialInventory?: InventoryResponse | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuickAddStockDialog({
  initialInventory,
  onClose,
  onSuccess,
}: QuickAddStockDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const increaseMut = useIncreaseStock();
  const { data: listData } = useInventoryList({ limit: 100 });
  const allInventories = listData?.data ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      inventoryId: initialInventory?.id || '',
      quantity: 10,
      reason: 'Inbound purchase order / Counter restock',
      remarks: 'Added via Admin Quick Stock In',
    },
  });

  const selectedInventoryId = watch('inventoryId');
  const selectedItem = allInventories.find((i) => i.id === selectedInventoryId) || initialInventory;

  const currentQty = selectedItem?.availableQuantity ?? 0;
  const addQty = watch('quantity') || 0;
  const newProjectedQty = currentQty + addQty;

  const handleQuickPreset = (qty: number) => {
    setValue('quantity', qty);
  };

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setSuccessMsg(null);
    try {
      await increaseMut.mutateAsync({
        id: values.inventoryId,
        dto: {
          quantity: values.quantity,
          reason: values.reason,
          remarks: values.remarks,
        },
      });
      setSuccessMsg(`✅ Successfully added +${values.quantity} units to SKU ${selectedItem?.variant?.sku || ''}!`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 900);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to add stock'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-neutral-900 font-sans tracking-tight">
                Quick Inbound Stock In
              </h3>
              <p className="text-xs text-neutral-400">
                Instantly increment available warehouse & retail inventory quantities.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          {/* Target Variant / SKU Selection */}
          <div>
            <label className="block text-2xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
              Select Product SKU / Variant
            </label>
            <select
              {...register('inventoryId')}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="">-- Choose Product Variant SKU --</option>
              {allInventories.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.variant?.productName ? `${inv.variant.productName} — ` : ''}
                  {inv.variant?.sku || inv.variantId} ({inv.variant?.title || 'Variant'}) — Stock: {inv.availableQuantity}
                </option>
              ))}
            </select>
            {errors.inventoryId && (
              <p className="text-2xs text-red-600 mt-1 font-semibold">{errors.inventoryId.message}</p>
            )}
          </div>

          {/* Quick Increment Presets */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-2xs font-bold text-neutral-500 uppercase tracking-wider">
                Quantity to Add (+)
              </label>
              <div className="flex gap-1.5">
                {[5, 10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleQuickPreset(preset)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-700 transition"
                  >
                    +{preset}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="number"
              min={1}
              {...register('quantity', { valueAsNumber: true })}
              placeholder="e.g. 25"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            {errors.quantity && (
              <p className="text-2xs text-red-600 mt-1 font-semibold">{errors.quantity.message}</p>
            )}
          </div>

          {/* Stock Preview Banner */}
          {selectedItem && (
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-2xs font-bold text-emerald-800 uppercase block">
                  Projected Stock Level
                </span>
                <span className="text-xs text-neutral-600 font-medium">
                  Current: <strong className="font-mono">{currentQty}</strong> &rarr; After Addition:{' '}
                  <strong className="font-mono text-emerald-700 font-black text-sm">{newProjectedQty}</strong>
                </span>
              </div>
              <span className="px-2 py-1 rounded bg-emerald-600 text-white font-mono font-black text-xs">
                +{addQty} Units
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-2xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
              Restock Reason / Source
            </label>
            <input
              type="text"
              {...register('reason')}
              placeholder="e.g. Factory delivery, supplier purchase order, seasonal restock"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            {errors.reason && (
              <p className="text-2xs text-red-600 mt-1 font-semibold">{errors.reason.message}</p>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-2xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
              Internal Notes / Reference (Optional)
            </label>
            <input
              type="text"
              {...register('remarks')}
              placeholder="e.g. PO-8921 received in Jubilee Hills warehouse"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedInventoryId}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? <ButtonLoader /> : <Plus className="w-4 h-4" />}
              Confirm Stock In (+{addQty})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
