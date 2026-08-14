'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useOrderDetail, useUpdateOrderStatus } from '@/features/orders/order.hooks';
import { useOrderPayments } from '@/features/payments/payment.hooks';
import { useOrderRefunds } from '@/features/refunds/refund.hooks';
import { useOrderInvoices, useCreateInvoice } from '@/features/invoices/invoice.hooks';
import { useCancellationDetail } from '@/features/cancellations/cancellation.hooks';
import { OrderStatusBadge, PaymentStatusBadge, RefundStatusBadge, ChannelBadge } from '@/components/feedback/StatusBadges';
import { SectionLoader, PageError, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { ArrowLeft, User, Clock, CheckCircle2, ChevronRight, Ban, FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import { formatMoney, formatDateTime, formatDate } from '@/utils/format';
import CreateCancellationDialog from '@/features/cancellations/components/CreateCancellationDialog';
import CreateReturnDialog from '@/features/returns/components/CreateReturnDialog';
import { categorizeApiError } from '@/lib/api-error-handler';

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // Dialog Toggles
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [transitionMsg, setTransitionMsg] = useState('');

  // Queries
  const { data: order, isLoading: isOrderLoading, isError, refetch: refetchOrder } = useOrderDetail(id);
  const { data: payments, isLoading: isPaymentsLoading } = useOrderPayments(id, !!order);
  const { data: refunds } = useOrderRefunds(id, !!order);
  const { data: invoices, refetch: refetchInvoices } = useOrderInvoices(id, !!order);
  
  // Try loading cancellation detail if status is CANCELLED
  const { data: cancellation } = useCancellationDetail(id, !!order && order.status === 'CANCELLED');

  // Mutations
  const updateStatusMut = useUpdateOrderStatus();
  const createInvoiceMut = useCreateInvoice();

  const handleStatusTransition = async (nextStatus: string) => {
    try {
      await updateStatusMut.mutateAsync({
        id,
        status: nextStatus,
        message: transitionMsg || undefined,
      });
      setTransitionMsg('');
      refetchOrder();
    } catch (err) {
      console.error(categorizeApiError(err));
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      await createInvoiceMut.mutateAsync({
        orderId: id,
        notes: `Generated on status update: ${order?.status}`,
      });
      refetchInvoices();
    } catch (err) {
      console.error(categorizeApiError(err));
    }
  };

  if (isOrderLoading) {
    return <SectionLoader message="Fetching order fulfillment card..." />;
  }

  if (isError || !order) {
    return (
      <PageError
        title="Fulfillment Fetch Failure"
        message="Could not load details for this order from backend."
        retry={refetchOrder}
      />
    );
  }

  // Determine allowed next status actions
  const getNextStatusActions = (currentStatus: string) => {
    switch (currentStatus.toUpperCase()) {
      case 'PENDING':
        return [{ label: 'Confirm Order', status: 'CONFIRMED', color: 'bg-blue-600 hover:bg-blue-700' }];
      case 'CONFIRMED':
        return [{ label: 'Start Processing', status: 'PROCESSING', color: 'bg-indigo-600 hover:bg-indigo-700' }];
      case 'PROCESSING':
        return [{ label: 'Start Packing', status: 'PACKING', color: 'bg-purple-600 hover:bg-purple-700' }];
      case 'PACKING':
        return [{ label: 'Mark Ready to Ship', status: 'READY_TO_SHIP', color: 'bg-violet-600 hover:bg-violet-700' }];
      case 'READY_TO_SHIP':
        return [{ label: 'Mark Shipped', status: 'SHIPPED', color: 'bg-cyan-600 hover:bg-cyan-700' }];
      case 'SHIPPED':
        return [{ label: 'Out for Delivery', status: 'OUT_FOR_DELIVERY', color: 'bg-teal-600 hover:bg-teal-700' }];
      case 'OUT_FOR_DELIVERY':
        return [{ label: 'Mark Delivered', status: 'DELIVERED', color: 'bg-green-600 hover:bg-green-700' }];
      default:
        return [];
    }
  };

  const nextActions = getNextStatusActions(order.status);
  const showCancelButton = ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status.toUpperCase());
  const showReturnButton = order.status.toUpperCase() === 'DELIVERED';

  const shippingAddr = order.addresses?.find(a => a.addressType === 'SHIPPING');
  const billingAddr = order.addresses?.find(a => a.addressType === 'BILLING') || shippingAddr;

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin/orders" className="p-2 hover:bg-neutral-100 rounded-xl transition">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Order Ref: {order.orderNumber}</h1>
              <OrderStatusBadge status={order.status} />
              <ChannelBadge channel={order.channel} />
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Placed on: {formatDateTime(order.createdAt)}
              {order.channel === 'POS_SHOPORA' && (
                <>
                  {' · '}
                  {order.paymentMethod && <span>Payment: {order.paymentMethod}</span>}
                  {order.terminalId && <span> · Terminal: {order.terminalId}</span>}
                </>
              )}
            </p>
          </div>
        </div>
        
        {/* Dynamic Action Buttons */}
        <div className="flex gap-2">
          {nextActions.map((action) => (
            <button
              key={action.status}
              disabled={updateStatusMut.isPending}
              onClick={() => handleStatusTransition(action.status)}
              className={`${action.color} text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm flex items-center`}
            >
              {updateStatusMut.isPending && <ButtonLoader />} {action.label}
            </button>
          ))}
          
          {showCancelButton && (
            <button
              onClick={() => setIsCancelOpen(true)}
              className="bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2 px-3.5 rounded-xl text-xs border border-red-200 transition"
            >
              Cancel Order
            </button>
          )}

          {showReturnButton && (
            <button
              onClick={() => setIsReturnOpen(true)}
              className="bg-neutral-900 hover:bg-neutral-850 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm"
            >
              Process Return
            </button>
          )}
        </div>
      </div>

      {/* Transition Message Input (If next actions are present) */}
      {nextActions.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex gap-3 items-center">
          <label className="text-xs font-bold text-neutral-500 uppercase shrink-0">Status Update Note (Optional):</label>
          <input
            type="text"
            value={transitionMsg}
            onChange={(e) => setTransitionMsg(e.target.value)}
            placeholder="Provide tracking code or fulfillment remark..."
            className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-800 focus:outline-none"
          />
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Summary and Items */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Items */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
              Ordered Items
            </h3>
            <div className="divide-y divide-neutral-100">
              {order.items?.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-neutral-800 block">{item.productName}</span>
                    {item.variantTitle && <span className="text-[10px] text-neutral-400 block mt-0.5">{item.variantTitle}</span>}
                    <span className="text-[10px] text-neutral-500 block font-mono mt-0.5">SKU: {item.sku}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-neutral-500">{item.quantity} x {formatMoney(item.unitPrice, order.currency)}</div>
                    <div className="font-bold text-neutral-900 mt-0.5">{formatMoney(item.totalPrice, order.currency)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Totals Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-3 text-xs">
            <div className="flex justify-between text-neutral-500">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">{formatMoney(order.subtotal, order.currency)}</span>
            </div>
            <div className="flex justify-between text-red-500">
              <span>Discount Amount:</span>
              <span className="font-mono font-semibold">-{formatMoney(order.discountTotal, order.currency)}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Tax Amount:</span>
              <span className="font-mono font-semibold">{formatMoney(order.taxTotal, order.currency)}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Shipping Charge:</span>
              <span className="font-mono font-semibold">{formatMoney(order.shippingCharge, order.currency)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-neutral-150 font-bold text-sm text-neutral-950">
              <span>Grand Total:</span>
              <span className="font-mono">{formatMoney(order.grandTotal, order.currency)}</span>
            </div>
          </div>

          {/* Payments & Refunds & Invoices */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
              Financial Documents
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payments log */}
              <div className="space-y-2">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Payments Ledger</span>
                {isPaymentsLoading ? (
                  <span className="text-2xs text-neutral-400">Loading payments...</span>
                ) : payments && payments.length > 0 ? (
                  <div className="space-y-2">
                    {payments.map(p => (
                      <div key={p.id} className="border border-neutral-100 p-2.5 rounded-lg bg-neutral-50 text-2xs space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-neutral-900">{p.paymentNumber}</span>
                          <PaymentStatusBadge status={p.status} />
                        </div>
                        <div className="text-neutral-500">Method: {p.method} | Gateway: {p.provider}</div>
                        <div className="font-bold text-neutral-800">{formatMoney(p.amount, p.currency)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-2xs text-neutral-400">No payment transaction records.</span>
                )}
              </div>

              {/* Refunds log */}
              <div className="space-y-2">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Refund Logs</span>
                {refunds && refunds.length > 0 ? (
                  <div className="space-y-2">
                    {refunds.map(r => (
                      <div key={r.id} className="border border-neutral-100 p-2.5 rounded-lg bg-neutral-50 text-2xs space-y-1">
                        <div className="flex justify-between">
                          <span className="font-semibold text-neutral-900">{r.refundNumber}</span>
                          <RefundStatusBadge status={r.status} />
                        </div>
                        <div className="text-neutral-500">Reason: {r.reason}</div>
                        <div className="font-bold text-neutral-850">{formatMoney(r.amount, order.currency)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-2xs text-neutral-400">No refund logs issued.</span>
                )}
              </div>
            </div>

            {/* Invoice generation block */}
            <div className="border-t border-neutral-100 pt-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Order Invoice</span>
                {invoices && invoices.length > 0 ? (
                  <div className="flex items-center gap-2 mt-1.5">
                    <FileText className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs font-bold text-neutral-700">{invoices[0].invoiceNumber}</span>
                    <span className="text-neutral-300">|</span>
                    <span className="text-2xs text-neutral-500">Total: {formatMoney(invoices[0].grandTotal, invoices[0].currency)}</span>
                  </div>
                ) : (
                  <span className="text-2xs text-neutral-400 mt-1 block">No invoice generated for this order yet.</span>
                )}
              </div>
              {(!invoices || invoices.length === 0) && (
                <button
                  disabled={createInvoiceMut.isPending}
                  onClick={handleGenerateInvoice}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-1.5 px-3 rounded-lg text-2xs flex items-center gap-1 transition disabled:opacity-50"
                >
                  {createInvoiceMut.isPending ? <ButtonLoader /> : <Plus className="w-3.5 h-3.5" />} Generate Invoice
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Customer Info, Addresses, Timeline */}
        <div className="space-y-6">
          
          {/* Customer / Address Panel */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
              <User className="w-4 h-4 text-neutral-400" />
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Customer Details</h3>
            </div>
            
            <div className="text-xs space-y-3">
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Account identifier</span>
                <span className="font-mono text-neutral-850 block mt-0.5">{order.customerId}</span>
              </div>
              
              <div className="border-t border-neutral-100 pt-3">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Shipping Address</span>
                {shippingAddr ? (
                  <div className="mt-1 space-y-0.5">
                    <span className="font-bold text-neutral-800 block">{shippingAddr.fullName}</span>
                    <span className="text-neutral-600 block">{shippingAddr.addressLine1}</span>
                    {shippingAddr.addressLine2 && <span className="text-neutral-600 block">{shippingAddr.addressLine2}</span>}
                    <span className="text-neutral-600 block">{shippingAddr.city}, {shippingAddr.state} {shippingAddr.postalCode}</span>
                    <span className="text-neutral-500 block">{shippingAddr.country}</span>
                    <span className="text-neutral-400 block mt-1">Phone: {shippingAddr.phone}</span>
                  </div>
                ) : (
                  <span className="text-neutral-400 block mt-1">No shipping address provided</span>
                )}
              </div>

              <div className="border-t border-neutral-100 pt-3">
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Billing Address</span>
                {billingAddr ? (
                  <div className="mt-1 space-y-0.5">
                    <span className="font-bold text-neutral-800 block">{billingAddr.fullName}</span>
                    <span className="text-neutral-600 block">{billingAddr.addressLine1}</span>
                    <span className="text-neutral-600 block">{billingAddr.city}, {billingAddr.state} {billingAddr.postalCode}</span>
                    <span className="text-neutral-400 block mt-1">Phone: {billingAddr.phone}</span>
                  </div>
                ) : (
                  <span className="text-neutral-400 block mt-1">Same as shipping address</span>
                )}
              </div>
            </div>
          </div>

          {/* Cancellation Info Panel (Only if Cancelled) */}
          {order.status === 'CANCELLED' && cancellation && (
            <div className="bg-red-50 p-5 rounded-2xl border border-red-200 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-red-800 font-bold">
                <Ban className="w-4 h-4" />
                <span>Cancellation Information</span>
              </div>
              <div>
                <span className="text-[10px] text-red-700/60 font-bold block uppercase tracking-wider">Cancellation Reason:</span>
                <p className="text-red-700 mt-0.5 font-medium">{cancellation.reason}</p>
              </div>
              <div className="flex justify-between border-t border-red-100 pt-2 text-[10px] text-red-600">
                <span>Refund state: {cancellation.refundStatus}</span>
                <span>Date: {formatDate(cancellation.createdAt)}</span>
              </div>
            </div>
          )}

          {/* Chronological Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
              <Clock className="w-4 h-4 text-neutral-400" />
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Fulfillment Timeline</h3>
            </div>
            
            <div className="space-y-4 relative before:absolute before:inset-y-1 before:left-3.5 before:w-0.5 before:bg-neutral-100">
              {order.timeline?.map((evt, index) => {
                const isLatest = index === 0;
                return (
                  <div key={evt.id} className="flex gap-3 items-start relative text-xs">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center border shrink-0 z-10 bg-white
                      ${isLatest ? 'border-neutral-900 text-neutral-950 font-bold' : 'border-neutral-200 text-neutral-400'}
                    `}>
                      {isLatest ? <CheckCircle2 className="w-4 h-4" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </div>
                    <div className="pt-0.5">
                      <span className={`font-bold block ${isLatest ? 'text-neutral-900' : 'text-neutral-600'}`}>{evt.status}</span>
                      {evt.message && <p className="text-neutral-500 mt-0.5 text-2xs">{evt.message}</p>}
                      <div className="text-[9px] text-neutral-400 mt-1 flex gap-2">
                        <span>{formatDateTime(evt.createdAt)}</span>
                        {evt.createdBy && <span>• Op: {evt.createdBy.substring(0, 8)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Dialog: Cancellation Request */}
      {isCancelOpen && (
        <CreateCancellationDialog
          orderId={order.id}
          orderNumber={order.orderNumber}
          onClose={() => setIsCancelOpen(false)}
          onSuccess={() => refetchOrder()}
        />
      )}

      {/* Dialog: Return request */}
      {isReturnOpen && (
        <CreateReturnDialog
          order={order}
          onClose={() => setIsReturnOpen(false)}
          onSuccess={() => refetchOrder()}
        />
      )}
    </div>
  );
}
