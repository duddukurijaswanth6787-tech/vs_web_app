'use client';

import React, { useState } from 'react';
import {
  useDashboardSummary, useDashboardSalesChart,
  useDashboardOrderAnalytics, useDashboardPaymentAnalytics, useDashboardRecentActivity,
} from '@/features/dashboard';
import Link from 'next/link';
import {
  TrendingUp, ShoppingBag, Users, Package, Clock, AlertTriangle, Calendar,
  DollarSign, CreditCard, RotateCcw, Ban, Tag, Layers, Star, Percent, ArrowLeftRight,
  PlusCircle, FileText, Image, Gift, Eye, Activity,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip as ChartTooltip, CartesianGrid, Cell, Legend, PieChart, Pie,
} from 'recharts';
import { SectionLoader, PageError, EmptyState } from '@/components/feedback/FeedbackStates';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const formatNumber = (val: number) =>
  new Intl.NumberFormat('en-IN').format(val);

const statusColor: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-100',
  PACKED: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  SHIPPED: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  DELIVERED: 'bg-green-50 text-green-700 border-green-100',
  CANCELLED: 'bg-red-50 text-red-700 border-red-100',
  RETURNED: 'bg-orange-50 text-orange-700 border-orange-100',
  REFUNDED: 'bg-purple-50 text-purple-700 border-purple-100',
};

const statusChartColor: Record<string, string> = {
  PENDING: '#eab308', PROCESSING: '#3b82f6', PACKED: '#6366f1',
  SHIPPED: '#06b6d4', DELIVERED: '#22c55e', CANCELLED: '#ef4444',
  RETURNED: '#f97316', REFUNDED: '#a855f7',
};

const quickActions = [
  { label: 'Add Product', href: '/admin/catalog/products/new', icon: PlusCircle, color: 'text-blue-600 bg-blue-50' },
  { label: 'Add Category', href: '/admin/catalog/categories', icon: Layers, color: 'text-indigo-600 bg-indigo-50' },
  { label: 'Add Brand', href: '/admin/catalog/brands', icon: Tag, color: 'text-purple-600 bg-purple-50' },
  { label: 'Create Banner', href: '/admin/banners', icon: Image, color: 'text-pink-600 bg-pink-50' },
  { label: 'Create Coupon', href: '/admin/promotions/coupons', icon: Gift, color: 'text-orange-600 bg-orange-50' },
  { label: 'View Orders', href: '/admin/orders', icon: Eye, color: 'text-neutral-600 bg-neutral-50' },
];

function KpiCard({ title, value, icon: Icon, desc, color, subtitle }: {
  title: string; value: string | number; icon: React.ElementType; desc: string; color: string; subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{title}</span>
        <div className={`rounded-lg border p-1.5 ${color}`}><Icon className="h-4 w-4" /></div>
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-neutral-900">{value}</h3>
        <p className="text-[11px] text-neutral-400 mt-1">{desc}</p>
        {subtitle && <p className="text-[10px] text-neutral-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const now = new Date();
  const timeStr = now.toLocaleString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const { data: summary, isLoading: sLoading, error: sError, refetch: refetchS } = useDashboardSummary();
  const { data: chartData, isLoading: cLoading, error: cError, refetch: refetchC } = useDashboardSalesChart(period);
  const { data: orderAna } = useDashboardOrderAnalytics();
  const { data: payAna } = useDashboardPaymentAnalytics();
  const { data: recent } = useDashboardRecentActivity();

  const loading = sLoading || cLoading;
  const error = sError || cError;
  const handleRetry = () => { refetchS(); refetchC(); };

  if (loading) return <SectionLoader message="Loading dashboard..." />;
  if (error) return <PageError title="Dashboard Load Failure" message="Could not load dashboard data." retry={handleRetry} />;

  const graphData = chartData?.labels.map((l, i) => ({ name: l, revenue: chartData.data[i] || 0 })) ?? [];

  const orderStats = orderAna?.statusBreakdown ?? [];
  const payMethods = payAna?.byMethod ?? [];
  const recentOrders = recent?.orders ?? [];
  const recentProducts = recent?.products ?? [];
  const recentReviews = recent?.reviews ?? [];
  const recentCustomers = recent?.customers ?? [];

  return (
    <div className="space-y-6" role="main" aria-label="Dashboard">
      {/* Welcome */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Welcome back</h1>
            <p className="text-sm text-neutral-500 mt-1">{timeStr}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((a) => {
              const Icon = a.icon;
              return (
                <Link key={a.label} href={a.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-200 ${a.color} hover:opacity-80 transition-opacity`}>
                  <Icon className="w-3.5 h-3.5" /> {a.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard title="Total Revenue" value={formatCurrency(summary?.totalRevenue ?? 0)} icon={TrendingUp} desc="All time revenue" color="text-emerald-600 bg-emerald-50 border-emerald-100" />
        <KpiCard title="Today Revenue" value={formatCurrency(summary?.todayRevenue ?? 0)} icon={DollarSign} desc="Today's sales" color="text-green-600 bg-green-50 border-green-100" />
        <KpiCard title="Total Orders" value={formatNumber(summary?.totalOrders ?? 0)} icon={ShoppingBag} desc="All orders placed" color="text-blue-600 bg-blue-50 border-blue-100" />
        <KpiCard title="Today Orders" value={summary?.todayOrders ?? 0} icon={Clock} desc="Orders placed today" color="text-cyan-600 bg-cyan-50 border-cyan-100" />
        <KpiCard title="Avg Order Value" value={formatCurrency(summary?.averageOrderValue ?? 0)} icon={ArrowLeftRight} desc="Revenue ÷ Orders" color="text-teal-600 bg-teal-50 border-teal-100" />
        <KpiCard title="Customers" value={formatNumber(summary?.totalCustomers ?? 0)} icon={Users} desc="Registered profiles" color="text-indigo-600 bg-indigo-50 border-indigo-100" />
        <KpiCard title="Products" value={formatNumber(summary?.totalProducts ?? 0)} icon={Package} desc="In catalog" color="text-purple-600 bg-purple-50 border-purple-100" />
        <KpiCard title="Categories" value={summary?.categoriesCount ?? 0} icon={Layers} desc="Product categories" color="text-violet-600 bg-violet-50 border-violet-100" />
        <KpiCard title="Brands" value={summary?.brandsCount ?? 0} icon={Tag} desc="Registered brands" color="text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100" />
        <KpiCard title="Active Coupons" value={summary?.activeCoupons ?? 0} icon={Gift} desc="Currently valid" color="text-orange-600 bg-orange-50 border-orange-100" />
        <KpiCard title="Low Stock" value={summary?.lowStockProducts ?? 0} icon={AlertTriangle} desc="Running low" color="text-yellow-600 bg-yellow-50 border-yellow-100" subtitle={`${summary?.lowStockCount ?? 0} alerts`} />
        <KpiCard title="Out of Stock" value={summary?.outOfStockProducts ?? 0} icon={Ban} desc="Unavailable items" color="text-red-600 bg-red-50 border-red-100" />
        <KpiCard title="Pending Reviews" value={summary?.pendingReviews ?? 0} icon={Star} desc="Awaiting moderation" color="text-amber-600 bg-amber-50 border-amber-100" />
        <KpiCard title="Returns" value={summary?.returnsCount ?? 0} icon={RotateCcw} desc="Return requests" color="text-orange-600 bg-orange-50 border-orange-100" />
        <KpiCard title="Cancelled" value={summary?.cancelledOrders ?? 0} icon={Ban} desc="Cancelled orders" color="text-rose-600 bg-rose-50 border-rose-100" />
      </div>

      {/* Sales Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">Revenue Trend</h2>
              <p className="text-[11px] text-neutral-500">Period sales performance</p>
            </div>
            <select value={period} onChange={(e) => setPeriod(e.target.value as any)}
              className="text-xs border border-neutral-200 rounded-lg px-2.5 py-1.5 bg-white">
              <option value="weekly">7 Days</option>
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
            </select>
          </div>
          <div className="h-64">
            {graphData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={graphData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#171717" stopOpacity={0.1}/><stop offset="95%" stopColor="#171717" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="name" stroke="#a3a3a3" fontSize={11} tickLine={false} />
                  <YAxis stroke="#a3a3a3" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip formatter={(val: unknown) => [formatCurrency(val as number), 'Revenue']} contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#171717" strokeWidth={2} fill="url(#revGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyState title="No Data" description="No sales data for this period" />}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900 mb-4">Order Status</h2>
          <div className="h-64">
            {orderStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderStats} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                  <XAxis dataKey="status" stroke="#a3a3a3" fontSize={10} tickLine={false} />
                  <YAxis stroke="#a3a3a3" fontSize={11} tickLine={false} allowDecimals={false} />
                  <ChartTooltip contentStyle={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {orderStats.map((e) => <Cell key={e.status} fill={statusChartColor[e.status] ?? '#a3a3a3'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState title="No Orders" description="No order data available" />}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {orderStats.map((s) => (
              <span key={s.status} className={`text-[10px] px-2 py-0.5 rounded-full border ${statusColor[s.status] ?? 'bg-neutral-50 text-neutral-600 border-neutral-100'}`}>
                {s.status}: {s.count}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Payment + Customer Analytics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900 mb-4">Payment Analytics</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-neutral-50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-neutral-500 uppercase">Failed Payments</p>
              <p className="text-lg font-bold text-red-600">{payAna?.failedPayments ?? 0}</p>
            </div>
            <div className="bg-neutral-50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-neutral-500 uppercase">Total Refunds</p>
              <p className="text-lg font-bold text-orange-600">{formatCurrency(payAna?.totalRefunds ?? 0)}</p>
            </div>
            <div className="bg-neutral-50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-neutral-500 uppercase">Methods</p>
              <p className="text-lg font-bold text-neutral-900">{payMethods.length}</p>
            </div>
          </div>
          {payMethods.length > 0 && (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={payMethods} dataKey="revenue" nameKey="method" cx="50%" cy="50%" innerRadius={40} outerRadius={70} label={({ payload }: any) => `${payload.method}: ${formatCurrency(payload.revenue)}`}>
                    {payMethods.map((e, i) => <Cell key={e.method} fill={i === 0 ? '#3b82f6' : '#22c55e'} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-neutral-900 mb-4">Recent Activity</h2>
          <div className="space-y-3 text-xs">
            <div>
              <p className="text-[10px] text-neutral-400 uppercase font-semibold mb-1">Latest Orders</p>
              {recentOrders.length > 0 ? recentOrders.slice(0, 3).map((o: any) => (
                <div key={o.id} className="flex justify-between py-1.5 border-b border-neutral-50 last:border-0">
                  <span className="font-medium text-neutral-800">#{o.orderNumber}</span>
                  <span className="text-neutral-500">{formatCurrency(o.grandTotal)}</span>
                </div>
              )) : <p className="text-neutral-400 py-1">No recent orders</p>}
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 uppercase font-semibold mb-1">Latest Products</p>
              {recentProducts.length > 0 ? recentProducts.slice(0, 3).map((p: any) => (
                <div key={p.id} className="py-1.5 border-b border-neutral-50 last:border-0">
                  <span className="text-neutral-800">{p.name}</span>
                </div>
              )) : <p className="text-neutral-400 py-1">No recent products</p>}
            </div>
            <div>
              <p className="text-[10px] text-neutral-400 uppercase font-semibold mb-1">Pending Reviews</p>
              {recentReviews.length > 0 ? recentReviews.slice(0, 3).map((r: any) => (
                <div key={r.id} className="py-1.5 border-b border-neutral-50 last:border-0">
                  <span className="text-neutral-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <span className="text-neutral-400 ml-2">{r.comment?.slice(0, 60) || 'No comment'}</span>
                </div>
              )) : <p className="text-neutral-400 py-1">No pending reviews</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">Recent Orders</h3>
          {summary?.recentOrders && summary.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead><tr className="border-b border-neutral-100 text-neutral-400 font-semibold">
                  <th className="py-2">Order No</th><th className="py-2">Amount</th><th className="py-2">Status</th><th className="py-2">Date</th>
                </tr></thead>
                <tbody className="divide-y divide-neutral-50 text-neutral-700">
                  {summary.recentOrders.map((order: any) => (
                    <tr key={order.id}>
                      <td className="py-2.5 font-medium text-neutral-900">{order.orderNumber}</td>
                      <td className="py-2.5">{formatCurrency(order.grandTotal)}</td>
                      <td className="py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColor[order.status] ?? 'bg-neutral-50 text-neutral-700 border-neutral-100'}`}>{order.status}</span>
                      </td>
                      <td className="py-2.5 text-neutral-400">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="No Orders" description="No recent orders" />}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">Top Selling Products</h3>
          {summary?.topProducts && summary.topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead><tr className="border-b border-neutral-100 text-neutral-400 font-semibold">
                  <th className="py-2">Product Name</th><th className="py-2">Sales</th><th className="py-2">Value</th>
                </tr></thead>
                <tbody className="divide-y divide-neutral-50 text-neutral-700">
                  {summary.topProducts.map((item: any) => (
                    <tr key={item.productId}>
                      <td className="py-2.5 font-medium text-neutral-900 truncate max-w-[180px]">{item.product?.name || 'Unknown'}</td>
                      <td className="py-2.5">{item._sum.quantity || 0} units</td>
                      <td className="py-2.5">{formatCurrency(item._sum.totalPrice || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState title="No Data" description="No top products recorded" />}
        </div>
      </div>
    </div>
  );
}
