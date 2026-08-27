'use client';

import React, { useState } from 'react';
import {
  useOmnichannelAnalytics,
  useOfflinePosAnalytics,
  useOnlineSalesAnalytics,
  useInventoryVelocityAnalytics,
  AnalyticsPeriod,
} from '@/features/analytics';
import {
  TrendingUp, ShoppingBag, Store, Globe, Package, Zap,
  AlertTriangle, RefreshCw, Layers, Calendar, ArrowUpRight,
  ShieldCheck, CreditCard, Flame, AlertCircle, Clock,
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

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'POS_OFFLINE' | 'ONLINE_STORE' | 'INVENTORY_VELOCITY'>('OVERVIEW');
  const [period, setPeriod] = useState<AnalyticsPeriod>('monthly');

  const { data: omni, isLoading: omniLoading, error: omniErr, refetch: refetchOmni } = useOmnichannelAnalytics(period);
  const { data: pos, isLoading: posLoading, refetch: refetchPos } = useOfflinePosAnalytics(period);
  const { data: online, isLoading: onlineLoading, refetch: refetchOnline } = useOnlineSalesAnalytics(period);
  const { data: velocity, isLoading: velLoading, refetch: refetchVel } = useInventoryVelocityAnalytics();

  const loading = omniLoading || posLoading || onlineLoading || velLoading;

  const handleRefresh = () => {
    refetchOmni();
    refetchPos();
    refetchOnline();
    refetchVel();
  };

  if (loading) return <SectionLoader message="Compiling omnichannel & inventory velocity analytics..." />;
  if (omniErr) return <PageError title="Analytics Load Failed" message="Could not fetch live analytics." retry={handleRefresh} />;

  const trendChartData = omni?.trend.labels.map((lbl, idx) => ({
    date: lbl,
    Offline: omni.trend.offlineRevenue[idx] || 0,
    Online: omni.trend.onlineRevenue[idx] || 0,
  })) || [];

  return (
    <div className="space-y-6 font-sans antialiased text-neutral-900 pb-12">
      {/* Header & Global Period Bar */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-50 text-amber-700 font-bold text-xs px-2.5 py-1 rounded-full border border-amber-200/60 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Executive Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-neutral-900 mt-2">
            Omnichannel Sales & Inventory Velocity
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Real-time split analytics for Offline POS Counter vs Online Storefront & Apparel Velocity
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Period Selector */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200/80">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                period === 'daily' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              1 Day (Daily)
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                period === 'weekly' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              7 Days (Weekly)
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                period === 'monthly' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              30 Days (Monthly)
            </button>
            <button
              onClick={() => setPeriod('yearly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                period === 'yearly' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              This Year
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="p-2.5 text-neutral-600 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl transition-all"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center border-b border-neutral-200 gap-2 sm:gap-6 overflow-x-auto no-scrollbar pb-px">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`py-3 px-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'OVERVIEW'
              ? 'border-[var(--brand-primary,#0284c7)] text-[var(--brand-primary,#0284c7)]'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Omnichannel Summary
        </button>

        <button
          onClick={() => setActiveTab('POS_OFFLINE')}
          className={`py-3 px-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'POS_OFFLINE'
              ? 'border-[var(--brand-primary,#0284c7)] text-[var(--brand-primary,#0284c7)]'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Store className="w-4 h-4 text-emerald-600" /> Offline Sales (POS Counter)
        </button>

        <button
          onClick={() => setActiveTab('ONLINE_STORE')}
          className={`py-3 px-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'ONLINE_STORE'
              ? 'border-[var(--brand-primary,#0284c7)] text-[var(--brand-primary,#0284c7)]'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Globe className="w-4 h-4 text-blue-600" /> Online Sales (Storefront & App)
        </button>

        <button
          onClick={() => setActiveTab('INVENTORY_VELOCITY')}
          className={`py-3 px-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'INVENTORY_VELOCITY'
              ? 'border-[var(--brand-primary,#0284c7)] text-[var(--brand-primary,#0284c7)]'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Flame className="w-4 h-4 text-orange-500" /> Inventory & Sell-Through Velocity
        </button>
      </div>

      {/* TAB 1: OMNICHANNEL SUMMARY OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Top Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total Sales Revenue</span>
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp className="w-4 h-4" /></span>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900">{formatCurrency(omni?.totalRevenue || 0)}</h3>
              <p className="text-xs text-neutral-500 mt-1">{omni?.totalOrders || 0} total orders across channels</p>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Offline (POS Counter)</span>
                <span className="p-2 bg-emerald-50 text-emerald-700 rounded-xl"><Store className="w-4 h-4" /></span>
              </div>
              <h3 className="text-2xl font-bold text-emerald-700">{formatCurrency(omni?.offlineSales.revenue || 0)}</h3>
              <div className="flex items-center justify-between text-xs text-neutral-500 mt-1">
                <span>{omni?.offlineSales.ordersCount || 0} POS receipts</span>
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {omni?.offlineSales.sharePercentage || 0}% share
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Online (Storefront)</span>
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Globe className="w-4 h-4" /></span>
              </div>
              <h3 className="text-2xl font-bold text-blue-600">{formatCurrency(omni?.onlineSales.revenue || 0)}</h3>
              <div className="flex items-center justify-between text-xs text-neutral-500 mt-1">
                <span>{omni?.onlineSales.ordersCount || 0} online orders</span>
                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                  {omni?.onlineSales.sharePercentage || 0}% share
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Avg Order Value (AOV)</span>
                <span className="p-2 bg-purple-50 text-purple-600 rounded-xl"><ShoppingBag className="w-4 h-4" /></span>
              </div>
              <h3 className="text-2xl font-bold text-neutral-900">{formatCurrency(omni?.averageOrderValue || 0)}</h3>
              <p className="text-xs text-neutral-500 mt-1">Revenue per completed basket</p>
            </div>
          </div>

          {/* Revenue Comparison Area Chart */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900">Revenue Breakdown: Offline vs Online</h3>
                <p className="text-xs text-neutral-500">Comparative sales performance timeline</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Offline POS</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Online Store</span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              {trendChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="offGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="onGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#888" fontSize={11} />
                    <YAxis stroke="#888" fontSize={11} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
                    <ChartTooltip formatter={(v: unknown) => formatCurrency(Number(v || 0))} />
                    <Area type="monotone" dataKey="Offline" stroke="#10b981" strokeWidth={2.5} fill="url(#offGrad)" />
                    <Area type="monotone" dataKey="Online" stroke="#3b82f6" strokeWidth={2.5} fill="url(#onGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState title="No Sales Recorded" description="No sales data for the selected period." />
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OFFLINE SALES (POS COUNTER) */}
      {activeTab === 'POS_OFFLINE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">POS Store Revenue</span>
              <h3 className="text-2xl font-bold text-emerald-700 mt-2">{formatCurrency(pos?.totalRevenue || 0)}</h3>
              <p className="text-xs text-neutral-500 mt-1">In-store counter collection</p>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Counter Transactions</span>
              <h3 className="text-2xl font-bold text-neutral-900 mt-2">{formatNumber(pos?.totalTransactions || 0)}</h3>
              <p className="text-xs text-neutral-500 mt-1">Receipts generated at terminal</p>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Avg Basket Value</span>
              <h3 className="text-2xl font-bold text-neutral-900 mt-2">{formatCurrency(pos?.averageBasketValue || 0)}</h3>
              <p className="text-xs text-neutral-500 mt-1">Average spent per walk-in customer</p>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-neutral-900">POS Payment Methods (Cash / Card / UPI)</h3>
              <div className="space-y-3">
                {pos?.byPaymentMethod.map((pm) => (
                  <div key={pm.method} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-neutral-800 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-neutral-500" /> {pm.method}
                      </span>
                      <span>{formatCurrency(pm.amount)} ({pm.percentage}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all"
                        style={{ width: `${pm.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-neutral-900">Daily POS Counter Trend</h3>
              <div className="h-56 w-full">
                {pos?.dailyTrend && pos.dailyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pos.dailyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#888" fontSize={11} />
                      <YAxis stroke="#888" fontSize={11} />
                      <ChartTooltip formatter={(v: unknown) => formatCurrency(Number(v || 0))} />
                      <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState title="No POS Sales" description="No walk-in POS transactions recorded yet." />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ONLINE SALES (STOREFRONT & APP) */}
      {activeTab === 'ONLINE_STORE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Online Revenue</span>
              <h3 className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(online?.totalRevenue || 0)}</h3>
              <p className="text-xs text-neutral-500 mt-1">E-Commerce & Mobile App</p>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Online Orders</span>
              <h3 className="text-2xl font-bold text-neutral-900 mt-2">{formatNumber(online?.totalOrders || 0)}</h3>
              <p className="text-xs text-neutral-500 mt-1">Customer placed orders</p>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Average Order Value</span>
              <h3 className="text-2xl font-bold text-neutral-900 mt-2">{formatCurrency(online?.averageOrderValue || 0)}</h3>
              <p className="text-xs text-neutral-500 mt-1">Revenue ÷ Online Orders</p>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Return / Refund Rate</span>
              <h3 className="text-2xl font-bold text-amber-600 mt-2">{online?.returnRatePercentage || 0}%</h3>
              <p className="text-xs text-neutral-500 mt-1">Return request ratio</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Gateways */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-neutral-900">Payment Gateway Success Rate</h3>
              <div className="space-y-4">
                {online?.paymentGatewayBreakdown.map((gw) => (
                  <div key={gw.provider} className="p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-neutral-900 uppercase">{gw.provider} Gateway</span>
                      <p className="text-xs text-neutral-500 mt-0.5">{formatCurrency(gw.amount)} processed</p>
                    </div>
                    <span className="px-3 py-1 bg-green-50 text-green-700 font-bold text-xs rounded-full border border-green-200">
                      {gw.successRate}% Success
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fulfillment Status */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-neutral-900">Order Fulfillment Status</h3>
              <div className="grid grid-cols-2 gap-3">
                {online?.shippingStatusBreakdown.map((sb) => (
                  <div key={sb.status} className="p-3.5 rounded-xl border border-neutral-200 bg-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{sb.status}</span>
                    <h4 className="text-lg font-bold text-neutral-900 mt-1">{sb.count} orders</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INVENTORY & SELL-THROUGH VELOCITY */}
      {activeTab === 'INVENTORY_VELOCITY' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Catalog Products</span>
              <h3 className="text-2xl font-bold text-neutral-900 mt-2">{formatNumber(velocity?.totalCatalogProducts || 0)}</h3>
              <p className="text-xs text-neutral-500 mt-1">Total apparel designs</p>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Fast-Moving Dresses</span>
              <h3 className="text-2xl font-bold text-emerald-600 mt-2">{formatNumber(velocity?.fastMovingCount || 0)}</h3>
              <p className="text-xs text-neutral-500 mt-1">High sell-through speed</p>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Slow-Moving Dresses</span>
              <h3 className="text-2xl font-bold text-amber-600 mt-2">{formatNumber(velocity?.slowMovingCount || 0)}</h3>
              <p className="text-xs text-neutral-500 mt-1">Consider promotions</p>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Stockout Warnings</span>
              <h3 className="text-2xl font-bold text-red-600 mt-2">{formatNumber(velocity?.criticalStockoutsCount || 0)}</h3>
              <p className="text-xs text-neutral-500 mt-1">Less than 7 days stock left</p>
            </div>
          </div>

          {/* Product Velocity Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Velocity Products */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500" /> Fast-Moving Apparel
                </h3>
                <span className="text-xs text-neutral-500">Highest Units Sold</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase">
                      <th className="pb-2">Product Name</th>
                      <th className="pb-2">Category</th>
                      <th className="pb-2">Stock</th>
                      <th className="pb-2">Sold</th>
                      <th className="pb-2">Velocity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
                    {velocity?.topVelocityProducts.map((p) => (
                      <tr key={p.productId}>
                        <td className="py-2.5 font-bold truncate max-w-[140px]">{p.name}</td>
                        <td className="py-2.5 text-neutral-500">{p.categoryName}</td>
                        <td className="py-2.5">{p.currentStock} pcs</td>
                        <td className="py-2.5 text-emerald-600 font-bold">{p.unitsSold} pcs</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-bold text-[10px]">
                            {p.dailyVelocity}/day
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Slow Moving Products */}
            <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" /> Slow-Moving Apparel
                </h3>
                <span className="text-xs text-neutral-500">Low Turnover</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase">
                      <th className="pb-2">Product Name</th>
                      <th className="pb-2">Category</th>
                      <th className="pb-2">Current Stock</th>
                      <th className="pb-2">Units Sold</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
                    {velocity?.slowVelocityProducts.map((p) => (
                      <tr key={p.productId}>
                        <td className="py-2.5 font-bold truncate max-w-[140px]">{p.name}</td>
                        <td className="py-2.5 text-neutral-500">{p.categoryName}</td>
                        <td className="py-2.5 text-amber-700 font-bold">{p.currentStock} pcs</td>
                        <td className="py-2.5">{p.unitsSold} pcs</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded font-bold text-[10px]">
                            {p.classification}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
