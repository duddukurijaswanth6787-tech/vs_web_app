'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useInvoiceDetail } from '@/features/invoices/invoice.hooks';
import { InvoiceStatusBadge } from '@/components/feedback/StatusBadges';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { ArrowLeft, Printer, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { formatMoney, formatDate } from '@/utils/format';
import type { AddressDto } from '@/features/invoices/invoice.types';

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // Query
  const { data: invoice, isLoading, isError, refetch } = useInvoiceDetail(id);

  if (isLoading) {
    return <SectionLoader message="Retrieving invoice document details..." />;
  }

  if (isError || !invoice) {
    return (
      <PageError
        title="Load Failure"
        message="Could not load the invoice records from the server."
        retry={refetch}
      />
    );
  }

  const printInvoice = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const billingAddr: AddressDto = invoice.billingAddress ?? {};
  const shippingAddr: AddressDto = invoice.shippingAddress ?? {};

  return (
    <div className="space-y-6 print:p-0 print:space-y-4">
      {/* Top Header Panel (Hidden on Print) */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/admin/invoices" className="p-2 hover:bg-neutral-100 rounded-xl transition">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Invoice: {invoice.invoiceNumber}</h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-neutral-400 mt-1">Invoice Date: {formatDate(invoice.createdAt)}</p>
          </div>
        </div>
        
        <button
          onClick={printInvoice}
          className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition shadow-sm"
        >
          <Printer className="w-4 h-4" /> Print Invoice
        </button>
      </div>

      {/* Main Invoice Card */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 space-y-8 print:border-none print:shadow-none print:p-0">
        
        {/* Invoice Header */}
        <div className="flex justify-between items-start pb-6 border-b border-neutral-150">
          <div>
            <h2 className="text-lg font-bold text-neutral-950 tracking-wider uppercase">Vasanthi Designers</h2>
            <p className="text-2xs text-neutral-450 mt-1">Premium Women apparel Boutique</p>
            <p className="text-2xs text-neutral-400">123 Fashion Blvd, Suite 100</p>
            <p className="text-2xs text-neutral-400">Mumbai, Maharashtra, India</p>
          </div>
          
          <div className="text-right">
            <h3 className="text-md font-bold text-neutral-900 uppercase">Retail Invoice</h3>
            <p className="text-2xs text-neutral-500 font-mono mt-1">Number: {invoice.invoiceNumber}</p>
            <p className="text-2xs text-neutral-550">Date: {formatDate(invoice.createdAt)}</p>
            <p className="text-2xs text-neutral-500 font-bold uppercase mt-2">Status: {invoice.status}</p>
          </div>
        </div>

        {/* Addresses */}
        <div className="grid grid-cols-2 gap-8 text-xs">
          <div>
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">Billed To</span>
            <span className="font-bold text-neutral-800 block">{billingAddr.fullName || 'Retail Customer'}</span>
            <span className="text-neutral-600 block">{billingAddr.addressLine1 || 'N/A'}</span>
            {billingAddr.city && (
              <span className="text-neutral-600 block">
                {billingAddr.city}, {billingAddr.state} {billingAddr.postalCode}
              </span>
            )}
            {billingAddr.phone && <span className="text-neutral-500 block mt-1">Phone: {billingAddr.phone}</span>}
          </div>

          <div>
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">Shipped To</span>
            <span className="font-bold text-neutral-800 block">{shippingAddr.fullName || 'Retail Customer'}</span>
            <span className="text-neutral-600 block">{shippingAddr.addressLine1 || 'N/A'}</span>
            {shippingAddr.city && (
              <span className="text-neutral-600 block">
                {shippingAddr.city}, {shippingAddr.state} {shippingAddr.postalCode}
              </span>
            )}
            {shippingAddr.phone && <span className="text-neutral-500 block mt-1">Phone: {shippingAddr.phone}</span>}
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="border border-neutral-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[9px]">
                <th className="p-3">Item Description</th>
                <th className="p-3">SKU</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-right">Unit Price</th>
                <th className="p-3 text-right">Tax</th>
                <th className="p-3 text-right">Total Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {invoice.items?.map((item) => (
                <tr key={item.id}>
                  <td className="p-3 font-bold text-neutral-800">{item.productName}</td>
                  <td className="p-3 font-mono text-[10px] text-neutral-500">{item.sku}</td>
                  <td className="p-3 text-center font-semibold">{item.quantity}</td>
                  <td className="p-3 text-right font-mono">{formatMoney(item.unitPrice, invoice.currency)}</td>
                  <td className="p-3 text-right font-mono text-neutral-500">{formatMoney(item.taxAmount, invoice.currency)}</td>
                  <td className="p-3 text-right font-mono font-bold text-neutral-900">{formatMoney(item.totalPrice, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Totals */}
        <div className="flex justify-end text-xs">
          <div className="w-64 space-y-2 border-t border-neutral-100 pt-3">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">{formatMoney(invoice.subtotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-red-500">
              <span>Discount:</span>
              <span className="font-mono font-semibold">-{formatMoney(invoice.discountTotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Tax Total:</span>
              <span className="font-mono font-semibold">{formatMoney(invoice.taxTotal, invoice.currency)}</span>
            </div>
            <div className="flex justify-between border-t border-neutral-250 pt-2 font-bold text-sm text-neutral-950">
              <span>Grand Total:</span>
              <span className="font-mono">{formatMoney(invoice.grandTotal, invoice.currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes (If present) */}
        {invoice.notes && (
          <div className="border-t border-neutral-100 pt-4 text-xs">
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">Invoice Notes</span>
            <p className="text-neutral-500 leading-relaxed italic">{invoice.notes}</p>
          </div>
        )}

        {/* Footer (Always Visible on Print) */}
        <div className="text-center text-[10px] text-neutral-400 pt-8 border-t border-dashed border-neutral-200">
          <p>Thank you for shopping with Vasanthi Designers.</p>
          <p className="mt-1">For return queries, please consult the returns policies on our desk.</p>
        </div>
      </div>

      {/* Associated Links (Hidden on Print) */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex justify-between text-xs print:hidden">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-neutral-400" />
          <span className="text-neutral-500 font-bold">Associated Order UUID:</span>
          <span className="font-mono text-neutral-700">{invoice.orderId}</span>
        </div>
        <Link
          href={`/admin/orders/${invoice.orderId}`}
          className="text-neutral-900 hover:underline font-bold"
        >
          View Order desk &rarr;
        </Link>
      </div>
    </div>
  );
}
