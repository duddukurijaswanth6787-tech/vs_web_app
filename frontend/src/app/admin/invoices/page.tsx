'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useInvoiceList, useCreateInvoice } from '@/features/invoices/invoice.hooks';
import { useOrderList } from '@/features/orders/order.hooks';
import type { InvoiceResponse } from '@/features/invoices/invoice.types';
import type { OrderResponse } from '@/features/orders/order.types';
import { InvoiceStatusBadge } from '@/components/feedback/StatusBadges';
import { ButtonLoader } from '@/components/feedback/FeedbackStates';
import {
  Eye,
  Search,
  RefreshCw,
  Receipt,
  CheckCircle2,
  Building2,
  Sparkles,
  ShoppingBag,
  Store,
  Globe,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import Link from 'next/link';
import { formatMoney, formatDate } from '@/utils/format';
import DataTable from '@/components/tables/DataTable';
import type { Column } from '@/components/tables/DataTable';

type ActiveTab = 'ALL_ORDERS' | 'PENDING' | 'ISSUED_INVOICES';

function getCustomerName(customer: any, customerInfo?: any): string {
  if (customerInfo?.fullName) return customerInfo.fullName;
  if (customer) {
    const first = customer.firstName || customer.user?.firstName || '';
    const last = customer.lastName || customer.user?.lastName || '';
    const full = `${first} ${last}`.trim();
    if (full) return full;
    if (customer.email) return customer.email;
  }
  return 'Walk-in Customer';
}

function getCustomerPhone(customer: any, customerInfo?: any): string {
  if (customerInfo?.phone) return customerInfo.phone;
  if (customer?.phone) return customer.phone;
  if (customer?.user?.phone) return customer.user.phone;
  return 'Counter Sale';
}

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const status = searchParams.get('status') || '';
  const [activeTab, setActiveTab] = useState<ActiveTab>('ALL_ORDERS');
  const [searchQuery, setSearchQuery] = useState('');
  const [generatingOrderId, setGeneratingOrderId] = useState<string | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Queries
  const { data: listData, isLoading: isLoadingInvoices, isError: isErrorInvoices, refetch: refetchInvoices } = useInvoiceList({
    page,
    limit: 100,
    status: status || undefined,
  });

  const { data: ordersData, isLoading: isLoadingOrders, isError: isErrorOrders, refetch: refetchOrders } = useOrderList({
    limit: 100,
  });

  const createInvoiceMut = useCreateInvoice();

  const invoices = listData?.data ?? [];
  const orders = ordersData?.data ?? [];

  // Map of orderId -> Order
  const orderMapById = useMemo(() => {
    const map = new Map<string, OrderResponse>();
    orders.forEach((o) => {
      map.set(o.id, o);
    });
    return map;
  }, [orders]);

  // Map of orderId -> Invoice
  const orderInvoiceMap = useMemo(() => {
    const map = new Map<string, InvoiceResponse>();
    invoices.forEach((inv) => {
      if (inv.orderId) {
        map.set(inv.orderId, inv);
      }
    });
    return map;
  }, [invoices]);

  // Orders without invoices
  const ordersWithoutInvoices = useMemo(() => {
    return orders.filter(
      (o) => !orderInvoiceMap.has(o.id) && o.status !== 'CANCELLED' && Number(o.grandTotal) > 0
    );
  }, [orders, orderInvoiceMap]);

  // Merged view of all orders + their invoice info
  const combinedOrdersList = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'CANCELLED')
      .map((ord) => {
        const inv = orderInvoiceMap.get(ord.id);
        return {
          ...ord,
          invoice: inv || null,
          hasInvoice: Boolean(inv),
        };
      });
  }, [orders, orderInvoiceMap]);

  // Filtered by search and tab
  const filteredCombinedOrders = useMemo(() => {
    let result = combinedOrdersList;
    if (activeTab === 'PENDING') {
      result = result.filter((item) => !item.hasInvoice);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        const custName = getCustomerName(item.customer, (item as any).customerInfo).toLowerCase();
        const custPhone = getCustomerPhone(item.customer, (item as any).customerInfo).toLowerCase();
        return (
          item.orderNumber.toLowerCase().includes(q) ||
          custName.includes(q) ||
          custPhone.includes(q) ||
          (item.invoice && item.invoice.invoiceNumber.toLowerCase().includes(q)) ||
          (item.channel && item.channel.toLowerCase().includes(q))
        );
      });
    }
    return result;
  }, [combinedOrdersList, activeTab, searchQuery]);

  // Filtered Invoices for the Issued Invoices Tab
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const q = searchQuery.toLowerCase().trim();
    return invoices.filter((inv) => {
      const ord = orderMapById.get(inv.orderId);
      const ordNum = ord?.orderNumber || inv.orderNumber || '';
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        ordNum.toLowerCase().includes(q) ||
        inv.orderId.toLowerCase().includes(q) ||
        (inv.notes && inv.notes.toLowerCase().includes(q))
      );
    });
  }, [invoices, orderMapById, searchQuery]);

  // Single order invoice generator
  const handleGenerateInvoice = async (order: OrderResponse) => {
    setGeneratingOrderId(order.id);
    setActionMessage(null);
    try {
      await createInvoiceMut.mutateAsync({
        orderId: order.id,
        notes: `Tax Invoice · ${order.channel || 'Retail'} Order ${order.orderNumber}`,
      });
      setActionMessage({
        type: 'success',
        text: `✅ Generated Tax Invoice for Order ${order.orderNumber} successfully!`,
      });
      refetchInvoices();
      refetchOrders();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `⚠️ Failed to generate invoice: ${err?.message || 'Server error'}`,
      });
    } finally {
      setGeneratingOrderId(null);
    }
  };

  // Batch generator
  const handleGenerateAllMissingInvoices = async () => {
    if (ordersWithoutInvoices.length === 0) return;
    setIsGeneratingAll(true);
    setActionMessage(null);
    try {
      for (const ord of ordersWithoutInvoices) {
        await createInvoiceMut.mutateAsync({
          orderId: ord.id,
          notes: `Tax Invoice · ${ord.channel || 'Retail'} Order ${ord.orderNumber}`,
        });
      }
      setActionMessage({
        type: 'success',
        text: `✅ Successfully generated invoices for ${ordersWithoutInvoices.length} pending order(s).`,
      });
      refetchInvoices();
      refetchOrders();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `⚠️ Batch generation ended: ${err?.message || 'Completed with updates'}`,
      });
      refetchInvoices();
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const totalInvoicedValue = useMemo(() => {
    return invoices.reduce((acc, inv) => acc + (Number(inv.grandTotal) || 0), 0);
  }, [invoices]);

  // Columns for All Orders & Invoicing Tab
  const orderColumns: Column<any>[] = [
    {
      key: 'orderNumber',
      label: 'Order ID & Channel',
      render: (o) => {
        const isPos = o.channel?.toUpperCase().includes('POS') || o.orderNumber?.includes('POS');
        return (
          <div className="space-y-1">
            <Link
              href={`/admin/orders/${o.id}`}
              className="font-mono font-black text-neutral-900 text-xs hover:text-blue-600 hover:underline block"
            >
              {o.orderNumber}
            </Link>
            <div className="flex items-center gap-1.5">
              {isPos ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Store className="w-2.5 h-2.5" /> ORD-POS (Counter)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Globe className="w-2.5 h-2.5" /> ORD-ONL (Web Store)
                </span>
              )}
              <span className="text-[10px] text-neutral-400 font-mono">
                {o.paymentMethod || 'PAID'}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (o) => (
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-neutral-800 block">
            {getCustomerName(o.customer, (o as any).customerInfo)}
          </span>
          <span className="text-[10px] text-neutral-400 block font-mono">
            {getCustomerPhone(o.customer, (o as any).customerInfo)}
          </span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Order Date',
      render: (o) => (
        <div className="space-y-0.5">
          <span className="text-neutral-700 text-xs font-medium block">
            {formatDate(o.createdAt)}
          </span>
          <span className="text-[10px] text-neutral-400 block font-mono">
            {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ),
    },
    {
      key: 'grandTotal',
      label: 'Grand Total',
      render: (o) => (
        <div className="text-right">
          <span className="font-mono font-black text-xs text-neutral-950 block">
            {formatMoney(o.grandTotal, o.currency || 'INR')}
          </span>
          <span className="text-[10px] text-neutral-400 block">
            {o.items?.length ?? 1} item(s)
          </span>
        </div>
      ),
    },
    {
      key: 'invoiceStatus',
      label: 'Invoice Status',
      render: (o) => {
        if (o.hasInvoice && o.invoice) {
          return (
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {o.invoice.invoiceNumber}
              </span>
              <span className="text-[9px] text-neutral-400 block font-sans">
                GST Tax Issued
              </span>
            </div>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Invoice Not Generated
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Action',
      render: (o) => {
        if (o.hasInvoice && o.invoice) {
          return (
            <div className="flex items-center justify-end gap-1.5">
              <Link
                href={`/admin/invoices/${o.invoice.id}`}
                className="inline-flex items-center gap-1 text-2xs bg-neutral-900 hover:bg-neutral-800 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-2xs"
              >
                <Eye className="w-3 h-3" /> View / Print Slip
              </Link>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => handleGenerateInvoice(o)}
              disabled={generatingOrderId === o.id || isGeneratingAll}
              className="inline-flex items-center gap-1 text-2xs bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-2xs disabled:opacity-50"
            >
              {generatingOrderId === o.id ? (
                <ButtonLoader />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              Generate Invoice
            </button>
          </div>
        );
      },
    },
  ];

  // Columns for Issued Invoices Tab
  const invoiceColumns: Column<InvoiceResponse>[] = [
    {
      key: 'invoiceNumber',
      label: 'Invoice #',
      render: (i) => (
        <div className="space-y-0.5">
          <span className="font-mono font-bold text-neutral-900 text-xs block">
            {i.invoiceNumber}
          </span>
          <span className="text-[10px] text-neutral-400 font-sans block">
            Vasanthi&apos;s Signature
          </span>
        </div>
      ),
    },
    {
      key: 'orderId',
      label: 'Order ID Ref',
      render: (i) => {
        const ord = orderMapById.get(i.orderId);
        const displayOrderNum = ord?.orderNumber || i.orderNumber || i.orderId;
        const isPos = ord?.channel?.toUpperCase().includes('POS') || displayOrderNum.includes('POS');
        return (
          <div className="space-y-1">
            <Link
              href={`/admin/orders/${i.orderId}`}
              className="font-mono text-xs font-black text-blue-600 hover:underline block"
              title={`View Order ${displayOrderNum}`}
            >
              {displayOrderNum}
            </Link>
            <div className="flex items-center gap-1">
              {isPos ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Store className="w-2.5 h-2.5" /> ORD-POS
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Globe className="w-2.5 h-2.5" /> ORD-ONL
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Invoice Date',
      render: (i) => (
        <div className="space-y-0.5">
          <span className="text-neutral-700 text-xs font-medium block">
            {formatDate(i.createdAt)}
          </span>
          <span className="text-[10px] text-neutral-400 block font-mono">
            {new Date(i.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ),
    },
    {
      key: 'taxTotal',
      label: 'GST / Tax',
      render: (i) => (
        <span className="font-mono font-semibold text-xs text-neutral-700 block text-right">
          {formatMoney(i.taxTotal, i.currency)}
        </span>
      ),
    },
    {
      key: 'discountTotal',
      label: 'Discount',
      render: (i) => (
        <span className="font-mono text-xs text-red-500 block text-right">
          {Number(i.discountTotal) > 0 ? `-${formatMoney(i.discountTotal, i.currency)}` : '—'}
        </span>
      ),
    },
    {
      key: 'grandTotal',
      label: 'Grand Total',
      render: (i) => (
        <span className="font-mono font-bold text-xs text-neutral-950 block text-right">
          {formatMoney(i.grandTotal, i.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (i) => <InvoiceStatusBadge status={i.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (i) => (
        <div className="flex justify-end gap-1.5">
          <Link
            href={`/admin/invoices/${i.id}`}
            className="inline-flex items-center gap-1 text-2xs bg-neutral-900 hover:bg-neutral-800 text-white font-bold px-3 py-1.5 rounded-lg transition shadow-2xs"
          >
            <Eye className="w-3 h-3" /> View / Print Slip
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Receipt className="w-6 h-6 text-neutral-900" />
            <h1 className="text-xl font-black text-neutral-900 tracking-tight font-sans">
              Tax Invoices & Sales Billing
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> GST Registered: 36AABCU9603R1ZM
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Distinct short Order IDs: <span className="font-mono font-bold text-amber-700">ORD-POS-...</span> for counter POS sales and <span className="font-mono font-bold text-indigo-700">ORD-ONL-...</span> for online store orders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {ordersWithoutInvoices.length > 0 && (
            <button
              onClick={handleGenerateAllMissingInvoices}
              disabled={isGeneratingAll}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-xs transition shadow-sm disabled:opacity-50"
            >
              {isGeneratingAll ? <ButtonLoader /> : <Sparkles className="w-3.5 h-3.5" />}
              Generate All Invoices ({ordersWithoutInvoices.length} Pending)
            </button>
          )}

          <button
            onClick={() => {
              refetchInvoices();
              refetchOrders();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Action Message Alert */}
      {actionMessage && (
        <div
          className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-2xs font-bold text-neutral-400 uppercase tracking-wider block">
            Total Invoiced Revenue
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-900 font-mono">
              ₹{totalInvoicedValue.toLocaleString('en-IN')}
            </span>
            <span className="text-2xs text-emerald-600 font-bold">GST Billed</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-2xs font-bold text-neutral-400 uppercase tracking-wider block">
            Total Orders Logged
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-neutral-900 font-mono">
              {orders.length}
            </span>
            <span className="text-2xs text-neutral-400 font-medium">Sales</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-2xs font-bold text-neutral-400 uppercase tracking-wider block">
            Invoices Issued
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 font-mono">
              {invoices.length}
            </span>
            <span className="text-2xs text-neutral-400">Generated</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
          <span className="text-2xs font-bold text-neutral-400 uppercase tracking-wider block">
            Pending Invoice Generation
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl font-black font-mono ${
                ordersWithoutInvoices.length > 0 ? 'text-amber-600' : 'text-neutral-900'
              }`}
            >
              {ordersWithoutInvoices.length}
            </span>
            <span className="text-2xs text-neutral-400">Orders</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
        <button
          onClick={() => setActiveTab('ALL_ORDERS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'ALL_ORDERS'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          All Orders & Invoicing ({combinedOrdersList.length})
        </button>

        <button
          onClick={() => setActiveTab('PENDING')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'PENDING'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          Pending Invoicing ({ordersWithoutInvoices.length})
        </button>

        <button
          onClick={() => setActiveTab('ISSUED_INVOICES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeTab === 'ISSUED_INVOICES'
              ? 'bg-neutral-900 text-white shadow-sm'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Issued Invoices Registry ({invoices.length})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeTab === 'ISSUED_INVOICES'
                ? 'Search by invoice #, ORD-POS/ORD-ONL ref, notes...'
                : 'Search by ORD-POS/ORD-ONL ID, customer, phone, channel...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-2xs font-bold uppercase text-neutral-400">Entity:</span>
            <span className="text-xs font-bold text-neutral-800">Vasanthi&apos;s Signature</span>
          </div>
        </div>
      </div>

      {/* Table Display depending on Active Tab */}
      {activeTab === 'ISSUED_INVOICES' ? (
        <DataTable
          columns={invoiceColumns}
          data={filteredInvoices}
          total={filteredInvoices.length}
          page={page}
          pageSize={15}
          loading={isLoadingInvoices}
          error={isErrorInvoices}
          onRetry={refetchInvoices}
          onPageChange={(p) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', String(p));
            router.push(`/admin/invoices?${params}`);
          }}
          rowKey={(i) => i.id}
          emptyMessage="No issued tax invoices found."
        />
      ) : (
        <DataTable
          columns={orderColumns}
          data={filteredCombinedOrders}
          total={filteredCombinedOrders.length}
          page={page}
          pageSize={15}
          loading={isLoadingOrders || isLoadingInvoices}
          error={isErrorOrders || isErrorInvoices}
          onRetry={() => {
            refetchOrders();
            refetchInvoices();
          }}
          onPageChange={(p) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('page', String(p));
            router.push(`/admin/invoices?${params}`);
          }}
          rowKey={(o) => o.id}
          emptyMessage={
            activeTab === 'PENDING'
              ? 'All orders have tax invoices generated! No pending orders.'
              : 'No orders found.'
          }
        />
      )}
    </div>
  );
}
