'use client';

import React from 'react';
import { useCustomerReport } from '@/features/reports';
import { Users, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
} from 'recharts';

interface CustomerReportRow {
  id: string;
  userId?: string;
  totalSpent: number;
  orderCount: number;
  createdAt?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

const SPEND_TIERS: Array<{ label: string; min: number; max: number }> = [
  { label: '₹0 – 1k', min: 0, max: 1000 },
  { label: '₹1k – 5k', min: 1000, max: 5000 },
  { label: '₹5k – 10k', min: 5000, max: 10000 },
  { label: '₹10k+', min: 10000, max: Infinity },
];

interface CustomerReportData {
  totalCustomers: number;
  customers: CustomerReportRow[];
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export default function CustomerAnalyticsPage() {
  const { data, isLoading, error, refetch } = useCustomerReport();

  if (isLoading) return <SectionLoader message="Loading customer statistics..." />;
  if (error) return <PageError title="Load Failure" message="Could not fetch customer report." retry={refetch} />;

  const reportData = (data?.data || {
    totalCustomers: 0,
    customers: [],
  }) as CustomerReportData;

  // Calculate average customer spend
  const customersList = reportData.customers || [];
  const totalRevenue = customersList.reduce((acc, cur) => acc + Number(cur.totalSpent || 0), 0);
  const avgCustomerSpend = reportData.totalCustomers > 0 ? totalRevenue / reportData.totalCustomers : 0;

  // Sort by spent descending for leaderboard
  const topCustomers = [...customersList].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);

  // Signup growth over time — cumulative acquisition, bucketed by day
  const sortedBySignup = [...customersList]
    .filter((c) => !!c.createdAt)
    .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());
  const dailySignups = new Map<string, number>();
  sortedBySignup.forEach((c) => {
    const day = new Date(c.createdAt!).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    dailySignups.set(day, (dailySignups.get(day) ?? 0) + 1);
  });
  let cumulative = 0;
  const acquisitionChart = Array.from(dailySignups.entries()).map(([name, count]) => {
    cumulative += count;
    return { name, customers: cumulative };
  });

  // Spend tier distribution
  const spendTierChart = SPEND_TIERS.map((tier) => ({
    name: tier.label,
    count: customersList.filter((c) => c.totalSpent >= tier.min && c.totalSpent < tier.max).length,
  }));

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Customer Analytics</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Evaluate customer metrics, spending habits, and top buyer accounts.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Total Clients</span>
            <Users className="h-4 w-4 text-neutral-400" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mt-3">{reportData.totalCustomers} Accounts</h3>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Cumulative Spend</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mt-3">{formatCurrency(totalRevenue)}</h3>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500 uppercase">Avg Spend / Client</span>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mt-3">{formatCurrency(avgCustomerSpend)}</h3>
        </div>
      </div>

      {/* Acquisition Growth & Spend Tier Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-neutral-900 mb-4">Customer Growth Over Time</h3>
          <div className="h-64 w-full">
            {acquisitionChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={acquisitionChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0369a1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0369a1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="name" stroke="#a3a3a3" fontSize={11} tickLine={false} />
                  <YAxis stroke="#a3a3a3" fontSize={11} tickLine={false} allowDecimals={false} />
                  <ChartTooltip
                    formatter={(val: unknown) => [`${val} customers`, 'Total Signed Up']}
                    contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
                  />
                  <Area type="monotone" dataKey="customers" stroke="#0369a1" strokeWidth={2} fillOpacity={1} fill="url(#colorCustomers)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-neutral-400">No signup history available yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-neutral-900 mb-4">Customer Spend Tiers</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendTierChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                <XAxis dataKey="name" stroke="#a3a3a3" fontSize={11} tickLine={false} />
                <YAxis stroke="#a3a3a3" fontSize={11} tickLine={false} allowDecimals={false} />
                <ChartTooltip
                  formatter={(val: unknown) => [`${val} customers`, 'Count']}
                  contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#800020" radius={[6, 6, 0, 0]} maxBarSize={80} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Customer Accounts Leaderboard */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col">
        <h3 className="text-sm font-bold text-neutral-900 mb-4">Top Spending Customers Leaderboard</h3>
        {topCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider">
                  <th className="py-2">Client Name</th>
                  <th className="py-2">Contact Info</th>
                  <th className="py-2">Orders Count</th>
                  <th className="py-2">Total Value Purchased</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-neutral-700">
                {topCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/50 transition">
                    <td className="py-3 font-semibold text-neutral-900">
                      {c.user?.firstName || 'Guest'} {c.user?.lastName || ''}
                    </td>
                    <td className="py-3 text-neutral-500">{c.user?.email || 'N/A'}</td>
                    <td className="py-3">{c.orderCount} orders</td>
                    <td className="py-3 text-neutral-950 font-bold">{formatCurrency(c.totalSpent)}</td>
                    <td className="py-3 text-right">
                      {/* Check if user exists on the parent profile to link correctly */}
                      <Link
                        href={`/admin/customers/${c.userId || c.id}`}
                        className="text-[11px] font-bold text-neutral-950 hover:underline"
                      >
                        Inspect Account
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-xs text-neutral-450">No customer transactions recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
