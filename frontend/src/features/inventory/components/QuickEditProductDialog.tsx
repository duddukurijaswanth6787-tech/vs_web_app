'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Edit3, CheckCircle2, AlertCircle, Sparkles, Tag, Layers, Barcode } from 'lucide-react';
import { useUpdateProduct } from '@/features/catalog/products/product.hooks';
import { useUpdateVariant } from '@/features/catalog/variants/variant.hooks';
import { ProductChannel } from '@/features/catalog/products/product.types';
import { ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/api-error';

const schema = z.object({
  title: z.string().min(2, 'Product title must be at least 2 characters'),
  price: z.number().min(0, 'Price must be non-negative'),
  compareAtPrice: z.number().min(0).optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  channelTarget: z.enum(['ALL', 'POS_ONLY', 'ONLINE_ONLY']),
});

type FormValues = z.infer<typeof schema>;

export interface QuickEditProductData {
  productId: string;
  variantId?: string;
  title: string;
  sku?: string;
  barcode?: string;
  price?: number;
  compareAtPrice?: number;
  channelTarget?: 'ALL' | 'POS_ONLY' | 'ONLINE_ONLY';
}

interface QuickEditProductDialogProps {
  product: QuickEditProductData;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuickEditProductDialog({
  product,
  onClose,
  onSuccess,
}: QuickEditProductDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const updateProductMut = useUpdateProduct();
  const updateVariantMut = useUpdateVariant();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: product.title || '',
      price: product.price || 0,
      compareAtPrice: product.compareAtPrice || 0,
      sku: product.sku || '',
      barcode: product.barcode || '',
      channelTarget: product.channelTarget || 'ALL',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const channelMapped =
        values.channelTarget === 'POS_ONLY'
          ? ProductChannel.STORE
          : values.channelTarget === 'ONLINE_ONLY'
          ? ProductChannel.ONLINE
          : ProductChannel.BOTH;

      // Update parent product details
      await updateProductMut.mutateAsync({
        id: product.productId,
        dto: {
          name: values.title,
          basePrice: values.price,
          salePrice: values.compareAtPrice || undefined,
          channel: channelMapped,
        },
      });

      // If variantId is present, update variant specific price override
      if (product.variantId) {
        await updateVariantMut.mutateAsync({
          id: product.variantId,
          dto: {
            priceOverride: values.price,
            salePriceOverride: values.compareAtPrice || undefined,
          },
        });
      }

      setSuccessMsg('✅ Product details updated successfully!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 900);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to update product'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-sky-50 text-[#0284c7] rounded-xl border border-sky-100">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-neutral-900 font-sans tracking-tight">
                Quick Edit Product & Pricing
              </h3>
              <p className="text-xs text-neutral-500">
                Update name, price, SKU & channels directly from inventory.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition cursor-pointer"
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

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {/* Product Title */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Product Title / Name *
            </label>
            <input
              type="text"
              {...register('title')}
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs text-neutral-900 font-medium focus:bg-white focus:outline-none focus:border-neutral-900 transition"
              placeholder="e.g. Kanjeevaram Pure Silk Saree"
            />
            {errors.title && (
              <p className="mt-1 text-2xs text-red-600 font-medium">{errors.title.message}</p>
            )}
          </div>

          {/* Pricing Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                step="any"
                {...register('price', { valueAsNumber: true })}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs font-mono font-bold text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900 transition"
                placeholder="0"
              />
              {errors.price && (
                <p className="mt-1 text-2xs text-red-600 font-medium">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                MRP / Compare Price (₹)
              </label>
              <input
                type="number"
                step="any"
                {...register('compareAtPrice', { valueAsNumber: true })}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs font-mono text-neutral-600 focus:bg-white focus:outline-none focus:border-neutral-900 transition"
                placeholder="0"
              />
            </div>
          </div>

          {/* SKU and Barcode Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                SKU Identifier
              </label>
              <input
                type="text"
                {...register('sku')}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs font-mono text-neutral-800 focus:bg-white focus:outline-none focus:border-neutral-900 transition uppercase"
                placeholder="e.g. SILK-SAR-01"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Barcode / EAN
              </label>
              <input
                type="text"
                {...register('barcode')}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs font-mono text-neutral-800 focus:bg-white focus:outline-none focus:border-neutral-900 transition"
                placeholder="e.g. 890000000001"
              />
            </div>
          </div>

          {/* Channel Target Selector */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Sales Channel Visibility
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 cursor-pointer hover:bg-neutral-100 transition text-xs font-semibold">
                <input
                  type="radio"
                  value="ALL"
                  {...register('channelTarget')}
                  className="text-neutral-900 focus:ring-0"
                />
                <span>Both (POS + Web)</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-sky-200 bg-sky-50/50 cursor-pointer hover:bg-sky-50 transition text-xs font-semibold text-sky-900">
                <input
                  type="radio"
                  value="POS_ONLY"
                  {...register('channelTarget')}
                  className="text-sky-600 focus:ring-0"
                />
                <span>In-Store POS</span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 cursor-pointer hover:bg-purple-50 transition text-xs font-semibold text-purple-900">
                <input
                  type="radio"
                  value="ONLINE_ONLY"
                  {...register('channelTarget')}
                  className="text-purple-600 focus:ring-0"
                />
                <span>Online Web</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <ButtonLoader /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
