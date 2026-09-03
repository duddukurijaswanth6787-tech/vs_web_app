'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  ShoppingBag,
  Receipt,
  Calendar,
  Eye,
  X,
  Phone,
  Mail,
  Store,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { posService } from '@/features/pos/pos.service';

export default function PosCustomersAdminPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  const fetchCustomers = async (p = 1, query = '') => {
    try {
      setLoading(true);
      const res = await posService.listPosCustomers({
        page: p,
        limit: 15,
        search: query || undefined,
      });
      setCustomers(res.data || []);
      setTotal(res.total || 0);
      setPage(res.page || 1);
    } catch (e) {
      console.error('Failed to load POS customers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1, search);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(1, search);
  };

  // Calculate summary metrics
  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalOrders = customers.reduce((sum, c) => sum + (c.ordersCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
                Offline Store & POS Customers
              </h1>
              <p className="text-xs text-neutral-500 sm:text-sm">
                Retail store customer directory, purchase history, and offline POS invoices.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => fetchCustomers(page, search)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Total POS Customers
            </span>
            <div className="rounded-lg bg-sky-50 p-2 text-sky-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-neutral-900">{total}</p>
          <p className="mt-1 text-[11px] text-neutral-400">Registered across physical store counters</p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              In-Store Transactions
            </span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-neutral-900">{totalOrders}</p>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">Billed at Vasanthi's Signature</p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Offline Sales Revenue
            </span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-purple-700">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="mt-1 text-[11px] text-neutral-400">Total offline customer volume</p>
        </div>
      </div>

      {/* Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by customer name, 10-digit phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 py-2 pl-9 pr-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-sky-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-sky-700"
        >
          Search
        </button>
      </form>

      {/* Customers Data Table */}
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
              <tr>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Phone Number</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3 text-center">Orders</th>
                <th className="px-4 py-3 text-right">Total Spent</th>
                <th className="px-4 py-3">Registered Date</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-sky-600" />
                    <p className="mt-2 font-medium">Loading POS customers...</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400">
                    <Users className="mx-auto h-8 w-8 text-neutral-300" />
                    <p className="mt-2 font-semibold text-neutral-600">No offline customers found</p>
                    <p className="text-[11px] text-neutral-400">Try adjusting your search criteria.</p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-neutral-900">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-700 text-xs font-bold">
                          {c.fullName?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <span>{c.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-neutral-700">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-neutral-400" />
                        <span>{c.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-500">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-neutral-400" />
                        <span>{c.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold text-neutral-700">
                        {c.ordersCount}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-sky-700">
                      ₹{Number(c.totalSpent || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-neutral-500 text-[11px]">
                      {c.registeredAt ? new Date(c.registeredAt).toLocaleDateString('en-IN') : 'N/A'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700 hover:bg-sky-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        History ({c.recentOrders?.length || 0})
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Order History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    {selectedCustomer.fullName} — In-Store Purchases
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Phone: {selectedCustomer.phone} • Total Spent: ₹{selectedCustomer.totalSpent?.toFixed(2)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Orders List */}
            <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
              {!selectedCustomer.recentOrders || selectedCustomer.recentOrders.length === 0 ? (
                <div className="py-12 text-center text-neutral-400">
                  <Receipt className="mx-auto h-8 w-8 text-neutral-300" />
                  <p className="mt-2 font-medium">No in-store purchases recorded yet</p>
                </div>
              ) : (
                selectedCustomer.recentOrders.map((ord: any) => (
                  <div
                    key={ord.orderId}
                    className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sky-700">#{ord.orderNumber}</span>
                        <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                          {ord.paymentMethod || 'PAID'}
                        </span>
                      </div>
                      <span className="text-sm font-extrabold text-neutral-900">
                        ₹{ord.grandTotal?.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-neutral-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-neutral-400" />
                        <span>
                          {ord.createdAt
                            ? new Date(ord.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Recent'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        <span>Status: {ord.status}</span>
                      </div>
                    </div>

                    {/* Items List */}
                    {ord.items && ord.items.length > 0 && (
                      <div className="rounded-lg bg-white p-2.5 border border-neutral-200/80 space-y-1.5">
                        {ord.items.map((it: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <ShoppingBag className="h-3.5 w-3.5 text-neutral-400" />
                              <span className="font-medium text-neutral-800">{it.productName}</span>
                            </div>
                            <span className="font-semibold text-neutral-600">
                              x{it.quantity} (₹{it.unitPrice})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-4 border-t border-neutral-100 pt-3 text-right">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-bold text-white hover:bg-neutral-800"
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
