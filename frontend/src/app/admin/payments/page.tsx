'use client';

import React, { useState, useMemo } from 'react';
import { useOrderList } from '@/features/orders/order.hooks';
import { OrderResponse } from '@/features/orders/order.types';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import {
  Eye,
  Store,
  Globe,
  DollarSign,
  TrendingUp,
  CreditCard,
  QrCode,
  Banknote,
  Search,
  Calendar,
  Tag,
  Receipt,
  X,
  Clock,
  CheckCircle2,
  Users,
  Award,
  ShieldCheck,
  RefreshCw,
  BarChart3,
  Layers,
  Sparkles,
  ArrowUpRight,
  TrendingDown,
  PieChart,
} from 'lucide-react';
import { formatMoney, formatDate } from '@/utils/format';

type DatePreset = 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL' | 'CUSTOM';
type ChannelFilter = 'ALL' | 'POS_SHOPORA' | 'ONLINE_STORE';
type PaymentMethodFilter = 'ALL' | 'CASH' | 'UPI' | 'CARD' | 'RAZORPAY';
type ViewMode = 'LEDGER' | 'ANALYTICS';

export default function PaymentsPage() {
  // View Mode: 'LEDGER' (Transaction Records) | 'ANALYTICS' (Deep Visual Charts & Performance)
  const [viewMode, setViewMode] = useState<ViewMode>('LEDGER');

  // Filter States
  const [datePreset, setDatePreset] = useState<DatePreset>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('ALL');
  const [methodFilter, setMethodFilter] = useState<PaymentMethodFilter>('ALL');
  const [staffFilter, setStaffFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  // Selected Order for Details Drawer
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);

  // Compute date range for query
  const dateRange = useMemo(() => {
    const now = new Date();
    if (datePreset === 'TODAY') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      return { startDate: start.toISOString(), endDate: undefined };
    }
    if (datePreset === 'YESTERDAY') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    if (datePreset === 'WEEK') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { startDate: start.toISOString(), endDate: undefined };
    }
    if (datePreset === 'MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      return { startDate: start.toISOString(), endDate: undefined };
    }
    if (datePreset === 'CUSTOM' && customStartDate) {
      const start = new Date(customStartDate);
      const end = customEndDate ? new Date(customEndDate + 'T23:59:59') : undefined;
      return { startDate: start.toISOString(), endDate: end ? end.toISOString() : undefined };
    }
    return { startDate: undefined, endDate: undefined };
  }, [datePreset, customStartDate, customEndDate]);

  // Fetch Orders & Payments
  const { data: orderListData, isLoading, isError, refetch } = useOrderList({
    page,
    limit: 100,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    channel: channelFilter === 'ALL' ? undefined : channelFilter,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const orders = orderListData?.data || [];

  // Client-side filtering for search, staff, and method
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Payment Method Filter
      if (methodFilter !== 'ALL') {
        const method = (o.paymentMethod || o.payments?.[0]?.method || '').toUpperCase();
        if (methodFilter === 'CASH' && !method.includes('CASH')) return false;
        if (methodFilter === 'UPI' && !method.includes('UPI') && !method.includes('QR')) return false;
        if (methodFilter === 'CARD' && !method.includes('CARD')) return false;
        if (methodFilter === 'RAZORPAY' && !method.includes('RAZORPAY') && !method.includes('GATEWAY')) return false;
      }

      // Staff Filter
      if (staffFilter !== 'ALL') {
        const staff = (o.createdBy || o.notes || '').toLowerCase();
        if (!staff.includes(staffFilter.toLowerCase())) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const orderNum = (o.orderNumber || '').toLowerCase();
        const custName = `${o.customer?.user?.firstName || o.customer?.firstName || ''} ${o.customer?.user?.lastName || o.customer?.lastName || ''}`.toLowerCase();
        const phone = (o.customer?.phone || o.customer?.user?.phone || '').toLowerCase();
        const notes = (o.notes || '').toLowerCase();
        if (!orderNum.includes(q) && !custName.includes(q) && !phone.includes(q) && !notes.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [orders, methodFilter, staffFilter, searchQuery]);

  // Unique staff list for filter dropdown
  const uniqueStaffList = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.createdBy) set.add(o.createdBy);
    });
    return Array.from(set);
  }, [orders]);

  // Executive Metrics & Analytics
  const metrics = useMemo(() => {
    let totalGross = 0;
    let posTotal = 0;
    let onlineTotal = 0;
    let posCount = 0;
    let onlineCount = 0;
    let cashTotal = 0;
    let upiTotal = 0;
    let cardTotal = 0;
    let discountTotal = 0;
    let totalTransactions = filteredOrders.length;

    // Staff Performance Map
    const staffStats: Record<string, { name: string; sales: number; count: number; channel: string }> = {};

    // Timeline Map: dateKey -> { label, pos, online, total, count }
    const timelineStats: Record<string, { label: string; pos: number; online: number; total: number; count: number }> = {};

    // Hourly Distribution (0-23)
    const hourlyDistribution: Record<number, { hour: number; label: string; sales: number; count: number }> = {};
    for (let h = 9; h <= 21; h++) {
      const label = `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`;
      hourlyDistribution[h] = { hour: h, label, sales: 0, count: 0 };
    }

    filteredOrders.forEach((o) => {
      const amount = Number(o.grandTotal) || 0;
      const discount = Number(o.discountTotal) || 0;
      const isPos = o.channel === 'POS_SHOPORA' || (o.channel as string) === 'POS' || (o.channel as string) === 'IN_STORE';
      const method = (o.paymentMethod || o.payments?.[0]?.method || '').toUpperCase();
      const staffName = o.createdBy || (isPos ? 'POS Cashier' : 'Online Store');

      totalGross += amount;
      discountTotal += discount;

      if (isPos) {
        posTotal += amount;
        posCount += 1;
      } else {
        onlineTotal += amount;
        onlineCount += 1;
      }

      if (method.includes('CASH')) {
        cashTotal += amount;
      } else if (method.includes('CARD')) {
        cardTotal += amount;
      } else {
        upiTotal += amount;
      }

      // Aggregate Staff Stats
      if (!staffStats[staffName]) {
        staffStats[staffName] = { name: staffName, sales: 0, count: 0, channel: isPos ? 'POS' : 'Web' };
      }
      staffStats[staffName].sales += amount;
      staffStats[staffName].count += 1;

      // Aggregate Timeline Stats
      const dateObj = new Date(o.createdAt);
      let timeKey = '';
      if (datePreset === 'TODAY' || datePreset === 'YESTERDAY') {
        const hour = dateObj.getHours();
        timeKey = `${hour % 12 || 12} ${hour >= 12 ? 'PM' : 'AM'}`;
      } else {
        timeKey = dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      }

      if (!timelineStats[timeKey]) {
        timelineStats[timeKey] = { label: timeKey, pos: 0, online: 0, total: 0, count: 0 };
      }
      if (isPos) {
        timelineStats[timeKey].pos += amount;
      } else {
        timelineStats[timeKey].online += amount;
      }
      timelineStats[timeKey].total += amount;
      timelineStats[timeKey].count += 1;

      // Hourly aggregation
      const h = dateObj.getHours();
      if (hourlyDistribution[h]) {
        hourlyDistribution[h].sales += amount;
        hourlyDistribution[h].count += 1;
      }
    });

    const sortedStaff = Object.values(staffStats).sort((a, b) => b.sales - a.sales);
    const sortedTimeline = Object.values(timelineStats);
    const hourlyList = Object.values(hourlyDistribution);

    const avgTicket = totalTransactions > 0 ? Math.round(totalGross / totalTransactions) : 0;
    const posAvgTicket = posCount > 0 ? Math.round(posTotal / posCount) : 0;
    const onlineAvgTicket = onlineCount > 0 ? Math.round(onlineTotal / onlineCount) : 0;

    return {
      totalGross,
      posTotal,
      posCount,
      posAvgTicket,
      onlineTotal,
      onlineCount,
      onlineAvgTicket,
      cashTotal,
      upiTotal,
      cardTotal,
      discountTotal,
      totalTransactions,
      avgTicket,
      staffPerformance: sortedStaff,
      timeline: sortedTimeline,
      hourlyList,
    };
  }, [filteredOrders, datePreset]);

  // Customer purchase history for selected customer in modal
  const customerPastOrders = useMemo(() => {
    if (!selectedOrder?.customer?.id && !selectedOrder?.customer?.phone) return [];
    const custId = selectedOrder.customer.id;
    const custPhone = selectedOrder.customer.phone;
    return orders.filter(
      (o) =>
        o.id !== selectedOrder.id &&
        ((custId && o.customer?.id === custId) || (custPhone && o.customer?.phone === custPhone))
    );
  }, [selectedOrder, orders]);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#0284c7]" />
            <h1 className="text-2xl font-black text-neutral-900 font-sans tracking-tight">Payments & Ledger</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Omnichannel Ledger
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Real-time sales tracking across In-Store POS and Online Web Storefront with cashier leaderboards and sales velocity analytics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200">
            <button
              type="button"
              onClick={() => setViewMode('LEDGER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'LEDGER'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Ledger Records</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('ANALYTICS')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'ANALYTICS'
                  ? 'bg-white text-[#0284c7] shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Sales Analytics</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Control Center */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
        {/* Row 1: Date Range & Channel Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
          {/* Date Presets */}
          <div className="flex flex-wrap items-center gap-1 bg-neutral-100 p-1 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-neutral-500 ml-1.5 mr-0.5" />
            {(['TODAY', 'YESTERDAY', 'WEEK', 'MONTH', 'ALL', 'CUSTOM'] as DatePreset[]).map((preset) => {
              const labelMap: Record<DatePreset, string> = {
                TODAY: 'Today',
                YESTERDAY: 'Yesterday',
                WEEK: 'Last 7 Days',
                MONTH: 'This Month',
                ALL: 'All Time',
                CUSTOM: 'Custom',
              };
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDatePreset(preset)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    datePreset === preset
                      ? 'bg-white text-neutral-900 shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {labelMap[preset]}
                </button>
              );
            })}
          </div>

          {/* Channel Selector */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setChannelFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                channelFilter === 'ALL'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All Channels
            </button>
            <button
              type="button"
              onClick={() => setChannelFilter('POS_SHOPORA')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                channelFilter === 'POS_SHOPORA'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-sky-700'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>In-Store (POS)</span>
            </button>
            <button
              type="button"
              onClick={() => setChannelFilter('ONLINE_STORE')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                channelFilter === 'ONLINE_STORE'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-purple-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Online Web</span>
            </button>
          </div>
        </div>

        {/* Custom Date Picker row */}
        {datePreset === 'CUSTOM' && (
          <div className="flex items-center gap-3 bg-amber-50/70 p-3 rounded-xl border border-amber-200 text-xs">
            <span className="font-bold text-amber-900">Custom Date Range:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs text-neutral-800 focus:outline-none"
            />
            <span className="text-amber-700">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs text-neutral-800 focus:outline-none"
            />
          </div>
        )}

        {/* Row 2: Search, Payment Method, and Staff Filter */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search receipt #, customer name, phone #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900"
            />
          </div>

          <div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as PaymentMethodFilter)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 focus:outline-none"
            >
              <option value="ALL">All Payment Modes</option>
              <option value="UPI">UPI / QR</option>
              <option value="CASH">Cash at Till</option>
              <option value="CARD">Card / POS Swipe</option>
              <option value="RAZORPAY">Razorpay Gateway</option>
            </select>
          </div>

          <div>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-800 focus:outline-none"
            >
              <option value="ALL">All Staff / Cashiers</option>
              {uniqueStaffList.map((st) => (
                <option key={st} value={st}>
                  Staff: {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Card 1: Gross Collections */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-neutral-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Collections</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-neutral-900 font-mono pt-1">
            ₹{metrics.totalGross.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-neutral-500">{metrics.totalTransactions} Total Bills (Avg ₹{metrics.avgTicket})</p>
        </div>

        {/* Card 2: In-Store POS */}
        <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-sky-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">In-Store POS</span>
            <Store className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-sky-950 font-mono pt-1">
            ₹{metrics.posTotal.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-sky-700 font-medium">
            {metrics.totalGross > 0 ? Math.round((metrics.posTotal / metrics.totalGross) * 100) : 0}% of sales ({metrics.posCount} orders)
          </p>
        </div>

        {/* Card 3: Online Web */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-purple-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Online Web</span>
            <Globe className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-purple-950 font-mono pt-1">
            ₹{metrics.onlineTotal.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-purple-700 font-medium">
            {metrics.totalGross > 0 ? Math.round((metrics.onlineTotal / metrics.totalGross) * 100) : 0}% of sales ({metrics.onlineCount} orders)
          </p>
        </div>

        {/* Card 4: UPI vs Cash Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-neutral-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">UPI vs Cash</span>
            <QrCode className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="pt-1 space-y-0.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-neutral-500 font-sans">UPI:</span>
              <strong className="text-neutral-900">₹{metrics.upiTotal.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500 font-sans">Cash:</span>
              <strong className="text-neutral-900">₹{metrics.cashTotal.toLocaleString('en-IN')}</strong>
            </div>
          </div>
        </div>

        {/* Card 5: Discounts Given */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-2xs space-y-1">
          <div className="flex justify-between items-center text-rose-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Discounts Given</span>
            <Tag className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-950 font-mono pt-1">
            ₹{metrics.discountTotal.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-rose-600">Coupons & Store Savings</p>
        </div>
      </div>

      {/* VIEW MODE 1: SALES ANALYTICS & CHARTS VIEW */}
      {viewMode === 'ANALYTICS' && (
        <div className="space-y-6">
          {/* Channel Deep Dive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* POS Analytics Card */}
            <div className="bg-white p-6 rounded-2xl border border-sky-200 shadow-2xs space-y-4">
              <div className="flex justify-between items-center border-b border-sky-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">In-Store POS Sales Analytics</h3>
                    <p className="text-[11px] text-neutral-500">Retail counter transactions, till cash, and cashier sales</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-base text-sky-950">₹{metrics.posTotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-sky-50/50 p-3 rounded-xl border border-sky-100 text-center">
                  <span className="text-neutral-500 text-[11px] block">POS Volume</span>
                  <strong className="text-sm font-bold text-sky-950 font-mono">{metrics.posCount} bills</strong>
                </div>
                <div className="bg-sky-50/50 p-3 rounded-xl border border-sky-100 text-center">
                  <span className="text-neutral-500 text-[11px] block">Avg POS Ticket</span>
                  <strong className="text-sm font-bold text-sky-950 font-mono">₹{metrics.posAvgTicket}</strong>
                </div>
                <div className="bg-sky-50/50 p-3 rounded-xl border border-sky-100 text-center">
                  <span className="text-neutral-500 text-[11px] block">Cash Ratio</span>
                  <strong className="text-sm font-bold text-sky-950 font-mono">
                    {metrics.posTotal > 0 ? Math.round((metrics.cashTotal / metrics.posTotal) * 100) : 0}%
                  </strong>
                </div>
              </div>

              {/* Progress split */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs text-neutral-600">
                  <span>Cash (₹{metrics.cashTotal})</span>
                  <span>UPI (₹{metrics.upiTotal})</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden flex">
                  <div
                    className="bg-amber-500 h-full transition-all"
                    style={{
                      width: `${metrics.posTotal > 0 ? (metrics.cashTotal / metrics.posTotal) * 100 : 50}%`,
                    }}
                  />
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{
                      width: `${metrics.posTotal > 0 ? (metrics.upiTotal / metrics.posTotal) * 100 : 50}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Online Web Analytics Card */}
            <div className="bg-white p-6 rounded-2xl border border-purple-200 shadow-2xs space-y-4">
              <div className="flex justify-between items-center border-b border-purple-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Online Web Storefront Analytics</h3>
                    <p className="text-[11px] text-neutral-500">E-commerce storefront purchases & digital payments</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-base text-purple-950">₹{metrics.onlineTotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 text-center">
                  <span className="text-neutral-500 text-[11px] block">Web Orders</span>
                  <strong className="text-sm font-bold text-purple-950 font-mono">{metrics.onlineCount} orders</strong>
                </div>
                <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 text-center">
                  <span className="text-neutral-500 text-[11px] block">Avg Web Order</span>
                  <strong className="text-sm font-bold text-purple-950 font-mono">₹{metrics.onlineAvgTicket}</strong>
                </div>
                <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100 text-center">
                  <span className="text-neutral-500 text-[11px] block">Gateway Mode</span>
                  <strong className="text-sm font-bold text-purple-950">Razorpay Live</strong>
                </div>
              </div>

              <div className="text-[11px] text-neutral-500 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                Online storefront orders sync automatically with instant customer SMS & email invoice delivery.
              </div>
            </div>
          </div>

          {/* Velocity Trend & Cashier Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Velocity Timeline Bar Chart */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#0284c7]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Sales Velocity & Timeline Distribution
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-2xs font-semibold">
                  <span className="flex items-center gap-1 text-sky-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" /> POS In-Store
                  </span>
                  <span className="flex items-center gap-1 text-purple-700">
                    <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" /> Online Web
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {metrics.timeline.map((item) => {
                  const maxTimeTotal = Math.max(...metrics.timeline.map((t) => t.total), 1);
                  const posPercent = Math.round((item.pos / maxTimeTotal) * 100);
                  const onlinePercent = Math.round((item.online / maxTimeTotal) * 100);

                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-neutral-700">{item.label}</span>
                        <span className="font-mono font-bold text-neutral-900">
                          ₹{item.total.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-neutral-100 rounded-lg overflow-hidden flex">
                        <div
                          className="bg-sky-500 h-full transition-all"
                          style={{ width: `${posPercent}%` }}
                          title={`POS: ₹${item.pos}`}
                        />
                        <div
                          className="bg-purple-500 h-full transition-all"
                          style={{ width: `${onlinePercent}%` }}
                          title={`Online: ₹${item.online}`}
                        />
                      </div>
                    </div>
                  );
                })}

                {metrics.timeline.length === 0 && (
                  <div className="py-8 text-center text-neutral-400 text-xs">
                    No timeline records found for active filters.
                  </div>
                )}
              </div>
            </div>

            {/* Cashier & Sales Rep Leaderboard */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-2xs space-y-4">
              <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Staff & Cashier Leaderboard
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-neutral-500 font-mono">
                  {metrics.staffPerformance.length} Cashiers Active
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {metrics.staffPerformance.map((st, idx) => {
                  const maxSale = metrics.staffPerformance[0]?.sales || 1;
                  const percent = Math.min(100, Math.round((st.sales / maxSale) * 100));
                  return (
                    <div key={st.name} className="space-y-1.5 bg-neutral-50/60 p-3 rounded-xl border border-neutral-200/80">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                              idx === 0
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-neutral-200 text-neutral-700'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="font-bold text-neutral-900">{st.name}</span>
                          <span className="text-neutral-400 text-2xs">({st.count} orders billed)</span>
                        </div>
                        <span className="font-mono font-bold text-neutral-900">
                          ₹{st.sales.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#0284c7] transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {metrics.staffPerformance.length === 0 && (
                  <div className="py-8 text-center text-neutral-400 text-xs">
                    No staff sales records in this selected period.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: MAIN TRANSACTIONS LEDGER TABLE */}
      {viewMode === 'LEDGER' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-neutral-100 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-neutral-700" />
                <span>Verified Transaction Ledger Records</span>
              </h2>
              <p className="text-2xs text-neutral-400 mt-0.5">
                Showing {filteredOrders.length} audited transactions matching active filters.
              </p>
            </div>
          </div>

          {isLoading ? (
            <SectionLoader message="Retrieving transaction ledger from server..." />
          ) : isError ? (
            <PageError
              title="Fetch Failure"
              message="Could not retrieve transactions from backend."
              retry={refetch}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Receipt #</th>
                    <th className="p-3.5">Channel</th>
                    <th className="p-3.5">Billed By (Staff)</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Payment Mode</th>
                    <th className="p-3.5 text-right">Subtotal</th>
                    <th className="p-3.5 text-right">Discount</th>
                    <th className="p-3.5 text-right">Grand Total</th>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {filteredOrders.map((ord) => {
                    const isPos =
                      ord.channel === 'POS_SHOPORA' ||
                      (ord.channel as string) === 'POS' ||
                      (ord.channel as string) === 'IN_STORE';
                    const method = (ord.paymentMethod || ord.payments?.[0]?.method || 'CASH').toUpperCase();
                    const custFirst = ord.customer?.user?.firstName || ord.customer?.firstName || '';
                    const custLast = ord.customer?.user?.lastName || ord.customer?.lastName || '';
                    const customerName = (custFirst || custLast) ? `${custFirst} ${custLast}`.trim() : 'Walk-in Customer';
                    const customerPhone = ord.customer?.phone || ord.customer?.user?.phone || '—';
                    const hasDiscount = Number(ord.discountTotal) > 0;

                    return (
                      <tr key={ord.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-neutral-900">{ord.orderNumber}</span>
                        </td>

                        <td className="p-3.5">
                          {isPos ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[10px] font-bold border border-sky-200">
                              <Store className="w-3 h-3" /> POS
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                              <Globe className="w-3 h-3" /> Web
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <span className="font-semibold text-neutral-800">
                            {ord.createdBy || (isPos ? 'Store Cashier' : 'Self Service')}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <div className="font-semibold text-neutral-800">{customerName}</div>
                          <div className="text-[10px] text-neutral-400 font-mono">{customerPhone}</div>
                        </td>

                        <td className="p-3.5">
                          {method.includes('UPI') || method.includes('QR') ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                              <QrCode className="w-3 h-3" /> UPI
                            </span>
                          ) : method.includes('CASH') ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                              <Banknote className="w-3 h-3" /> CASH
                            </span>
                          ) : method.includes('CARD') ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-bold text-[10px] border border-sky-200">
                              <CreditCard className="w-3 h-3" /> CARD
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">
                              <Globe className="w-3 h-3" /> {method}
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-right font-mono font-semibold text-neutral-600">
                          ₹{Number(ord.subtotal).toLocaleString('en-IN')}
                        </td>

                        <td className="p-3.5 text-right">
                          {hasDiscount ? (
                            <span className="font-mono font-bold text-rose-600 text-xs">
                              -₹{Number(ord.discountTotal).toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-neutral-300 font-mono">—</span>
                          )}
                        </td>

                        <td className="p-3.5 text-right font-mono font-black text-neutral-900 text-xs">
                          ₹{Number(ord.grandTotal).toLocaleString('en-IN')}
                        </td>

                        <td className="p-3.5 text-neutral-500 text-[11px]">
                          <div>{formatDate(ord.createdAt)}</div>
                          <div className="text-[10px] text-neutral-400">
                            {new Date(ord.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>

                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(ord)}
                            className="inline-flex items-center gap-1 text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold px-2.5 py-1 rounded-lg transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-12 text-center text-neutral-400 font-medium">
                        No matching transaction records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Slide-over Modal for Order Invoice Breakdown */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-neutral-900 text-white flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-white/20 text-white font-mono text-xs font-bold">
                    {selectedOrder.orderNumber}
                  </span>
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Paid & Settled
                  </span>
                </div>
                <h3 className="text-base font-black text-white mt-1">Transaction Invoice Breakdown</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs text-neutral-700">
              <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <div>
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Billed By Staff</span>
                  <p className="font-bold text-neutral-900 text-xs mt-0.5">
                    {selectedOrder.createdBy || 'Store Cashier'}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Channel: {selectedOrder.channel === 'POS_SHOPORA' ? 'In-Store POS' : 'Online Web'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Customer</span>
                  <p className="font-bold text-neutral-900 text-xs mt-0.5">
                    {(selectedOrder.customer?.user?.firstName || selectedOrder.customer?.firstName)
                      ? `${selectedOrder.customer?.user?.firstName || selectedOrder.customer?.firstName} ${selectedOrder.customer?.user?.lastName || selectedOrder.customer?.lastName || ''}`.trim()
                      : 'Walk-in Store Customer'}
                  </p>
                  <p className="text-[11px] text-neutral-500 font-mono">
                    Phone: {selectedOrder.customer?.phone || selectedOrder.customer?.user?.phone || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] mb-2">
                  Purchased Items ({selectedOrder.items?.length || 0})
                </h4>
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-neutral-100 text-neutral-500 font-bold text-[10px] uppercase">
                        <th className="p-3">Product / SKU</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {selectedOrder.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="p-3">
                            <div className="font-bold text-neutral-800">{item.productName}</div>
                            <div className="text-[10px] text-neutral-400 font-mono">
                              SKU: {item.sku} {item.variantTitle && `• ${item.variantTitle}`}
                            </div>
                          </td>
                          <td className="p-3 text-center font-bold text-neutral-800">{item.quantity}</td>
                          <td className="p-3 text-right font-mono text-neutral-600">
                            ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-neutral-900">
                            ₹{Number(item.totalPrice).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                      {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-neutral-400">
                            No individual line items recorded.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bill Totals */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2">
                <div className="flex justify-between items-center text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold">
                    ₹{Number(selectedOrder.subtotal).toLocaleString('en-IN')}
                  </span>
                </div>
                {Number(selectedOrder.discountTotal) > 0 && (
                  <div className="flex justify-between items-center text-rose-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" /> Coupon Discount Applied
                    </span>
                    <span className="font-mono font-bold">
                      -₹{Number(selectedOrder.discountTotal).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-neutral-600">
                  <span>GST / Taxes</span>
                  <span className="font-mono font-bold">
                    ₹{Number(selectedOrder.taxTotal).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="border-t border-neutral-200 pt-2 flex justify-between items-center text-xs font-black text-neutral-900">
                  <span>Final Amount Paid</span>
                  <span className="font-mono text-sm text-emerald-700">
                    ₹{Number(selectedOrder.grandTotal).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Customer Past Orders */}
              <div>
                <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" /> Past Orders ({customerPastOrders.length} previous visits)
                </h4>
                {customerPastOrders.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {customerPastOrders.map((past) => (
                      <div
                        key={past.id}
                        className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 flex justify-between items-center text-xs"
                      >
                        <div>
                          <div className="font-mono font-bold text-neutral-800">{past.orderNumber}</div>
                          <div className="text-[10px] text-neutral-400">{formatDate(past.createdAt)}</div>
                        </div>
                        <span className="font-mono font-bold text-neutral-900">
                          ₹{Number(past.grandTotal).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-400 text-2xs italic bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                    First visit recorded for this customer profile.
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 bg-neutral-100 border-t border-neutral-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
