'use client';

import { useToast } from '@/components/toast/ToastProvider';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Share2, RefreshCw } from 'lucide-react';
import { referralApi } from '@/features/referral/api/referral.api';
import { getApiErrorMessage } from '@/utils/api-error';

export default function ReferralAdminPage() {
  const { toast } = useToast();
  const [rewardPoints] = useState<number>(250);

  const { data: referralsData, isLoading, refetch: fetchReferrals } = useQuery({
    queryKey: ['referral', 'admin-list'],
    queryFn: () => referralApi.adminList(1, 20),
  });
  const referrals = referralsData?.data ?? [];

  const handleUpdateReward = async (id: string) => {
    try {
      await referralApi.adminUpdate(id, { rewardPoints });
      toast('success', 'Referral updated', 'Reward updated successfully');
      fetchReferrals();
    } catch (err) {
      toast('error', 'Update failed', getApiErrorMessage(err, 'Server error'));
    }
  };

  return (
    <div suppressHydrationWarning className="p-6 space-y-6 max-w-[1400px] mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-neutral-900 flex items-center gap-2.5">
            <Share2 className="w-6 h-6 text-[#800020]" />
            <span>Referral Program Management</span>
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Monitor customer referral codes, reward point payouts and usage parameters.
          </p>
        </div>

        <button
          onClick={() => void fetchReferrals()}
          className="p-2 border border-neutral-300 rounded-xl hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 text-xs font-bold transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-neutral-500" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Referrals List Table */}
      <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
            Active Referral Codes
          </h2>
          <span className="text-xs text-neutral-500 font-bold">Showing {referrals.length} Codes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 text-neutral-600 font-bold uppercase border-b border-neutral-100">
              <tr>
                <th className="p-3">Referral Code</th>
                <th className="p-3">Referrer Customer</th>
                <th className="p-3">Reward Points</th>
                <th className="p-3">Total Uses</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-800 font-medium">
              {isLoading ? (
                <tr>
                  <td className="p-4 text-neutral-400 italic" colSpan={5}>Loading referral codes...</td>
                </tr>
              ) : referrals.length === 0 ? (
                <tr>
                  <td className="p-4 text-neutral-400 italic" colSpan={5}>No referral codes generated yet.</td>
                </tr>
              ) : (
                referrals.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#800020]">{row.code}</td>
                    <td className="p-3 font-bold text-neutral-900">{row.referrerName || '—'}</td>
                    <td className="p-3 font-extrabold text-emerald-700">{row.rewardPoints} pts</td>
                    <td className="p-3">{row.usedCount} Friends Joined</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleUpdateReward(row.id)}
                        className="px-3 py-1 bg-neutral-100 hover:bg-rose-50 hover:text-[#800020] rounded-lg text-[11px] font-bold border border-neutral-200 transition-colors"
                      >
                        Update Reward
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
