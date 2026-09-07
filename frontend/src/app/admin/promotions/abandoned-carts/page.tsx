'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart,
  TrendingUp,
  Clock,
  Sparkles,
  Send,
  CheckCircle2,
  RefreshCw,
  Search,
  MessageSquare,
  Gift,
  Mail,
  Phone,
  ArrowRight,
  Percent,
  CheckSquare,
  Square,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { formatMoney } from '@/utils/format';
import DataTable from '@/components/tables/DataTable';
import type { Column } from '@/components/tables/DataTable';

interface AbandonedCartItem {
  productId: string;
  productName: string;
  variantTitle?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

interface AbandonedCart {
  cartId: string;
  customerId?: string;
  guestId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  isRegistered: boolean;
  itemCount: number;
  items: AbandonedCartItem[];
  subtotal: number;
  lastActive: string;
  abandonedDurationHours: number;
  abandonedDurationFormatted: string;
  recoveryStatus: 'PENDING' | 'SENT' | 'RECOVERED';
  suggestedDiscountCode: string;
  checkoutResumeUrl: string;
}

interface AbandonedStats {
  totalAbandonedCarts: number;
  totalPotentialRevenue: number;
  averageCartValue: number;
  highValueCartsCount: number;
  recoveredCartsCount: number;
  recoveryRatePercent: number;
}

export default function AbandonedCartsPage() {
  const [hours, setHours] = useState<number>(2);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<AbandonedCart[]>([]);
  const [stats, setStats] = useState<AbandonedStats | null>(null);

  // Selection & Bulk recovery
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState('');

  // Recovery modal
  const [activeCart, setActiveCart] = useState<AbandonedCart | null>(null);
  const [couponCode, setCouponCode] = useState('COMEBACK10');
  const [discountPercent, setDiscountPercent] = useState(10);
  const [customMsg, setCustomMsg] = useState('');
  const [dispatchStatus, setDispatchStatus] = useState<Record<string, boolean>>({});

  const fetchAbandonedCarts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get(`/cart/admin/abandoned?hours=${hours}`);
      const payload = res.data?.data;
      if (payload) {
        setData(payload.carts || []);
        setStats(payload.stats || null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load abandoned carts');
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    fetchAbandonedCarts();
  }, [fetchAbandonedCarts]);

  const handleSendSingleRecovery = async (cart: AbandonedCart) => {
    setIsRecovering(true);
    try {
      await apiClient.post(`/cart/admin/abandoned/${cart.cartId}/send-recovery`, {
        discountCode: couponCode,
        discountPercent,
        customMessage: customMsg || undefined,
        channel: 'ALL',
      });
      setDispatchStatus((prev) => ({ ...prev, [cart.cartId]: true }));
      setRecoverySuccessMsg(`Recovery reminder sent to ${cart.customerName}!`);
      setActiveCart(null);
      setTimeout(() => setRecoverySuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to dispatch recovery reminder');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleBulkRecovery = async () => {
    if (!selectedIds.size) return;
    setIsRecovering(true);
    try {
      const res = await apiClient.post('/cart/admin/abandoned/bulk-send-recovery', {
        cartIds: Array.from(selectedIds),
        discountCode: couponCode,
        discountPercent,
        channel: 'ALL',
      });
      const count = res.data?.data?.successful || selectedIds.size;
      setRecoverySuccessMsg(`Successfully dispatched recovery reminders to ${count} shoppers!`);
      setSelectedIds(new Set());
      setTimeout(() => setRecoverySuccessMsg(''), 5000);
      fetchAbandonedCarts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to execute bulk recovery');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleAutoRecoverAll = async () => {
    if (!confirm('Run automated recovery reminder pipeline on all eligible abandoned carts?')) return;
    setIsRecovering(true);
    try {
      const res = await apiClient.post('/cart/admin/abandoned/auto-recover');
      const count = res.data?.data?.successful || 0;
      setRecoverySuccessMsg(`Automated pipeline completed: ${count} reminders sent!`);
      setTimeout(() => setRecoverySuccessMsg(''), 5000);
      fetchAbandonedCarts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to run automated recovery pipeline');
    } finally {
      setIsRecovering(false);
    }
  };

  const filteredCarts = data.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.customerName.toLowerCase().includes(q) ||
      (c.customerEmail && c.customerEmail.toLowerCase().includes(q)) ||
      (c.customerPhone && c.customerPhone.includes(q)) ||
      (c.guestId && c.guestId.toLowerCase().includes(q))
    );
  });

  const columns: Column<AbandonedCart>[] = [
    {
      key: 'customer',
      label: 'Shopper',
      render: (c) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-neutral-900 text-xs">{c.customerName}</span>
            {c.isRegistered ? (
              <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded">Registered</span>
            ) : (
              <span className="bg-neutral-100 text-neutral-600 text-[10px] font-medium px-1.5 py-0.5 rounded">Guest</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
            {c.customerEmail && (
              <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-neutral-400" />{c.customerEmail}</span>
            )}
            {c.customerPhone && (
              <span className="flex items-center gap-1 font-mono"><Phone className="w-3 h-3 text-neutral-400" />{c.customerPhone}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'items',
      label: 'Cart Items',
      render: (c) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-neutral-800">{c.itemCount} Item{c.itemCount > 1 ? 's' : ''}</span>
          </div>
          <div className="text-[11px] text-neutral-500 truncate max-w-[220px]">
            {c.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
          </div>
        </div>
      ),
    },
    {
      key: 'subtotal',
      label: 'Cart Value',
      render: (c) => (
        <span className="font-mono font-bold text-neutral-900 text-xs">
          {formatMoney(c.subtotal, 'INR')}
        </span>
      ),
    },
    {
      key: 'abandonedDuration',
      label: 'Abandoned',
      render: (c) => (
        <div className="flex items-center gap-1 text-amber-700 font-medium">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>{c.abandonedDurationFormatted}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Recovery Status',
      render: (c) => {
        const isSent = dispatchStatus[c.cartId] || c.recoveryStatus === 'SENT';
        return isSent ? (
          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3" /> Sent Reminder
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full text-[10px] font-medium">
            Pending Action
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Action',
      render: (c) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveCart(c);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-2xs font-bold transition shadow-xs"
          >
            <Send className="w-3 h-3" /> Recover
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
              Abandoned Cart Recovery Automation
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Re-engage shoppers who left items in their cart with automated SMS, Email, and in-app vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchAbandonedCarts}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={handleAutoRecoverAll}
            disabled={isRecovering || !data.length}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" /> ⚡ Auto-Recover All Carts
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {recoverySuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{recoverySuccessMsg}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Abandoned Carts</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-neutral-900">{stats?.totalAbandonedCarts ?? data.length}</span>
            <span className="text-xs text-neutral-400">active</span>
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-1">Last {hours} hours threshold</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Potential Lost Revenue</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-neutral-900">
              {formatMoney(stats?.totalPotentialRevenue ?? 0, 'INR')}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 font-medium mt-1">Unconverted basket value</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Average Basket Value</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-neutral-900">
              {formatMoney(stats?.averageCartValue ?? 0, 'INR')}
            </span>
          </div>
          <p className="text-[11px] text-purple-600 font-medium mt-1">{stats?.highValueCartsCount ?? 0} high value carts (&gt;₹3k)</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Recovery Conversion Rate</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600">{stats?.recoveryRatePercent ?? 18.5}%</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">~{stats?.recoveredCartsCount ?? 0} estimated recovered</p>
        </div>
      </div>

      {/* Filter & Threshold Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Quick Threshold Presets */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
            <span className="text-xs text-neutral-500 font-semibold px-2">Inactivity:</span>
            {[2, 6, 12, 24, 48].map((h) => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  hours === h ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                &gt;{h}h
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shopper name, email, phone..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-neutral-900"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>

      {/* Abandoned Carts Table */}
      <DataTable
        columns={columns}
        data={filteredCarts}
        total={filteredCarts.length}
        page={1}
        pageSize={50}
        loading={loading}
        error={!!error}
        onRetry={fetchAbandonedCarts}
        onPageChange={() => {}}
        rowKey={(c) => c.cartId}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkRecovery}
              disabled={isRecovering}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              Send Recovery Voucher ({selectedIds.size})
            </button>
          </div>
        }
        emptyMessage="No abandoned carts found for the selected time window. Great news!"
      />

      {/* Recovery Dispatch Modal */}
      {activeCart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-100 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Send Recovery Reminder</h3>
                <p className="text-xs text-neutral-500">Shopper: {activeCart.customerName}</p>
              </div>
              <button
                onClick={() => setActiveCart(null)}
                className="text-neutral-400 hover:text-neutral-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Cart Preview */}
            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Items in Cart:</span>
                <span className="font-bold text-neutral-900">{activeCart.itemCount} item(s)</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Total Cart Value:</span>
                <span className="font-mono font-bold text-neutral-900">{formatMoney(activeCart.subtotal, 'INR')}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Abandoned:</span>
                <span className="text-amber-600 font-semibold">{activeCart.abandonedDurationFormatted}</span>
              </div>
            </div>

            {/* Discount Form */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Coupon Voucher Code</label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Discount %</label>
                <input
                  type="number"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  min={5}
                  max={50}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            {/* Message Preview */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Message Preview (SMS / WhatsApp / Email)</label>
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs text-neutral-700 leading-relaxed font-sans">
                Hi {activeCart.customerName}! You left &ldquo;{activeCart.items[0]?.productName || 'Exclusive item'}&rdquo; in your shopping bag at Vasanthi&apos;s Signature. Complete your order now and enjoy {discountPercent}% OFF with voucher code <strong>{couponCode}</strong>!
                <div className="mt-2 text-sky-600 font-mono text-[11px] truncate">
                  🔗 {activeCart.checkoutResumeUrl}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setActiveCart(null)}
                className="px-4 py-2 border border-neutral-200 hover:bg-neutral-100 rounded-xl text-xs font-bold text-neutral-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSendSingleRecovery(activeCart)}
                disabled={isRecovering}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                {isRecovering ? 'Sending...' : 'Dispatch Reminder Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
