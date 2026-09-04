'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useInvoiceDetail } from '@/features/invoices/invoice.hooks';
import { InvoiceStatusBadge } from '@/components/feedback/StatusBadges';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { ArrowLeft, Printer, ShoppingCart, Building2, CheckCircle2, FileText, Receipt, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { formatMoney, formatDate, formatDateTime } from '@/utils/format';
import type { AddressDto } from '@/features/invoices/invoice.types';

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [printFormat, setPrintFormat] = useState<'A4_TAX_INVOICE' | 'THERMAL_SLIP'>('A4_TAX_INVOICE');

  // Query
  const { data: invoice, isLoading, isError, refetch } = useInvoiceDetail(id);

  if (isLoading) {
    return <SectionLoader message="Retrieving official tax invoice records..." />;
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

  const printDocument = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const billingAddr: AddressDto = invoice.billingAddress ?? {};
  const shippingAddr: AddressDto = invoice.shippingAddress ?? {};

  // Tax calculation helpers
  const subtotalNum = Number(invoice.subtotal) || 0;
  const taxTotalNum = Number(invoice.taxTotal) || 0;
  const discountTotalNum = Number(invoice.discountTotal) || 0;
  const grandTotalNum = Number(invoice.grandTotal) || 0;

  // 5% GST breakdown: CGST (2.5%) + SGST (2.5%)
  const cgst = Math.round((taxTotalNum / 2) * 100) / 100;
  const sgst = Math.round((taxTotalNum / 2) * 100) / 100;

  return (
    <div className="space-y-6 print:p-0 print:m-0 print:space-y-0">
      {/* Top Header Panel (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/admin/invoices" className="p-2 hover:bg-neutral-100 rounded-xl transition">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-neutral-900 tracking-tight font-sans">
                Invoice: {invoice.invoiceNumber}
              </h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Issued on: {formatDateTime(invoice.createdAt)} · Order UUID: {invoice.orderId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Format Switcher */}
          <div className="inline-flex bg-neutral-100 p-1 rounded-xl">
            <button
              onClick={() => setPrintFormat('A4_TAX_INVOICE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                printFormat === 'A4_TAX_INVOICE'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              A4 Tax Invoice
            </button>
            <button
              onClick={() => setPrintFormat('THERMAL_SLIP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                printFormat === 'THERMAL_SLIP'
                  ? 'bg-white text-neutral-900 shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              80mm Thermal Slip
            </button>
          </div>

          <button
            onClick={printDocument}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print Document
          </button>
        </div>
      </div>

      {/* RENDER FORMAT 1: FULL A4 GST TAX INVOICE */}
      {printFormat === 'A4_TAX_INVOICE' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-8 space-y-6 print:border-none print:shadow-none print:p-0 print:max-w-none print:w-full">
          {/* Brand Header */}
          <div className="flex justify-between items-start pb-6 border-b border-neutral-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-neutral-950 tracking-wider uppercase font-sans">
                  VASANTHI&apos;S SIGNATURE
                </span>
              </div>
              <p className="text-xs font-semibold text-neutral-600 mt-1">
                Women&apos;s Ethnic Wear & Designer Studio
              </p>
              <p className="text-2xs text-neutral-500 mt-1">
                Plot No. 42, Road No. 36, Jubilee Hills
              </p>
              <p className="text-2xs text-neutral-500">
                Hyderabad, Telangana - 500033, India
              </p>
              <div className="mt-2 text-2xs font-mono space-y-0.5">
                <p className="font-bold text-neutral-800">GSTIN: 36AABCU9603R1ZM</p>
                <p className="text-neutral-500">State: Telangana (Code: 36) · Email: care@vasanthissignature.in</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded bg-neutral-900 text-white font-black text-xs uppercase tracking-widest">
                TAX INVOICE
              </span>
              <p className="text-xs font-mono font-bold text-neutral-900 mt-2">
                Invoice No: {invoice.invoiceNumber}
              </p>
              <p className="text-2xs text-neutral-500 mt-0.5">
                Invoice Date: {formatDate(invoice.createdAt)}
              </p>
              <p className="text-2xs font-mono text-neutral-500 mt-0.5">
                Order Ref: {invoice.orderId.slice(0, 18)}...
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Payment Status: {invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Billing & Shipping Addresses */}
          <div className="grid grid-cols-2 gap-8 text-xs pb-4 border-b border-neutral-100">
            <div className="space-y-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Billed To (Customer)
              </span>
              <span className="font-bold text-neutral-900 block text-sm">
                {billingAddr.fullName || 'Retail Walk-in Customer'}
              </span>
              <span className="text-neutral-600 block">
                {billingAddr.addressLine1 || 'In-Store Counter Purchase'}
              </span>
              {billingAddr.city && (
                <span className="text-neutral-600 block">
                  {billingAddr.city}, {billingAddr.state} {billingAddr.postalCode}
                </span>
              )}
              {billingAddr.phone && (
                <span className="text-neutral-500 block font-mono text-2xs">
                  Phone: {billingAddr.phone}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                Shipped / Handed Over To
              </span>
              <span className="font-bold text-neutral-900 block text-sm">
                {shippingAddr.fullName || billingAddr.fullName || 'Counter Handover / Retail'}
              </span>
              <span className="text-neutral-600 block">
                {shippingAddr.addressLine1 || 'Vasanthi’s Signature Flagship Boutique'}
              </span>
              <span className="text-neutral-600 block">
                Jubilee Hills, Hyderabad, Telangana - 500033
              </span>
              <span className="text-neutral-400 block text-2xs">
                Place of Supply: Telangana (36)
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3">#</th>
                  <th className="p-3">Product Description</th>
                  <th className="p-3">HSN/SAC</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">GST (5%)</th>
                  <th className="p-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="p-3 text-neutral-400 text-2xs">{idx + 1}</td>
                      <td className="p-3 font-bold text-neutral-900">{item.productName}</td>
                      <td className="p-3 font-mono text-2xs text-neutral-500">6204</td>
                      <td className="p-3 font-mono text-2xs text-neutral-500">{item.sku}</td>
                      <td className="p-3 text-center font-semibold">{item.quantity}</td>
                      <td className="p-3 text-right font-mono">
                        {formatMoney(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="p-3 text-right font-mono text-neutral-500">
                        {formatMoney(item.taxAmount || 0, invoice.currency)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-neutral-900">
                        {formatMoney(item.totalPrice, invoice.currency)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3 text-neutral-400 text-2xs">1</td>
                    <td className="p-3 font-bold text-neutral-900">Retail Sales Items</td>
                    <td className="p-3 font-mono text-2xs text-neutral-500">6204</td>
                    <td className="p-3 font-mono text-2xs text-neutral-500">POS-ITEM</td>
                    <td className="p-3 text-center font-semibold">1</td>
                    <td className="p-3 text-right font-mono">
                      {formatMoney(invoice.subtotal, invoice.currency)}
                    </td>
                    <td className="p-3 text-right font-mono text-neutral-500">
                      {formatMoney(invoice.taxTotal, invoice.currency)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-neutral-900">
                      {formatMoney(invoice.grandTotal, invoice.currency)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pricing Totals & GST Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs pt-2">
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">
                GST Tax Breakdown (Intra-State)
              </span>
              <div className="flex justify-between text-neutral-600 text-2xs">
                <span>Central GST (CGST @ 2.5%):</span>
                <span className="font-mono font-semibold">₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-600 text-2xs">
                <span>State GST (SGST @ 2.5%):</span>
                <span className="font-mono font-semibold">₹{sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-1 text-neutral-800 font-bold text-2xs">
                <span>Total Tax Component:</span>
                <span className="font-mono font-bold">{formatMoney(invoice.taxTotal, invoice.currency)}</span>
              </div>
            </div>

            <div className="space-y-2 border border-neutral-200 p-4 rounded-xl">
              <div className="flex justify-between text-neutral-600">
                <span>Taxable Amount (Subtotal):</span>
                <span className="font-mono font-semibold">
                  {formatMoney(invoice.subtotal, invoice.currency)}
                </span>
              </div>
              {discountTotalNum > 0 && (
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Applied Discount:</span>
                  <span className="font-mono">-{formatMoney(invoice.discountTotal, invoice.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>Total GST / Tax:</span>
                <span className="font-mono font-semibold">
                  {formatMoney(invoice.taxTotal, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between border-t-2 border-neutral-900 pt-2 font-black text-base text-neutral-950">
                <span>Grand Total (Net Paid):</span>
                <span className="font-mono">{formatMoney(invoice.grandTotal, invoice.currency)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Declaration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-neutral-200 text-2xs text-neutral-500">
            <div>
              <span className="font-bold text-neutral-700 uppercase tracking-wider block mb-1">
                Terms & Conditions:
              </span>
              <p>1. Goods once sold can be exchanged within 7 days with original invoice tag intact.</p>
              <p>2. Designer and customized garments are strictly non-refundable.</p>
              <p>3. Subject to Hyderabad, Telangana jurisdiction only.</p>
            </div>

            <div className="text-right flex flex-col justify-end items-end">
              <div className="border-b border-neutral-300 w-48 pb-6 mb-1"></div>
              <span className="font-bold text-neutral-800 uppercase">For Vasanthi&apos;s Signature</span>
              <span className="text-neutral-400">Authorized Signatory</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-[10px] text-neutral-400 pt-4 border-t border-dashed border-neutral-200">
            <p>Thank you for choosing Vasanthi&apos;s Signature — Handcrafted Designer Fashion.</p>
          </div>
        </div>
      )}

      {/* RENDER FORMAT 2: 80MM POS THERMAL SLIP */}
      {printFormat === 'THERMAL_SLIP' && (
        <div className="flex justify-center">
          <div className="w-[320px] bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm font-mono text-xs text-neutral-900 space-y-4 print:border-none print:shadow-none print:p-0 print:w-full">
            <div className="text-center space-y-1">
              <h2 className="text-sm font-black uppercase tracking-wider">
                VASANTHI&apos;S SIGNATURE
              </h2>
              <p className="text-[10px] text-neutral-600">Women&apos;s Ethnic Wear & Designer Studio</p>
              <p className="text-[9px] text-neutral-500">Plot 42, Road 36, Jubilee Hills, Hyderabad</p>
              <p className="text-[9px] font-bold text-neutral-700">GSTIN: 36AABCU9603R1ZM</p>
              <p className="text-[9px] text-neutral-500">Tel: +91 91234 56789</p>
            </div>

            <div className="border-t border-b border-dashed border-neutral-300 py-2 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>INVOICE #:</span>
                <span className="font-bold">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{formatDate(invoice.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>TIME:</span>
                <span>{new Date(invoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span>CUSTOMER:</span>
                <span className="truncate max-w-[150px]">{billingAddr.fullName || 'Walk-in Customer'}</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between font-bold border-b border-neutral-200 pb-1">
                <span>ITEM</span>
                <span>QTY x PRICE</span>
                <span>TOTAL</span>
              </div>
              {invoice.items && invoice.items.length > 0 ? (
                invoice.items.map((item) => (
                  <div key={item.id} className="space-y-0.5">
                    <div className="font-bold truncate">{item.productName}</div>
                    <div className="flex justify-between text-neutral-600 text-[9px]">
                      <span>{item.sku}</span>
                      <span>{item.quantity} x ₹{Number(item.unitPrice).toFixed(2)}</span>
                      <span className="font-bold text-neutral-900">₹{Number(item.totalPrice).toFixed(2)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex justify-between text-[10px]">
                  <span>Retail Sale Items</span>
                  <span>1 x ₹{subtotalNum.toFixed(2)}</span>
                  <span>₹{grandTotalNum.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="border-t border-dashed border-neutral-300 pt-2 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{subtotalNum.toFixed(2)}</span>
              </div>
              {discountTotalNum > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span>-₹{discountTotalNum.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>CGST (2.5%):</span>
                <span>₹{cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>SGST (2.5%):</span>
                <span>₹{sgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-xs border-t border-neutral-900 pt-1 text-neutral-950">
                <span>NET TOTAL:</span>
                <span>₹{grandTotalNum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[9px] text-neutral-500 pt-0.5">
                <span>Payment Mode:</span>
                <span className="font-bold uppercase">{invoice.notes?.includes('UPI') ? 'UPI / QR' : 'PAID'}</span>
              </div>
            </div>

            <div className="text-center text-[9px] text-neutral-500 border-t border-dashed border-neutral-200 pt-3 space-y-0.5">
              <p>*** THANK YOU FOR SHOPPING ***</p>
              <p>Visit again: vasanthissignature.in</p>
            </div>
          </div>
        </div>
      )}

      {/* Associated Links (Hidden on Print) */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs print:hidden">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-neutral-400" />
          <span className="text-neutral-500 font-bold">Associated Order UUID:</span>
          <span className="font-mono text-neutral-700">{invoice.orderId}</span>
        </div>
        <Link
          href={`/admin/orders/${invoice.orderId}`}
          className="text-neutral-900 hover:underline font-bold"
        >
          View Order in Orders Desk &rarr;
        </Link>
      </div>
    </div>
  );
}
