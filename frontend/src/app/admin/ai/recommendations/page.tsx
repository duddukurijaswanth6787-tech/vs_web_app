'use client';

import React, { useState } from 'react';
import { Sparkles, Cpu, BarChart3, RefreshCw, ListOrdered } from 'lucide-react';
import { adminOpsApi } from '@/features/admin-ops/admin-ops.api';
import { useToast } from '@/components/toast/ToastProvider';
import { getApiErrorMessage } from '@/utils/api-error';

const WEIGHTS_KEY = 'vd_ai_rec_weights';

export default function AiRecommendationsAdminPage() {
  const { toast } = useToast();
  const [customerUserId, setCustomerUserId] = useState('');
  const [visualWeight, setVisualWeight] = useState(() => {
    if (typeof window === 'undefined') return 70;
    try {
      return JSON.parse(localStorage.getItem(WEIGHTS_KEY) || '{}').visual ?? 70;
    } catch {
      return 70;
    }
  });
  const [purchaseHistoryWeight, setPurchaseHistoryWeight] = useState(() => {
    if (typeof window === 'undefined') return 30;
    try {
      return JSON.parse(localStorage.getItem(WEIGHTS_KEY) || '{}').purchase ?? 30;
    } catch {
      return 30;
    }
  });
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);

  const handleGenerate = async () => {
    if (!customerUserId.trim()) {
      toast('warning', 'Customer user ID required', 'Enter the customer account UUID to generate recommendations.');
      return;
    }
    setLoading(true);
    try {
      const result = await adminOpsApi.generateRecommendations(customerUserId.trim());
      const typed = result as { recommendedProducts?: Array<Record<string, unknown>>; data?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
      const list = Array.isArray(typed) ? typed : Array.isArray(typed?.recommendedProducts) ? typed.recommendedProducts! : Array.isArray(typed?.data) ? typed.data! : [];
      setItems(list);
      toast('success', 'Recommendations generated', `${list.length} items computed for this customer.`);
    } catch (err) {
      toast('error', 'Generate failed', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async () => {
    if (!customerUserId.trim()) {
      toast('warning', 'Customer user ID required');
      return;
    }
    setLoading(true);
    try {
      const result = await adminOpsApi.listRecommendations(customerUserId.trim(), { limit: 50 });
      const typed = result as { data?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
      const list = Array.isArray(typed) ? typed : Array.isArray((typed as { data?: Array<Record<string, unknown>> })?.data) ? (typed as { data?: Array<Record<string, unknown>> }).data! : [];
      setItems(list);
      toast('success', 'Loaded recommendations', `${list.length} items`);
    } catch (err) {
      toast('error', 'Load failed', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWeights = () => {
    localStorage.setItem(
      WEIGHTS_KEY,
      JSON.stringify({ visual: visualWeight, purchase: purchaseHistoryWeight }),
    );
    toast('success', 'Weights saved', 'Recommendation weighting preferences stored for this admin console.');
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-neutral-900 flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-[#0284c7]" />
            <span>Customer AI Recommendations</span>
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Generate and inspect personalized product recommendations via `/ai/recommendations`.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="px-4 py-2 bg-[#0284c7] hover:bg-[#0B3B78] disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
        >
          <Cpu className="w-4 h-4 text-rose-200" />
          <span>{loading ? 'Working…' : 'Re-compute Recommendations'}</span>
        </button>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-neutral-900">Target Customer</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={customerUserId}
            onChange={(e) => setCustomerUserId(e.target.value)}
            placeholder="Customer user UUID"
            className="flex-1 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono focus:outline-hidden focus:border-[#0284c7]"
          />
          <button
            type="button"
            onClick={handleLoad}
            disabled={loading}
            className="px-4 py-2 border border-neutral-300 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-neutral-50"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Load Existing
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#0284c7]" />
          <span>Recommendation Engine Weighting Matrix</span>
        </h2>

        <div className="space-y-4 max-w-xl">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-neutral-800">
              <span>Visual Similarity Weight</span>
              <span className="text-[#0284c7]">{visualWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={visualWeight}
              onChange={(e) => {
                const v = Number(e.target.value);
                setVisualWeight(v);
                setPurchaseHistoryWeight(100 - v);
              }}
              className="w-full accent-[#0284c7]"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-neutral-800">
              <span>Customer Purchase History Weight</span>
              <span className="text-[#0284c7]">{purchaseHistoryWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={purchaseHistoryWeight}
              onChange={(e) => {
                const v = Number(e.target.value);
                setPurchaseHistoryWeight(v);
                setVisualWeight(100 - v);
              }}
              className="w-full accent-[#0284c7]"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveWeights}
            className="px-5 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            Save Weighting Rules
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-3">
        <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-[#0284c7]" />
          Recommendation Results ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="text-xs text-neutral-500">No results yet. Generate or load for a customer.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-3 py-2">Product ID</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => (
                  <tr key={String(row.id || row.productId || idx)} className="border-t border-neutral-100">
                    <td className="px-3 py-2 font-mono">{String(row.productId || '')}</td>
                    <td className="px-3 py-2">{String(row.type || '')}</td>
                    <td className="px-3 py-2 font-bold text-[#0284c7]">{String(row.score || '')}</td>
                    <td className="px-3 py-2 text-neutral-600">{String(row.reason || '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
