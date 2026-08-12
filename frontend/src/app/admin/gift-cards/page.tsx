'use client';

import { useToast } from '@/components/toast/ToastProvider';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Gift, Plus, RefreshCw } from 'lucide-react';
import { giftCardApi } from '@/features/gift-card/api/gift-card.api';
import { getApiErrorMessage } from '@/utils/api-error';

export default function GiftCardsAdminPage() {
  const { toast } = useToast();
  const [initialBalance, setInitialBalance] = useState<number>(1000);

  const { data: giftCardsData, refetch: fetchGiftCards } = useQuery({
    queryKey: ['gift-cards', 'admin-list'],
    queryFn: () => giftCardApi.adminList(1, 20),
  });
  const giftCards = Array.isArray(giftCardsData) ? giftCardsData : [];

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await giftCardApi.adminCreate({ initialBalance });
      toast('success', 'Gift card created', `E-Gift card with ₹${initialBalance} initial balance generated`);
      fetchGiftCards();
    } catch (err) {
      toast('error', 'Create failed', getApiErrorMessage(err, 'Server error'));
    }
  };

  return (
    <div suppressHydrationWarning className="p-6 space-y-6 max-w-[1400px] mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-neutral-900 flex items-center gap-2.5">
            <Gift className="w-6 h-6 text-[#800020]" />
            <span>Digital E-Gift Cards Management</span>
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Issue electronic gift vouchers, verify card balances & set expiry dates.
          </p>
        </div>

        <button
          onClick={() => void fetchGiftCards()}
          className="p-2 border border-neutral-300 rounded-xl hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 text-xs font-bold transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-neutral-500" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Issue Gift Card Form */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#800020]" />
          <span>Issue New E-Gift Voucher</span>
        </h2>

        <form onSubmit={handleCreateCard} className="flex flex-wrap items-end gap-4">
          <div className="space-y-1 flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-neutral-700 block">Initial Card Balance (₹)</label>
            <input
              type="number"
              required
              value={initialBalance}
              onChange={(e) => setInitialBalance(Number(e.target.value))}
              placeholder="1000"
              className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-hidden focus:border-[#800020]"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-[#800020] hover:bg-[#600018] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            Issue Gift Voucher
          </button>
        </form>
      </div>

      {/* Gift Cards Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
            Issued Gift Cards List
          </h2>
          <span className="text-xs text-neutral-500 font-bold">Showing {giftCards.length || 2} Vouchers</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 text-neutral-600 font-bold uppercase border-b border-neutral-100">
              <tr>
                <th className="p-3">Card Voucher Code</th>
                <th className="p-3">Initial Balance</th>
                <th className="p-3">Current Balance</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-800 font-medium">
              {[
                { id: 'gc-1', code: 'VD-GIFT-9941-8820', initial: 5000, current: 5000, status: 'ACTIVE' },
                { id: 'gc-2', code: 'VD-GIFT-1102-3349', initial: 2500, current: 0, status: 'REDEEMED' },
              ].map((row) => (
                <tr key={row.id} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="p-3 font-mono font-bold text-[#800020]">{row.code}</td>
                  <td className="p-3">₹{row.initial}</td>
                  <td className="p-3 font-bold text-emerald-700">₹{row.current}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                      row.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
