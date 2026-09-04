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
  Filter,
  User,
  Tag,
  ShoppingBag,
  ArrowUpRight,
  Receipt,
  X,
  Clock,
  CheckCircle2,
  Users,
  Award,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { formatMoney, formatDate } from '@/utils/format';

type DatePreset = 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'ALL' | 'CUSTOM';
type ChannelFilter = 'ALL' | 'POS_SHOPORA' | 'ONLINE_STORE';
type PaymentMethodFilter = 'ALL' | 'CASH' | 'UPI' | 'CARD' | 'RAZORPAY';

export default function PaymentsPage() {
  // Filter States
  const [datePreset, setDatePreset] = useState<DatePreset>('TODAY');
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
    limit: 50,
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
    let cashTotal = 0;
    let upiTotal = 0;
    let discountTotal = 0;
    let totalTransactions = filteredOrders.length;

    // Staff Performance Map: staffName -> { totalSales, orderCount }
    const staffStats: Record<string, { name: string; sales: number; count: number }> = {};

    // Customer Velocity / Timeline Map: dateKey -> { posSales, onlineSales, total }
    const timelineStats: Record<string, { label: string; pos: number; online: number; total: number }> = {};

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
      } else {
        onlineTotal += amount;
      }

      if (method.includes('CASH')) {
        cashTotal += amount;
      } else {
        upiTotal += amount;
      }

      // Aggregate Staff Stats
      if (!staffStats[staffName]) {
        staffStats[staffName] = { name: staffName, sales: 0, count: 0 };
      }
      staffStats[staffName].sales += amount;
      staffStats[staffName].count += 1;

      // Aggregate Timeline Stats (Hourly for today, Daily for multi-day)
      const dateObj = new Date(o.createdAt);
      let timeKey = '';
      if (datePreset === 'TODAY' || datePreset === 'YESTERDAY') {
        const hour = dateObj.getHours();
        timeKey = `${hour % 12 || 12} ${hour >= 12 ? 'PM' : 'AM'}`;
      } else {
        timeKey = dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      }

      if (!timelineStats[timeKey]) {
        timelineStats[timeKey] = { label: timeKey, pos: 0, online: 0, total: 0 };
      }
      if (isPos) {
        timelineStats[timeKey].pos += amount;
      } else {
        timelineStats[timeKey].online += amount;
      }
      timelineStats[timeKey].total += amount;
    });

    const sortedStaff = Object.values(staffStats).sort((a, b) => b.sales - a.sales);
    const sortedTimeline = Object.values(timelineStats);

    return {
      totalGross,
      posTotal,
      onlineTotal,
      cashTotal,
      upiTotal,
      discountTotal,
      totalTransactions,
      staffPerformance: sortedStaff,
      timeline: sortedTimeline,
    };
  }, [filteredOrders, datePreset]);

  // Customer purchase history for the selected customer in modal
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
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 p-6 md:p-8 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-2xs font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Super Admin Live Ledger
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 text-2xs font-bold uppercase tracking-wider border border-sky-500/30">
              Omnichannel POS & Web
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white font-sans">
            Payment & Sales Intelligence
          </h1>
          <p className="text-xs text-neutral-300 mt-1 max-w-xl">
            Real-time transaction tracking across In-Store POS and Online Storefront with cashier performance & footfall analytics.
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-xs font-bold transition backdrop-blur-md"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
          </button>
        </div>
      </div>

      {/* Interactive Filter Control Center */}
      <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm space-y-4">
        {/* Row 1: Date Filter Tabs & Channel Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 pb-4">
          {/* Date Presets */}
          <div className="flex items-center gap-1.5 bg-neutral-100 p-1.5 rounded-2xl">
            <Calendar className="w-4 h-4 text-neutral-500 ml-2 mr-1" />
            <button
              onClick={() => setDatePreset('TODAY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                datePreset === 'TODAY'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDatePreset('YESTERDAY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                datePreset === 'YESTERDAY'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setDatePreset('WEEK')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                datePreset === 'WEEK'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDatePreset('MONTH')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                datePreset === 'MONTH'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDatePreset('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                datePreset === 'ALL'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDatePreset('CUSTOM')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                datePreset === 'CUSTOM'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Channel Filter Pill */}
          <div className="flex items-center gap-1.5 bg-neutral-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setChannelFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                channelFilter === 'ALL'
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All Channels
            </button>
            <button
              onClick={() => setChannelFilter('POS_SHOPORA')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                channelFilter === 'POS_SHOPORA'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-neutral-600 hover:text-sky-700'
              }`}
            >
              <Store className="w-3.5 h-3.5" /> 🏬 In-Store (POS)
            </button>
            <button
              onClick={() => setChannelFilter('ONLINE_STORE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                channelFilter === 'ONLINE_STORE'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-neutral-600 hover:text-purple-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> 🌐 Online Web
            </button>
          </div>
        </div>

        {/* Custom Date Pickers if selected */}
        {datePreset === 'CUSTOM' && (
          <div className="flex items-center gap-3 bg-amber-50/60 p-3 rounded-2xl border border-amber-200">
            <span className="text-xs font-bold text-amber-900">Custom Date Range:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-white border border-amber-300 rounded-xl px-3 py-1 text-xs text-neutral-800 focus:outline-none"
            />
            <span className="text-xs text-amber-700">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-white border border-amber-300 rounded-xl px-3 py-1 text-xs text-neutral-800 focus:outline-none"
            />
          </div>
        )}

        {/* Row 2: Payment Method, Staff Dropdown, and Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search receipt #, customer name, mobile #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 transition"
            />
          </div>

          {/* Payment Method Selector */}
          <div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as PaymentMethodFilter)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-3 py-2 text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="ALL">💳 All Payment Modes</option>
              <option value="UPI">⚡ UPI / Dynamic QR</option>
              <option value="CASH">💵 Cash at Till</option>
              <option value="CARD">💳 Card / Swipe</option>
              <option value="RAZORPAY">🌐 Razorpay Online Gateway</option>
            </select>
          </div>

          {/* Staff Filter Selector */}
          <div>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-3 py-2 text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="ALL">👤 All Staff / Cashiers</option>
              {uniqueStaffList.map((st) => (
                <option key={st} value={st}>
                  Staff: {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Card 1: Total Gross Collections */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-2xs font-bold text-neutral-400 uppercase tracking-wider">Gross Collections</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl md:text-2xl font-black text-neutral-900 font-mono">
              ₹{metrics.totalGross.toLocaleString('en-IN')}
            </span>
            <p className="text-2xs text-neutral-400 mt-0.5">{metrics.totalTransactions} Total Bills</p>
          </div>
        </div>

        {/* Card 2: Offline Store POS */}
        <div className="bg-white p-5 rounded-3xl border border-sky-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-2xs font-bold text-sky-600 uppercase tracking-wider">🏬 In-Store POS</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl md:text-2xl font-black text-sky-950 font-mono">
              ₹{metrics.posTotal.toLocaleString('en-IN')}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-2xs font-bold text-sky-600">
                {metrics.totalGross > 0 ? Math.round((metrics.posTotal / metrics.totalGross) * 100) : 0}%
              </span>
              <span className="text-2xs text-neutral-400">of total volume</span>
            </div>
          </div>
        </div>

        {/* Card 3: Online Storefront */}
        <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-2xs font-bold text-purple-600 uppercase tracking-wider">🌐 Online Web</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl md:text-2xl font-black text-purple-950 font-mono">
              ₹{metrics.onlineTotal.toLocaleString('en-IN')}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-2xs font-bold text-purple-600">
                {metrics.totalGross > 0 ? Math.round((metrics.onlineTotal / metrics.totalGross) * 100) : 0}%
              </span>
              <span className="text-2xs text-neutral-400">of total volume</span>
            </div>
          </div>
        </div>

        {/* Card 4: Cash vs UPI Breakdown */}
        <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-2xs font-bold text-neutral-400 uppercase tracking-wider">UPI vs Cash</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500 flex items-center gap-1">
                <QrCode className="w-3 h-3 text-emerald-600" /> UPI:
              </span>
              <span className="font-bold text-neutral-900 font-mono">₹{metrics.upiTotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-500 flex items-center gap-1">
                <Banknote className="w-3 h-3 text-amber-600" /> Cash:
              </span>
              <span className="font-bold text-neutral-900 font-mono">₹{metrics.cashTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Card 5: Coupons & Discounts */}
        <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-2xs font-bold text-rose-600 uppercase tracking-wider">🏷️ Discounts Given</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl md:text-2xl font-black text-rose-950 font-mono">
              ₹{metrics.discountTotal.toLocaleString('en-IN')}
            </span>
            <p className="text-2xs text-rose-500 mt-0.5">Coupon & Store Savings</p>
          </div>
        </div>
      </div>

      {/* Two Visual Graphs: Staff Performance & Footfall/Sales Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Staff Performance Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Staff Sales Performance Leaderboard
              </h3>
              <p className="text-2xs text-neutral-400 mt-0.5">
                Total billed sales volume and transaction count handled per cashier/sales rep.
              </p>
            </div>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-2xs font-bold rounded-full border border-amber-200">
              {metrics.staffPerformance.length} Active Staff
            </span>
          </div>

          <div className="space-y-3.5 mt-2">
            {metrics.staffPerformance.map((st, idx) => {
              const maxSale = metrics.staffPerformance[0]?.sales || 1;
              const percent = Math.min(100, Math.round((st.sales / maxSale) * 100));
              return (
                <div key={st.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-700 border border-amber-300'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-bold text-neutral-800">{st.name}</span>
                      <span className="text-neutral-400 text-2xs">({st.count} bills)</span>
                    </div>
                    <span className="font-mono font-bold text-neutral-900">
                      ₹{st.sales.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        idx === 0
                          ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                          : 'bg-gradient-to-r from-sky-400 to-sky-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {metrics.staffPerformance.length === 0 && (
              <div className="py-8 text-center text-neutral-400 text-xs font-medium">
                No staff sales records in this selected period.
              </div>
            )}
          </div>
        </div>

        {/* Graph 2: Sales Velocity & Timeline Footfall */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-600" /> Footfall & Sales Velocity Trend
              </h3>
              <p className="text-2xs text-neutral-400 mt-0.5">
                Channel distribution over time (In-Store POS vs Online Web).
              </p>
            </div>
            <div className="flex items-center gap-3 text-2xs font-bold">
              <span className="flex items-center gap-1 text-sky-600">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> POS In-Store
              </span>
              <span className="flex items-center gap-1 text-purple-600">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Online Web
              </span>
            </div>
          </div>

          <div className="space-y-3.5 mt-2">
            {metrics.timeline.map((item) => {
              const maxTimeTotal = Math.max(...metrics.timeline.map((t) => t.total), 1);
              const posPercent = Math.round((item.pos / maxTimeTotal) * 100);
              const onlinePercent = Math.round((item.online / maxTimeTotal) * 100);

              return (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-neutral-600">{item.label}</span>
                    <span className="font-mono font-bold text-neutral-900">
                      ₹{item.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {/* Multi-segment bar */}
                  <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-sky-500 h-full transition-all duration-300"
                      style={{ width: `${posPercent}%` }}
                      title={`POS: ₹${item.pos}`}
                    />
                    <div
                      className="bg-purple-500 h-full transition-all duration-300"
                      style={{ width: `${onlinePercent}%` }}
                      title={`Online: ₹${item.online}`}
                    />
                  </div>
                </div>
              );
            })}

            {metrics.timeline.length === 0 && (
              <div className="py-8 text-center text-neutral-400 text-xs font-medium">
                No timeline records for this selected filter.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Transactions Ledger Table */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-neutral-900 font-sans flex items-center gap-2">
              <Receipt className="w-4 h-4 text-neutral-600" /> Transaction Records
            </h2>
            <p className="text-2xs text-neutral-400">
              Showing {filteredOrders.length} verified transactions matching active filters.
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
                <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Receipt / Order #</th>
                  <th className="p-4">Billed By (Staff)</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Payment Method</th>
                  <th className="p-4 text-right">Subtotal</th>
                  <th className="p-4 text-right">Coupon Discount</th>
                  <th className="p-4 text-right">Grand Total</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4 text-center">Action</th>
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
                      {/* Order Number & Channel Badge */}
                      <td className="p-4">
                        <div className="font-mono font-bold text-neutral-900">{ord.orderNumber}</div>
                        <div className="mt-1 flex items-center gap-1">
                          {isPos ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-[10px] font-bold border border-sky-200">
                              <Store className="w-2.5 h-2.5" /> POS In-Store
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                              <Globe className="w-2.5 h-2.5" /> Online Web
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Staff / Billed By */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-2xs font-bold text-neutral-600">
                            {(ord.createdBy || 'P')[0].toUpperCase()}
                          </span>
                          <div>
                            <span className="font-bold text-neutral-800 text-xs">
                              {ord.createdBy || (isPos ? 'Store Cashier' : 'Customer Self')}
                            </span>
                            {ord.terminalId && (
                              <p className="text-[10px] text-neutral-400 font-mono">Till: {ord.terminalId}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="p-4">
                        <div className="font-semibold text-neutral-800">{customerName}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">{customerPhone}</div>
                      </td>

                      {/* Payment Method */}
                      <td className="p-4">
                        {method.includes('UPI') || method.includes('QR') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-2xs border border-emerald-200">
                            <QrCode className="w-3 h-3 text-emerald-600" /> UPI / QR
                          </span>
                        ) : method.includes('CASH') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 font-bold text-2xs border border-amber-200">
                            <Banknote className="w-3 h-3 text-amber-600" /> CASH
                          </span>
                        ) : method.includes('CARD') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 text-sky-700 font-bold text-2xs border border-sky-200">
                            <CreditCard className="w-3 h-3 text-sky-600" /> CARD
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 font-bold text-2xs border border-purple-200">
                            <Globe className="w-3 h-3 text-purple-600" /> {method}
                          </span>
                        )}
                      </td>

                      {/* Subtotal */}
                      <td className="p-4 text-right font-mono font-semibold text-neutral-600">
                        ₹{Number(ord.subtotal).toLocaleString('en-IN')}
                      </td>

                      {/* Coupon Discount */}
                      <td className="p-4 text-right">
                        {hasDiscount ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-mono font-bold text-2xs border border-rose-200">
                            -₹{Number(ord.discountTotal).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-neutral-300 font-mono">—</span>
                        )}
                      </td>

                      {/* Grand Total */}
                      <td className="p-4 text-right font-mono font-black text-neutral-900 text-sm">
                        ₹{Number(ord.grandTotal).toLocaleString('en-IN')}
                      </td>

                      {/* Date & Time */}
                      <td className="p-4 text-neutral-500 text-[11px]">
                        <div>{formatDate(ord.createdAt)}</div>
                        <div className="text-[10px] text-neutral-400">
                          {new Date(ord.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* View Details Action */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="inline-flex items-center gap-1 text-2xs bg-neutral-900 hover:bg-neutral-800 text-white font-bold px-3 py-1.5 rounded-xl transition shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-neutral-400 font-medium">
                      No matching transaction records found. Try modifying your search or date filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Modal / Drawer for Order & Customer Purchase History */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-neutral-900 to-neutral-800 text-white flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-white/20 text-white font-mono text-2xs font-bold">
                    {selectedOrder.orderNumber}
                  </span>
                  <span className="text-2xs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Paid & Completed
                  </span>
                </div>
                <h3 className="text-lg font-black text-white mt-1">Transaction Invoice Breakdown</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs text-neutral-700">
              {/* Cashier & Customer Summary Banner */}
              <div className="grid grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                <div>
                  <span className="text-2xs font-bold text-neutral-400 uppercase tracking-wider">Billed By Staff</span>
                  <p className="font-bold text-neutral-900 text-sm mt-0.5">
                    {selectedOrder.createdBy || 'POS Staff / Admin'}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Channel: {selectedOrder.channel === 'POS_SHOPORA' ? '🏬 In-Store POS' : '🌐 Online Web'}
                  </p>
                </div>
                <div>
                  <span className="text-2xs font-bold text-neutral-400 uppercase tracking-wider">Customer Profile</span>
                  <p className="font-bold text-neutral-900 text-sm mt-0.5">
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
                <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-2xs mb-2">
                  Purchased Items ({selectedOrder.items?.length || 0})
                </h4>
                <div className="border border-neutral-200 rounded-2xl overflow-hidden">
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
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2">
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
                <div className="border-t border-neutral-200 pt-2 flex justify-between items-center text-sm font-black text-neutral-900">
                  <span>Final Amount Paid</span>
                  <span className="font-mono text-base text-emerald-700">
                    ₹{Number(selectedOrder.grandTotal).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Customer Purchase History (Cross-store timeline) */}
              <div>
                <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-2xs mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" /> Customer Purchase History ({customerPastOrders.length} previous visits)
                </h4>
                {customerPastOrders.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {customerPastOrders.map((past) => (
                      <div
                        key={past.id}
                        className="p-3 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 flex justify-between items-center transition"
                      >
                        <div>
                          <div className="font-mono font-bold text-neutral-800">{past.orderNumber}</div>
                          <div className="text-[10px] text-neutral-400">
                            {formatDate(past.createdAt)} • {past.items?.length || 1} items
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-neutral-900">
                            ₹{Number(past.grandTotal).toLocaleString('en-IN')}
                          </span>
                          <div className="text-[10px] font-bold text-sky-600">
                            {past.channel === 'POS_SHOPORA' ? 'POS' : 'Online'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-400 text-2xs italic bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                    This is the customer's first purchase recorded in the system.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-neutral-100 border-t border-neutral-200 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition"
              >
                Close Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
