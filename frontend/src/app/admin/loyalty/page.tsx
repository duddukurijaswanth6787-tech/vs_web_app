'use client';

import { useToast } from '@/components/toast/ToastProvider';

import React, { useState } from 'react';
import { Award, Plus, Search, Filter, ShieldCheck, Gift, Users, RefreshCw } from 'lucide-react';
import { loyaltyApi } from '@/features/loyalty/api/loyalty.api';

export default function LoyaltyAdminPage() {
  const { toast } = useToast();
  const [customerId, setCustomerId] = useState('');
  const [points, setPoints] = useState<number>(100);
  const [reason, setReason] = useState('Festive Reward Bonus');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [customerBalance, setCustomerBalance] = useState<any>(null);

  const handleLookup = async () => {
    if (!customerId) return;
    setIsLoading(true);
    try {
      const res = await loyaltyApi.getCustomerBalance(customerId);
      setCustomerBalance(res);
    } catch (e: any) {
      toast('error', 'Lookup failed', e.message || 'Customer not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEarnPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !points) return;
    setIsLoading(true);
    try {
      await loyaltyApi.earnPoints({ customerId, points, reason });
      toast('success', 'Points credited', `Successfully credited ${points} points to customer #${customerId}`);
      setPoints(100);
    } catch (e: any) {
      toast('error', 'Credit failed', e.message || 'Server error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div suppressHydrationWarning className="p-6 space-y-6 max-w-[1400px] mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-neutral-900 flex items-center gap-2.5">
            <Award className="w-6 h-6 text-[#800020]" />
            <span>Loyalty Program Management</span>
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Manage customer tier balances, credit manual points & configure redemption rules.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="p-2 border border-neutral-300 rounded-xl hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 text-xs font-bold transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-neutral-500" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-neutral-500 block">Total Issued Loyalty Points</span>
          <span className="text-2xl font-black text-[#800020]">1,250,400 pts</span>
          <span className="text-[10px] text-emerald-600 font-bold block">↑ +14% vs last month</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-neutral-500 block">Active Tiered Customers</span>
          <span className="text-2xl font-black text-neutral-900">4,820 Members</span>
          <span className="text-[10px] text-neutral-500 block">Gold & Platinum Tier dominance</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs space-y-1">
          <span className="text-xs font-bold text-neutral-500 block">Redeemed Points Value</span>
          <span className="text-2xl font-black text-emerald-700">₹450,200</span>
          <span className="text-[10px] text-emerald-600 font-bold block">Instant VD Wallet Redemptions</span>
        </div>
      </div>

      {/* Manual Earn / Credit Section */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <Gift className="w-4 h-4 text-[#800020]" />
          <span>Credit / Redeem Customer Loyalty Points</span>
        </h2>

        <form onSubmit={handleEarnPoints} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 block">Customer ID / Email</label>
            <input
              type="text"
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="e.g. cust_98765"
              className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-hidden focus:border-[#800020]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 block">Points Amount</label>
            <input
              type="number"
              required
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              placeholder="100"
              className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-hidden focus:border-[#800020]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 block">Reason / Event</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Festive Bonus / Goodwill"
              className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-hidden focus:border-[#800020]"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleLookup}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl transition-colors"
            >
              Lookup
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-[#800020] hover:bg-[#600018] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              {isLoading ? 'Processing...' : 'Credit Points'}
            </button>
          </div>
        </form>

        {customerBalance && (
          <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3 text-xs text-neutral-800 flex items-center justify-between">
            <div>
              <span className="font-bold block">Customer #{customerBalance.customerId || customerId}</span>
              <span className="text-neutral-500">Active Tier: <span className="font-bold text-[#800020]">{customerBalance.tier || 'GOLD'}</span></span>
            </div>
            <span className="text-base font-black text-[#800020]">{customerBalance.points || points} Points</span>
          </div>
        )}
      </div>

    </div>
  );
}
