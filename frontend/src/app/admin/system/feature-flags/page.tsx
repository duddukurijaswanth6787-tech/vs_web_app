'use client';

import React, { useState, useEffect } from 'react';
import { Shield, ToggleLeft, ToggleRight, Sparkles, AlertCircle, CheckCircle2, RotateCw, Lock, Sliders, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/utils/api-error';

interface FeatureToggle {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
}

const DEFAULT_TOGGLES: FeatureToggle[] = [
  { id: '1', key: 'order_cancellation', name: 'Customer Order Cancellation', description: 'Allows customers to cancel orders from their order history page before shipment.', enabled: true, category: 'ORDERS' },
  { id: '2', key: 'wallet_system', name: 'Customer Wallet Balance', description: 'Enables customer wallet balance, top-up, and instant store credit refunds.', enabled: true, category: 'FINANCE' },
  { id: '3', key: 'loyalty_points', name: 'Loyalty Rewards Program', description: 'Enables earning and redeeming loyalty points on purchases.', enabled: true, category: 'MARKETING' },
  { id: '4', key: 'product_reviews', name: 'Customer Product Reviews & Photos', description: 'Enables submitting and viewing product reviews with photo attachments.', enabled: true, category: 'STOREFRONT' },
  { id: '5', key: 'order_returns', name: 'Order Return & Exchange Portal', description: 'Enables 7-day doorstep return request workflow for delivered orders.', enabled: true, category: 'ORDERS' },
  { id: '6', key: 'customer_wishlist', name: 'Customer Wishlist', description: 'Allows logged-in customers to save items to their personal wishlist.', enabled: true, category: 'STOREFRONT' },
  { id: '7', key: 'gift_wrapping', name: 'Luxury Gift Packaging', description: 'Allows customers to request gift wrapping and custom card messages during checkout.', enabled: true, category: 'CHECKOUT' },
  { id: '8', key: 'b2b_invoicing', name: 'B2B Wholesale GSTIN Invoicing', description: 'Enables entering company tax details (GSTIN) and wholesale B2B pricing.', enabled: true, category: 'CHECKOUT' },
  { id: '9', key: 'instagram_reels', name: 'Instagram Reels & Video Feed', description: 'Renders the live Instagram Reels carousel on the homepage and video feed.', enabled: true, category: 'STOREFRONT' },
  { id: '10', key: 'ai_chatbot', name: 'AI Stylist Chat Assistant', description: 'Renders the AI assistant for saree styling and size recommendations.', enabled: true, category: 'AI' },
];

export default function FeatureFlagsPage() {
  const { user } = useAuth();
  const [toggles, setToggles] = useState<FeatureToggle[]>(DEFAULT_TOGGLES);
  const [loading, setLoading] = useState(false);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchToggles = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:4000/api/v1/admin/storefront/feature-toggles', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        const apiToggles = data.data || data;
        if (Array.isArray(apiToggles) && apiToggles.length > 0) {
          // Merge API toggles with defaults
          const map = new Map(apiToggles.map((t: FeatureToggle) => [t.key, t.enabled]));
          setToggles((prev) =>
            prev.map((t) => ({
              ...t,
              enabled: map.has(t.key) ? Boolean(map.get(t.key)) : t.enabled,
            }))
          );
        }
      }
    } catch {
      // Keep defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToggles();
  }, []);

  const handleToggle = async (key: string, currentStatus: boolean) => {
    setUpdatingKey(key);
    setErrorMsg('');
    setSuccessMsg('');
    const newStatus = !currentStatus;

    // Optimistic update
    setToggles((prev) =>
      prev.map((t) => (t.key === key ? { ...t, enabled: newStatus } : t))
    );

    try {
      const res = await fetch(`http://127.0.0.1:4000/api/v1/admin/storefront/feature-toggles/${key}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ enabled: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update feature toggle');
      }

      setSuccessMsg(`Feature "${key.replace(/_/g, ' ').toUpperCase()}" is now ${newStatus ? 'ENABLED' : 'DISABLED'}. Storefront will update dynamically.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      // Revert optimism on error
      setToggles((prev) =>
        prev.map((t) => (t.key === key ? { ...t, enabled: currentStatus } : t))
      );
      setErrorMsg(getApiErrorMessage(err, 'Failed to update feature toggle'));
    } finally {
      setUpdatingKey(null);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans text-neutral-900">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#800020] to-[#500014] rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-200 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4" /> Super Admin System Control
          </div>
          <h1 className="text-2xl font-bold font-serif">Storefront Feature Switches & Master Controls</h1>
          <p className="text-xs text-rose-100/90 max-w-2xl">
            Control which features, buttons, and workflows are active on the customer storefront. Toggling switches here updates the user website in real time without code deployments.
          </p>
        </div>

        <button
          onClick={fetchToggles}
          disabled={loading}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl shadow-2xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-2xl shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Feature Toggles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {toggles.map((item) => {
          const isUpdating = updatingKey === item.key;
          return (
            <div
              key={item.key}
              className={`bg-white border rounded-2xl p-5 shadow-2xs transition-all flex flex-col justify-between space-y-3 ${
                item.enabled ? 'border-neutral-200 hover:border-neutral-300' : 'border-neutral-200/60 opacity-75 bg-neutral-50/50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-900">{item.name}</span>
                    <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md uppercase">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed">{item.description}</p>
                </div>

                {/* Master Toggle Switch */}
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleToggle(item.key, item.enabled)}
                  className={`relative shrink-0 w-12 h-7 rounded-full transition-colors cursor-pointer p-1 border ${
                    item.enabled
                      ? 'bg-[#800020] border-[#800020]'
                      : 'bg-neutral-200 border-neutral-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs flex items-center justify-center ${
                      item.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  >
                    {isUpdating ? (
                      <RotateCw className="w-3 h-3 text-neutral-400 animate-spin" />
                    ) : item.enabled ? (
                      <span className="w-2 h-2 rounded-full bg-[#800020]" />
                    ) : null}
                  </div>
                </button>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                <span className="font-mono text-neutral-400">KEY: {item.key}</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md ${
                    item.enabled ? 'text-emerald-700 bg-emerald-50' : 'text-neutral-500 bg-neutral-100'
                  }`}
                >
                  {item.enabled ? '● ACTIVE ON STOREFRONT' : '○ DISABLED'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
