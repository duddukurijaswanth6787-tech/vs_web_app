'use client';

import React, { useState } from 'react';
import { X, Plus, Package2, Sparkles, CheckCircle2, AlertCircle, Layers, Store, Globe, ArrowRight } from 'lucide-react';
import { useIncreaseStock } from '../inventory.hooks';
import type { InventoryResponse } from '../inventory.types';
import { ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/api-error';

export interface GroupedProductInventory {
  productId: string;
  productName: string;
  category?: string;
  brand?: string;
  imageUrl?: string;
  totalAvailable: number;
  totalReserved: number;
  overallStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  variants: InventoryResponse[];
}

interface ProductStockModalProps {
  product: GroupedProductInventory;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ProductStockModal({
  product,
  onClose,
  onSuccess,
}: ProductStockModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id || ''
  );
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState<string>('Inbound Purchase Restock / Counter Inbound');
  const [channelTarget, setChannelTarget] = useState<'ALL' | 'POS_ONLY' | 'ONLINE_ONLY'>('ALL');
  const [remarks, setRemarks] = useState<string>('Restocked via Admin Live Inventory');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const increaseMut = useIncreaseStock();

  const activeVariantInventory = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const currentAvailable = activeVariantInventory?.availableQuantity ?? 0;
  const newProjectedAvailable = currentAvailable + (quantity || 0);

  const handleQuickQty = (qty: number) => {
    setQuantity(qty);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVariantInventory) {
      setError('Please select a valid variant/size.');
      return;
    }
    if (!quantity || quantity <= 0) {
      setError('Please enter a positive restock quantity.');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      await increaseMut.mutateAsync({
        id: activeVariantInventory.id,
        dto: {
          quantity,
          reason: `${reason} [Channel: ${channelTarget}]`,
          remarks: remarks || `Restock for ${channelTarget}`,
        },
      });

      const sizeLabel = activeVariantInventory.variant?.title || activeVariantInventory.variant?.sku || 'Item';
      setSuccessMsg(`✅ Successfully added +${quantity} units to ${sizeLabel}! Live Stock: ${newProjectedAvailable}`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 950);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to add stock'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-neutral-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Fixed Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 p-4 sm:p-5 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-neutral-900 font-sans tracking-tight">
                Add Inbound Stock
              </h3>
              <p className="text-xs text-neutral-500">
                Restock sizes/variants and assign channel availability.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Modal Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Product Identity Summary Card */}
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-white border border-neutral-200 flex items-center justify-center font-bold text-neutral-400 shrink-0 overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.productName} className="w-full h-full object-cover" />
                ) : (
                  <Package2 className="w-5 h-5 text-neutral-400" />
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-neutral-900 truncate">{product.productName}</h4>
                <p className="text-2xs text-neutral-400 font-medium">
                  {product.category || 'Catalog Product'} • {product.variants.length} Sizes/Variants Available
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-2xs text-neutral-400 uppercase font-semibold block">Total Live Stock</span>
              <span className="font-mono font-black text-sm text-neutral-900">{product.totalAvailable} units</span>
            </div>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form id="stock-modal-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Select Size / Variant to Restock */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-neutral-700">
                  1. Select Size / Variant to Restock *
                </label>
                <span className="text-[10px] text-neutral-400 font-medium">
                  Scroll to view all {product.variants.length} sizes
                </span>
              </div>
              <div className="max-h-52 overflow-y-auto p-1.5 rounded-xl border border-neutral-200 bg-neutral-50/50">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {product.variants.map((v) => {
                    const isSelected = v.id === selectedVariantId;
                    const sizeTitle = v.variant?.title || 'Variant';
                    const skuCode = v.variant?.sku || v.variantId.substring(0, 8);
                    const isOut = v.availableQuantity <= 0;
                    const isLow = v.availableQuantity > 0 && v.availableQuantity <= (v.minimumStock || 5);

                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                            : 'border-neutral-200 bg-white hover:bg-neutral-100 text-neutral-900'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-black text-xs">{sizeTitle}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              isSelected
                                ? 'bg-neutral-800 text-neutral-200'
                                : isOut
                                ? 'bg-rose-100 text-rose-700'
                                : isLow
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {v.availableQuantity} in stock
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono mt-1 truncate ${
                            isSelected ? 'text-neutral-400' : 'text-neutral-500'
                          }`}
                        >
                          {skuCode}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 2: Channel Availability Target */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                2. Target Sales Channel Visibility *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setChannelTarget('ALL')}
                  className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    channelTarget === 'ALL'
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                      : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                  }`}
                >
                  <span>Omnichannel (Both)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannelTarget('POS_ONLY')}
                  className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    channelTarget === 'POS_ONLY'
                      ? 'border-sky-600 bg-sky-600 text-white shadow-xs'
                      : 'border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>In-Store (POS)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannelTarget('ONLINE_ONLY')}
                  className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    channelTarget === 'ONLINE_ONLY'
                      ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                      : 'border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Online Web</span>
                </button>
              </div>
            </div>

            {/* Step 3: Restock Quantity */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-neutral-700">
                  3. Quantity to Add *
                </label>
                <div className="flex items-center gap-1">
                  {[10, 25, 50, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleQuickQty(preset)}
                      className={`px-2 py-0.5 rounded-md text-2xs font-mono font-bold transition cursor-pointer ${
                        quantity === preset
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      +{preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm font-mono font-bold text-neutral-900 focus:bg-white focus:outline-none focus:border-neutral-900 transition"
                    placeholder="Quantity"
                  />
                </div>

                {/* Projection Box */}
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between text-xs text-emerald-950 font-bold">
                  <span className="text-emerald-700 font-medium">New Stock:</span>
                  <span className="font-mono text-sm">
                    {currentAvailable} + {quantity || 0} = <span className="text-emerald-900 font-black">{newProjectedAvailable} units</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Restock Reason / Inbound Note */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Restock Notes / Vendor PO
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs text-neutral-800 focus:bg-white focus:outline-none focus:border-neutral-900 transition"
                placeholder="e.g. Inbound shipment from Surat workshop"
              />
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-100 bg-neutral-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-neutral-600 hover:bg-neutral-200/60 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="stock-modal-form"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? <ButtonLoader /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Confirm & Add +{quantity} Stock</span>
          </button>
        </div>
      </div>
    </div>
  );
}
