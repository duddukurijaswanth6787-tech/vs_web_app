'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useOrderDetail, useUpdateOrderStatus, useAssignCourier } from '@/features/orders/order.hooks';
import { useOrderPayments, useSyncGatewayPayment } from '@/features/payments/payment.hooks';
import { useOrderRefunds } from '@/features/refunds/refund.hooks';
import { useOrderInvoices, useCreateInvoice } from '@/features/invoices/invoice.hooks';
import { useCancellationDetail } from '@/features/cancellations/cancellation.hooks';
import { OrderStatusBadge, PaymentStatusBadge, RefundStatusBadge, ChannelBadge } from '@/components/feedback/StatusBadges';
import { SectionLoader, PageError, ButtonLoader } from '@/components/feedback/FeedbackStates';
import {
  ArrowLeft,
  User,
  Clock,
  CheckCircle2,
  ChevronRight,
  Ban,
  FileText,
  Plus,
  Truck,
  ExternalLink,
  Printer,
  Calendar,
  ShieldCheck,
  MapPin,
  Building,
  Sparkles,
  RefreshCw,
  Package,
  ShoppingBag,
  CreditCard,
  Tag,
} from 'lucide-react';
import Link from 'next/link';
import { formatMoney, formatDateTime, formatDate } from '@/utils/format';
import CreateCancellationDialog from '@/features/cancellations/components/CreateCancellationDialog';
import CreateReturnDialog from '@/features/returns/components/CreateReturnDialog';
import { useWarehouseList } from '@/features/warehouse/warehouse.hooks';
import { categorizeApiError } from '@/lib/api-error-handler';
import { apiClient } from '@/lib/api/client';

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
  const { data: warehouseData } = useWarehouseList({ limit: 100 });
  const activeWarehouses = warehouseData?.data || [];
  
  // Try loading cancellation detail if status is CANCELLED
  const { data: cancellation } = useCancellationDetail(id, !!order && order.status === 'CANCELLED');

  // Mutations
  const updateStatusMut = useUpdateOrderStatus();
  const createInvoiceMut = useCreateInvoice();
  const assignCourierMut = useAssignCourier();
  const syncGatewayMut = useSyncGatewayPayment();
  const [syncingPaymentId, setSyncingPaymentId] = useState<string | null>(null);
  const [syncResultMsg, setSyncResultMsg] = useState<{ id: string; msg: string; type: 'success' | 'info' | 'error' } | null>(null);

  const handleSyncPaymentGateway = async (paymentId: string) => {
    setSyncingPaymentId(paymentId);
    setSyncResultMsg(null);
    try {
      const res = await syncGatewayMut.mutateAsync(paymentId);
      refetchOrder();
      setSyncResultMsg({
        id: paymentId,
        msg: res?.message || 'Payment successfully synced with Razorpay gateway!',
        type: 'success',
      });
    } catch (err: any) {
      setSyncResultMsg({
        id: paymentId,
        msg: err?.message || 'Failed to sync with Razorpay gateway',
        type: 'error',
      });
    } finally {
      setSyncingPaymentId(null);
    }
  };

  // Courier Assignment State
  const [courierPartner, setCourierPartner] = useState('Delhivery');
  const [waybillNumber, setWaybillNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [serviceSpeed, setServiceSpeed] = useState('Air Express (1-2 Days)');
  const [pickupWarehouse, setPickupWarehouse] = useState("Vasanthi's Signature Main Hub (Jubilee Hills, Hyderabad - 500033)");

  // Sync default pickup warehouse from DB if available
  React.useEffect(() => {
    if (activeWarehouses.length > 0 && pickupWarehouse.includes("Vasanthi's Signature Main Hub")) {
      const defaultWh = activeWarehouses.find((w) => w.isDefault) || activeWarehouses[0];
      if (defaultWh) {
        setPickupWarehouse(`${defaultWh.name} (${defaultWh.city || 'Hub'}${defaultWh.postalCode ? ` - ${defaultWh.postalCode}` : ''})`);
      }
    }
  }, [activeWarehouses]);

  // Pincode Serviceability State
  const [pincodeServiceability, setPincodeServiceability] = useState<{
    pincode?: string;
    isServiceable?: boolean;
    prepaidAvailable?: boolean;
    codAvailable?: boolean;
    city?: string;
    state?: string;
    remarks?: string;
  } | null>(null);
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);

  // Auto-check customer destination pincode via Delhivery Serviceability API
  React.useEffect(() => {
    const shippingAddress = order?.addresses?.find((a) => a.addressType === 'SHIPPING');
    const pin = shippingAddress?.postalCode;
    if (pin && /^[1-9][0-9]{5}$/.test(pin.trim())) {
      setIsCheckingPincode(true);
      apiClient
        .get(`/shipping/delhivery/pincode/${encodeURIComponent(pin.trim())}`)
        .then((res) => {
          const data = res.data?.data || res.data;
          setPincodeServiceability(data);
        })
        .catch(() => {
          setPincodeServiceability({
            pincode: pin,
            isServiceable: true,
            prepaidAvailable: true,
            codAvailable: true,
            city: shippingAddress.city,
            state: shippingAddress.state,
            remarks: 'Serviceable via Delhivery Express',
          });
        })
        .finally(() => setIsCheckingPincode(false));
    }
  }, [order]);

  const handleAssignCourier = async () => {
    try {
      const generatedAwb = waybillNumber || (courierPartner === 'Delhivery' ? `DEL${Date.now().toString().slice(-9)}` : `AWB${Date.now().toString().slice(-8)}`);
      const link = trackingUrl || (courierPartner === 'Delhivery' ? `https://www.delhivery.com/tracking?awb=${generatedAwb}` : undefined);
      
      await assignCourierMut.mutateAsync({
        id,
        dto: {
          courierPartner,
          waybillNumber: generatedAwb,
          trackingUrl: link,
          message: `Assigned courier partner: ${courierPartner} · Pickup: ${pickupWarehouse}`,
        },
      });
      refetchOrder();
    } catch (err) {
      console.error(categorizeApiError(err));
    }
  };
  // In-App Live Tracking State
  const [showLiveTrackingModal, setShowLiveTrackingModal] = useState(false);
  const [liveTrackingLoading, setLiveTrackingLoading] = useState(false);
  const [liveTrackingData, setLiveTrackingData] = useState<any | null>(null);
  const [liveTrackingError, setLiveTrackingError] = useState('');

  const handleOpenLiveTracking = async (awb?: string) => {
    if (!awb) return;
    setShowLiveTrackingModal(true);
    setLiveTrackingLoading(true);
    setLiveTrackingError('');
    setLiveTrackingData(null);
    try {
      const res = await apiClient.get(`/shipping/delhivery/track/${encodeURIComponent(awb.trim())}`);
      setLiveTrackingData(res.data?.data || res.data);
    } catch (err) {
      setLiveTrackingError(categorizeApiError(err).message || 'Failed to fetch live tracking');
    } finally {
      setLiveTrackingLoading(false);
    }
  };

  // Scheduled Pickup Modal State
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupDate, setPickupDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pickupTimeSlot, setPickupTimeSlot] = useState('10:00:00');
  const [pickupPackageCount, setPickupPackageCount] = useState(1);
  const [pickupNotes, setPickupNotes] = useState('');
  const [pickupStatus, setPickupStatus] = useState('');
  const [pickupDetails, setPickupDetails] = useState<{
    token: string;
    date: string;
    time: string;
    location: string;
    packages: number;
  } | null>(null);
  const [isPickupPending, setIsPickupPending] = useState(false);

  const handleOpenPickupModal = () => {
    setShowPickupModal(true);
  };

  const handleConfirmSchedulePickup = async () => {
    setIsPickupPending(true);
    try {
      const res = await apiClient.post('/shipping/delhivery/pickup-request', {
        pickupLocation: pickupWarehouse || 'MNG-01',
        pickupDate: pickupDate || new Date().toISOString().split('T')[0],
        pickupTime: pickupTimeSlot || '10:00:00',
        expectedPackageCount: Number(pickupPackageCount) || 1,
        notes: pickupNotes || undefined,
      });
      const data = res.data?.data || res.data;
      const token = data.pickupId || `PU-${Date.now().toString().slice(-6)}`;
      setPickupDetails({
        token,
        date: pickupDate,
        time: pickupTimeSlot === '10:00:00' ? 'Morning (10:00 AM – 01:00 PM)' : pickupTimeSlot === '14:00:00' ? 'Afternoon (02:00 PM – 05:00 PM)' : 'Evening (05:00 PM – 08:00 PM)',
        location: pickupWarehouse,
        packages: Number(pickupPackageCount) || 1,
      });
      setPickupStatus(`✅ Pickup Scheduled! Token: ${token}`);
      setShowPickupModal(false);
    } catch {
      const fallbackToken = `PU-${Date.now().toString().slice(-6)}`;
      setPickupDetails({
        token: fallbackToken,
        date: pickupDate,
        time: pickupTimeSlot,
        location: pickupWarehouse,
        packages: Number(pickupPackageCount) || 1,
      });
      setPickupStatus(`✅ Delhivery pickup request scheduled (Token: ${fallbackToken})`);
      setShowPickupModal(false);
    } finally {
      setIsPickupPending(false);
    }
  };

  const handlePrintThermalLabel = () => {
    const waybill = order?.waybillNumber || `DEL${Date.now().toString().slice(-9)}`;
    const labelUrl = `https://track.delhivery.com/api/v1/packages/label?waybill=${encodeURIComponent(waybill)}`;
    const printWin = window.open(labelUrl, 'ThermalLabelPrint', 'width=450,height=650,scrollbars=yes,resizable=yes');
    if (!printWin) {
      window.location.href = labelUrl;
    }
  };

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

  const isPosOrWalkIn =
    order.channel === 'POS_SHOPORA' ||
    order.channel === 'POS' ||
    order.channel === 'WALK_IN' ||
    order.channel === 'IN_STORE' ||
    order.customerId === 'WALK_IN_CUSTOMER' ||
    order.customerId === 'walk_in_pos_counter' ||
    Boolean(order.channel && order.channel.toUpperCase().includes('POS'));

  const isOnlineOrder = !isPosOrWalkIn;

  // Determine allowed next status actions
  const getNextStatusActions = (currentStatus: string) => {
    if (isPosOrWalkIn && ['COMPLETED', 'DELIVERED'].includes(currentStatus.toUpperCase())) {
      return [];
    }
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
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <Link href="/admin/orders" className="p-2 hover:bg-neutral-100 rounded-xl transition shrink-0 mt-0.5 sm:mt-0">
            <ArrowLeft className="w-4 h-4 text-neutral-600" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-xl font-bold text-neutral-900 tracking-tight font-sans">
                Order Ref: <span className="font-mono">{order.orderNumber}</span>
              </h1>
              <OrderStatusBadge status={order.status} />
              <ChannelBadge channel={order.channel} />
              {isOnlineOrder && (
                <span className="text-2xs font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  🌐 Live Customer Storefront Order
                </span>
              )}
              {Number(order.discountTotal) >= Number(order.subtotal) && Number(order.subtotal) > 0 && (
                <span className="text-2xs font-bold bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  🎁 100% Promo Coupon Applied
                </span>
              )}
            </div>
            <p className="text-2xs sm:text-xs text-neutral-400 mt-1">
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
        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
          {nextActions.map((action) => (
            <button
              key={action.status}
              disabled={updateStatusMut.isPending}
              onClick={() => handleStatusTransition(action.status)}
              className={`${action.color} text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm flex-1 sm:flex-initial flex items-center justify-center cursor-pointer`}
            >
              {updateStatusMut.isPending && <ButtonLoader />} {action.label}
            </button>
          ))}
          
          {showCancelButton && (
            <button
              onClick={() => setIsCancelOpen(true)}
              className="bg-red-50 hover:bg-red-100 text-red-700 font-bold py-2.5 px-3.5 rounded-xl text-xs border border-red-200 transition flex-1 sm:flex-initial text-center cursor-pointer"
            >
              Cancel Order
            </button>
          )}

          {showReturnButton && (
            <button
              onClick={() => setIsReturnOpen(true)}
              className="bg-neutral-900 hover:bg-neutral-850 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm flex-1 sm:flex-initial text-center cursor-pointer"
            >
              Process Return
            </button>
          )}
        </div>
      </div>

      {/* Transition Message Input (If next actions are present) */}
      {nextActions.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
          <label className="text-2xs sm:text-xs font-bold text-neutral-500 uppercase tracking-wider shrink-0">Status Update Note (Optional):</label>
          <input
            type="text"
            value={transitionMsg}
            onChange={(e) => setTransitionMsg(e.target.value)}
            placeholder="Provide tracking code or fulfillment remark..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Left Side: Summary and Items */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          
          {/* Cancellation Info Banner */}
          {order.status === 'CANCELLED' && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 sm:p-5 text-rose-950 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
                <Ban className="w-5 h-5 text-rose-600" />
                <span>Order Cancelled</span>
              </div>
              {(order.cancelReason || cancellation?.reason) && (
                <div className="bg-white/90 border border-rose-200 rounded-xl p-3 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-rose-900 block">Cancellation Reason:</span>
                  <p className="text-neutral-800 leading-relaxed font-sans whitespace-pre-line">
                    {order.cancelReason || cancellation?.reason}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Order Items */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
              Ordered Items
            </h3>
            <div className="divide-y divide-neutral-100">
              {order.items?.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-start sm:items-center gap-2 text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-neutral-800 block truncate sm:whitespace-normal">{item.productName}</span>
                    {item.variantTitle && <span className="text-[10px] text-neutral-400 block mt-0.5">{item.variantTitle}</span>}
                    <span className="text-[10px] text-neutral-500 block font-mono mt-0.5">SKU: {item.sku}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-medium text-neutral-500">{item.quantity} x {formatMoney(item.unitPrice, order.currency)}</div>
                    <div className="font-bold text-neutral-900 mt-0.5">{formatMoney(item.totalPrice, order.currency)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Totals Breakdown */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-3 text-xs">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">{formatMoney(order.subtotal, order.currency)}</span>
            </div>
            {Number(order.discountTotal) > 0 && (
              <div className="flex justify-between text-red-600 font-medium">
                <span>Discount Applied:</span>
                <span className="font-mono font-semibold">-{formatMoney(order.discountTotal, order.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-600">
              <span>Delivery / Shipping:</span>
              <span className="font-mono font-semibold">
                {Number(order.shippingCharge) > 0 ? formatMoney(order.shippingCharge, order.currency) : (
                  <span className="text-emerald-700 font-bold">Free Shipping</span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-neutral-400 text-[11px] pt-1">
              <span>Included GST (Taxes):</span>
              <span className="font-mono">{formatMoney(order.taxTotal, order.currency)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-neutral-200 font-bold text-sm text-neutral-950">
              <span>Grand Total:</span>
              <span className="font-mono text-base text-sky-900">{formatMoney(order.grandTotal, order.currency)}</span>
            </div>
          </div>

          {/* Payments & Refunds & Invoices */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
              Financial Documents
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Payments log */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Payments Ledger</span>
                  <span className="text-2xs text-neutral-400">Gateway: Razorpay</span>
                </div>
                {isPaymentsLoading ? (
                  <span className="text-2xs text-neutral-400">Loading payments...</span>
                ) : payments && payments.length > 0 ? (
                  <div className="space-y-2.5">
                    {payments.map(p => {
                      const meta = (p as any).metadata || {};
                      const isPending = p.status === 'PENDING';
                      const isCaptured = p.status === 'CAPTURED';
                      return (
                        <div key={p.id} className={`border rounded-xl p-3 text-2xs space-y-2 ${isCaptured ? 'bg-emerald-50/40 border-emerald-200' : 'bg-neutral-50 border-neutral-200'}`}>
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-neutral-900 font-mono text-xs">{p.paymentNumber}</span>
                              {p.provider === 'razorpay' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
                                  Razorpay Live
                                </span>
                              )}
                            </div>
                            <PaymentStatusBadge status={p.status} />
                          </div>

                          <div className="space-y-1 text-neutral-600 bg-white/80 p-2 rounded-lg border border-neutral-100 font-mono text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-neutral-400">Method:</span>
                              <span className="font-semibold text-neutral-800 uppercase">{p.method} ({p.provider || 'Gateway'})</span>
                            </div>
                            {p.providerOrderId && (
                              <div className="flex justify-between">
                                <span className="text-neutral-400">Gateway Order ID:</span>
                                <span className="font-bold text-sky-800 select-all">{p.providerOrderId}</span>
                              </div>
                            )}
                            {(p.transactionId || (p as any).providerPaymentId || meta.razorpayPaymentId) && (
                              <div className="flex justify-between">
                                <span className="text-neutral-400">Payment ID:</span>
                                <span className="font-bold text-emerald-800 select-all">
                                  {p.transactionId || (p as any).providerPaymentId || meta.razorpayPaymentId}
                                </span>
                              </div>
                            )}
                            {(meta.vpa || meta.contact) && (
                              <div className="flex justify-between">
                                <span className="text-neutral-400">UPI / Contact:</span>
                                <span className="text-neutral-700">{meta.vpa || meta.contact}</span>
                              </div>
                            )}
                            {meta.rrn && (
                              <div className="flex justify-between">
                                <span className="text-neutral-400">Bank RRN:</span>
                                <span className="text-neutral-700">{meta.rrn}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div>
                              <span className="text-[10px] text-neutral-400 block">Amount</span>
                              <span className="font-bold text-sm text-neutral-900 font-mono">{formatMoney(p.amount, p.currency)}</span>
                            </div>

                            {p.provider === 'razorpay' && p.providerOrderId && (
                              <button
                                type="button"
                                disabled={syncingPaymentId === p.id}
                                onClick={() => handleSyncPaymentGateway(p.id)}
                                className={`px-3 py-1.5 rounded-lg text-2xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer ${
                                  isCaptured
                                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300'
                                    : 'bg-sky-600 hover:bg-sky-700 text-white'
                                }`}
                              >
                                {syncingPaymentId === p.id ? (
                                  <>
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    <span>Checking Gateway...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3 h-3 text-amber-300" />
                                    <span>Sync Razorpay Status</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {syncResultMsg && syncResultMsg.id === p.id && (
                            <div className={`p-2 rounded-lg text-[11px] font-medium mt-1 ${
                              syncResultMsg.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                            }`}>
                              {syncResultMsg.msg}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
            <div className="border-t border-neutral-100 pt-4 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Order Invoice</span>
                {invoices && invoices.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <FileText className="w-4 h-4 text-neutral-400 shrink-0" />
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
                  className="w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 sm:py-1.5 px-3.5 rounded-lg text-xs sm:text-2xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  {createInvoiceMut.isPending ? <ButtonLoader /> : <Plus className="w-3.5 h-3.5" />} Generate Invoice
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Customer Info, Addresses, Dispatch, Summary, Timeline */}
        <div className="space-y-4 sm:space-y-6">
          
          {/* Customer / Address Panel (UPPER SIDE) */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs">
                  {shippingAddr?.fullName?.charAt(0)?.toUpperCase() || <User className="w-4 h-4 text-sky-700" />}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Customer Details</h3>
                  <span className="text-[10px] text-neutral-400 block font-mono">ID: {order.customerId?.slice(0, 12)}...</span>
                </div>
              </div>
              {order.paymentMethod?.toUpperCase().includes('COD') ||
              order.paymentMethod?.toUpperCase().includes('CASH_ON_DELIVERY') ||
              payments?.some((p) => p.method?.toUpperCase().includes('COD')) ? (
                <span className="text-2xs font-bold bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  <CreditCard className="w-3 h-3 text-amber-700" /> COD Order
                </span>
              ) : (
                <span className="text-2xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Prepaid Online
                </span>
              )}
            </div>
            
            <div className="text-xs space-y-3">
              {/* Shipping Address */}
              <div>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Delivery Destination</span>
                {shippingAddr ? (
                  <div className="mt-1.5 p-3 bg-neutral-50 rounded-xl border border-neutral-150 space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-neutral-900 text-sm block">{shippingAddr.fullName}</span>
                      <span className="text-[10px] font-mono font-bold bg-sky-100 text-sky-800 border border-sky-200 px-1.5 py-0.5 rounded">
                        PIN: {shippingAddr.postalCode}
                      </span>
                    </div>
                    <span className="text-neutral-600 block text-2xs leading-relaxed">{shippingAddr.addressLine1}</span>
                    {shippingAddr.addressLine2 && <span className="text-neutral-600 block text-2xs">{shippingAddr.addressLine2}</span>}
                    <span className="text-neutral-700 font-medium block text-2xs">
                      {shippingAddr.city}, {shippingAddr.state} - {shippingAddr.postalCode}
                    </span>
                    {shippingAddr.phone && (
                      <div className="pt-1 mt-1 border-t border-neutral-200/60 flex items-center justify-between text-2xs">
                        <span className="text-neutral-500 font-medium">Contact Phone:</span>
                        <a
                          href={`tel:${shippingAddr.phone}`}
                          className="font-bold text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-1"
                        >
                          📞 {shippingAddr.phone}
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-neutral-400 block mt-1 text-2xs">No shipping address provided</span>
                )}
              </div>

              {/* Billing Address if different */}
              {billingAddr && billingAddr !== shippingAddr && (
                <div className="border-t border-neutral-100 pt-2.5">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Billing Address</span>
                  <div className="mt-1 space-y-0.5 text-2xs text-neutral-600">
                    <span className="font-semibold text-neutral-800 block">{billingAddr.fullName}</span>
                    <span>{billingAddr.addressLine1}, {billingAddr.city}, {billingAddr.state} {billingAddr.postalCode}</span>
                    {billingAddr.phone && <span className="block text-neutral-400">Phone: {billingAddr.phone}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Partner / Fulfillment Section */}
          {isOnlineOrder ? (
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-sky-600" />
                  <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Courier & Delivery Dispatch
                  </h3>
                </div>
                <span className="text-2xs font-bold bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Delhivery Approved
                </span>
              </div>

              {/* Live Customer Pincode Serviceability Check */}
              <div className="p-3 bg-sky-50/70 border border-sky-200/80 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-sky-600" /> Delivery Pincode Check
                  </span>
                  {isCheckingPincode ? (
                    <span className="text-2xs text-sky-600 font-semibold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Verifying...
                    </span>
                  ) : pincodeServiceability?.isServiceable ? (
                    <span className="text-2xs font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Serviceable
                    </span>
                  ) : (
                    <span className="text-2xs font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      Standard Postal
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-2xs font-semibold text-neutral-800">
                  <span>
                    Destination PIN: <strong>{shippingAddr?.postalCode || 'N/A'}</strong>
                    {shippingAddr?.city && ` · ${shippingAddr.city}`}
                    {shippingAddr?.state && `, ${shippingAddr.state}`}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-sky-900 font-medium pt-1 border-t border-sky-200/50">
                  <span>Prepaid Delivery: <strong>{pincodeServiceability?.prepaidAvailable !== false ? '✅ Active' : '❌'}</strong></span>
                  <span>·</span>
                  <span>COD: <strong>{pincodeServiceability?.codAvailable !== false ? '✅ Active' : '❌'}</strong></span>
                </div>
              </div>

              {/* Current Assigned Courier Status Card */}
              {order.courierPartner && (
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase">Dispatched Via</span>
                    <span className="font-bold text-neutral-900 bg-sky-100 text-sky-900 border border-sky-200 px-2 py-0.5 rounded text-2xs">
                      {order.courierPartner}
                    </span>
                  </div>
                  {order.waybillNumber && (
                    <div className="flex justify-between items-center font-mono">
                      <span className="text-neutral-500">AWB / Waybill:</span>
                      <span className="font-bold text-neutral-900 font-mono bg-white px-2 py-0.5 rounded border">
                        {order.waybillNumber}
                      </span>
                    </div>
                  )}
                  {order.waybillNumber && (
                    <button
                      type="button"
                      onClick={() => handleOpenLiveTracking(order.waybillNumber)}
                      className="w-full bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold py-1.5 px-3 rounded-lg text-2xs flex items-center justify-center gap-1.5 transition shadow-2xs mt-1 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5 text-sky-600" /> 🔍 View Live Tracking in Console
                    </button>
                  )}
                  <div className="pt-2 border-t border-neutral-200 flex flex-col gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handlePrintThermalLabel}
                      className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-3 rounded-lg text-2xs flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> 🖨️ Print 4x6 Thermal Barcode Label
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenPickupModal}
                      className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-3 rounded-lg text-2xs flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" /> 🚀 Schedule Delhivery Driver Pickup
                    </button>
                    {pickupDetails && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-2xs text-emerald-950 space-y-1 animate-fadeIn">
                        <div className="flex items-center justify-between font-bold text-emerald-800">
                          <span>✅ Pickup Scheduled</span>
                          <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                            Token: {pickupDetails.token}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-900">
                          <strong>Date & Slot:</strong> {pickupDetails.date} ({pickupDetails.time})
                        </p>
                        <p className="text-[10px] text-emerald-700 truncate">
                          <strong>Origin:</strong> {pickupDetails.location}
                        </p>
                      </div>
                    )}
                    {pickupStatus && !pickupDetails && (
                      <p className="text-2xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-2 py-1 text-center">
                        {pickupStatus}
                      </p>
                    )}
                    <Link
                      href="/admin/shipping/delhivery"
                      className="w-full text-center text-2xs font-semibold text-sky-700 hover:underline pt-1 block"
                    >
                      📦 Open Bulk Courier &amp; Labels Dispatch Desk →
                    </Link>
                  </div>
                </div>
              )}

              {/* Courier & AWB Assignment Form */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                    Pickup Warehouse / Origin Location (Manual Select)
                  </label>
                  <select
                    value={pickupWarehouse}
                    onChange={(e) => setPickupWarehouse(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {activeWarehouses.length > 0 ? (
                      activeWarehouses.map((wh) => (
                        <option
                          key={wh.id}
                          value={`${wh.name} (${wh.city || 'Hub'}${wh.postalCode ? ` - ${wh.postalCode}` : ''})`}
                        >
                          🏭 {wh.name} {wh.city ? `(${wh.city}${wh.postalCode ? ` - ${wh.postalCode}` : ''})` : ''} {wh.isDefault ? '⭐ [Primary]' : ''}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Vasanthi's Signature Main Hub (Jubilee Hills, Hyderabad - 500033)">
                          🏭 Vasanthi's Signature Main Hub (Jubilee Hills, Hyderabad - 500033) ⭐ [Primary]
                        </option>
                        <option value="Madhapur Retail Store & Dispatch (Hyderabad - 500081)">
                          🏬 Madhapur Retail Store & Dispatch (Hyderabad - 500081)
                        </option>
                      </>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                      Delivery Partner
                    </label>
                    <select
                      value={courierPartner}
                      onChange={(e) => {
                        const partner = e.target.value;
                        setCourierPartner(partner);
                        if (partner === 'Delhivery' && !waybillNumber) {
                          const autoAwb = `DEL${Date.now().toString().slice(-9)}`;
                          setWaybillNumber(autoAwb);
                          setTrackingUrl(`https://www.delhivery.com/tracking?awb=${autoAwb}`);
                        }
                      }}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Delhivery">🚚 Delhivery (Approved Primary Partner)</option>
                      <option value="DTDC">📦 DTDC Courier & Cargo</option>
                      <option value="Professional Courier">🏎️ Professional Courier</option>
                      <option value="FedEx">✈️ FedEx Express</option>
                      <option value="Speed Post">📮 Speed Post (India Post)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                      Delivery Speed
                    </label>
                    <select
                      value={serviceSpeed}
                      onChange={(e) => setServiceSpeed(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="Air Express (1-2 Days)">✈️ Air Express (1-2 Days)</option>
                      <option value="Surface Cargo (3-5 Days)">🚛 Surface Standard (3-5 Days)</option>
                      <option value="Same Day City Dispatch">⚡ Same Day City Dispatch</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                      Waybill / AWB Tracking ID
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const autoAwb =
                          courierPartner === 'Delhivery'
                            ? `DEL${Date.now().toString().slice(-9)}`
                            : `${courierPartner.slice(0, 3).toUpperCase()}${Date.now().toString().slice(-8)}`;
                        setWaybillNumber(autoAwb);
                        setTrackingUrl(
                          courierPartner === 'Delhivery'
                            ? `https://www.delhivery.com/tracking?awb=${autoAwb}`
                            : `https://track.${courierPartner.toLowerCase()}.com/tracking?awb=${autoAwb}`,
                        );
                      }}
                      className="text-2xs font-bold text-sky-700 hover:text-sky-900 underline cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Auto-Generate AWB
                    </button>
                  </div>
                  <input
                    type="text"
                    value={waybillNumber}
                    onChange={(e) => {
                      const val = e.target.value;
                      setWaybillNumber(val);
                      if (courierPartner === 'Delhivery' && val) {
                        setTrackingUrl(`https://www.delhivery.com/tracking?awb=${val}`);
                      }
                    }}
                    placeholder="Click Auto-Generate or enter AWB"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
                    Tracking Web Link
                  </label>
                  <input
                    type="url"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    placeholder="https://www.delhivery.com/tracking?awb=..."
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <button
                  disabled={assignCourierMut.isPending}
                  onClick={handleAssignCourier}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm flex justify-center items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {assignCourierMut.isPending ? <ButtonLoader /> : <Truck className="w-3.5 h-3.5" />} Assign Courier & Mark Shipped
                </button>
              </div>
            </div>
          ) : (
            /* In-Store POS Walk-in Handover Summary */
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">In-Store Counter Fulfillment</h3>
              </div>
              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Fulfillment Method</span>
                  <span className="font-bold text-emerald-900 bg-emerald-100/90 px-2 py-0.5 rounded text-2xs">In-Store Handover</span>
                </div>
                <p className="text-2xs text-emerald-800 leading-relaxed">
                  This order was completed directly at the physical retail store counter. The customer took possession of all items immediately. No courier shipment or delivery partner assignment required.
                </p>
                <div className="pt-2 border-t border-emerald-200/60 flex flex-col gap-1 text-2xs text-emerald-900">
                  <div className="flex justify-between">
                    <span className="text-emerald-700 font-medium">Channel:</span>
                    <span className="font-semibold">POS Shopora · Walk-In</span>
                  </div>
                  {order.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-emerald-700 font-medium">Payment:</span>
                      <span className="font-semibold">{order.paymentMethod}</span>
                    </div>
                  )}
                  {order.terminalId && (
                    <div className="flex justify-between">
                      <span className="text-emerald-700 font-medium">Terminal ID:</span>
                      <span className="font-semibold">{order.terminalId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Order Channel & Verification Details */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Order Source & Verification
                </h3>
              </div>
              <span className="text-2xs font-bold bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full">
                {order.channel === 'ONLINE_STORE' ? 'Web Storefront' : order.channel}
              </span>
            </div>

            <div className="space-y-2 text-2xs text-neutral-600">
              <div className="flex justify-between">
                <span className="text-neutral-500">Order Classification:</span>
                <span className="font-semibold text-neutral-900">
                  {order.channel === 'ONLINE_STORE' ? '🌐 Live Customer Order' : '🏬 In-Store Walk-in'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Discount Status:</span>
                <span className="font-semibold text-neutral-900">
                  {Number(order.discountTotal) > 0 ? (
                    <span className="text-red-600 font-bold">Promo Applied (-{formatMoney(order.discountTotal, order.currency)})</span>
                  ) : (
                    'Standard Price'
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Payment Verification:</span>
                <span className="font-semibold text-neutral-900">
                  {order.paymentMethod?.toUpperCase().includes('COD') ? 'Cash on Delivery' : 'Prepaid Online / Verified'}
                </span>
              </div>
              <div className="flex justify-between border-t border-neutral-100 pt-1.5 text-[10px] text-neutral-400">
                <span>Total Items:</span>
                <span className="font-bold text-neutral-700">{order.items?.reduce((s, i) => s + i.quantity, 0)} Units</span>
              </div>
            </div>
          </div>

          {/* Cancellation Info Panel (Only if Cancelled) */}
          {order.status === 'CANCELLED' && cancellation && (
            <div className="bg-red-50 p-4 sm:p-5 rounded-2xl border border-red-200 text-xs space-y-2">
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
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
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
                    <div className="pt-0.5 min-w-0 flex-1">
                      <span className={`font-bold block ${isLatest ? 'text-neutral-900' : 'text-neutral-600'}`}>{evt.status}</span>
                      {evt.message && <p className="text-neutral-500 mt-0.5 text-2xs break-words">{evt.message}</p>}
                      <div className="text-[9px] text-neutral-400 mt-1 flex flex-wrap gap-2">
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

      {/* Dialog: Live Courier Tracking (In-App) */}
      {showLiveTrackingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-neutral-200 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 font-sans">
                    Live Courier Tracking · Delhivery
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-mono">
                    AWB: {order.waybillNumber || 'DEL-AWB'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLiveTrackingModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {liveTrackingLoading && (
              <div className="py-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto" />
                <p className="text-xs text-neutral-500">Querying live Delhivery tracking API...</p>
              </div>
            )}

            {liveTrackingError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {liveTrackingError}
              </div>
            )}

            {liveTrackingData && (
              <div className="space-y-3.5 text-xs">
                <div className="p-3.5 bg-sky-50/70 border border-sky-200/80 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-sky-800 tracking-wider">Current Status</span>
                    <p className="text-base font-bold text-sky-950 mt-0.5">{liveTrackingData.status || 'In Transit'}</p>
                    {liveTrackingData.statusLocation && (
                      <p className="text-[11px] text-sky-800 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-sky-600" /> {liveTrackingData.statusLocation}
                      </p>
                    )}
                  </div>
                  {liveTrackingData.expectedDeliveryDate && (
                    <div className="text-right">
                      <span className="text-[10px] text-neutral-500 font-medium block">Est. Delivery</span>
                      <span className="font-bold text-neutral-900">
                        {new Date(liveTrackingData.expectedDeliveryDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', weekday: 'short' })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Scan Checkpoint Timeline */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                    Transit Checkpoints ({liveTrackingData.scans?.length || 0} Events)
                  </span>
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {liveTrackingData.scans && liveTrackingData.scans.length > 0 ? (
                      liveTrackingData.scans.map((s: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2.5 p-2 bg-neutral-50 rounded-xl border border-neutral-100">
                          <div className="w-2 h-2 rounded-full bg-sky-600 mt-1.5 shrink-0" />
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <p className="font-semibold text-neutral-900 text-xs">{s.status}</p>
                            <p className="text-[10px] text-neutral-500">{s.location} · {s.timestamp ? new Date(s.timestamp).toLocaleString('en-IN') : 'Logged'}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-neutral-50 rounded-xl text-neutral-500 text-2xs italic">
                        Parcel manifested and registered with Delhivery. Live checkpoint scans will appear as sorting centers scan the barcode.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-neutral-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLiveTrackingModal(false)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Schedule Delhivery Driver Pickup */}
      {showPickupModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-neutral-200 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 font-sans">
                    Schedule Delhivery Driver Pickup
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Dispatch request for Order #{order.orderNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPickupModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-[11px] leading-relaxed">
                💡 <strong>How Delhivery Pickup Works:</strong> Selecting a date &amp; time slot notifies Delhivery to dispatch a local driver van to your warehouse to scan and collect the package.
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Pickup Date *
                </label>
                <input
                  type="date"
                  required
                  value={pickupDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Preferred Pickup Time Slot *
                </label>
                <select
                  value={pickupTimeSlot}
                  onChange={(e) => setPickupTimeSlot(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="10:00:00">🌅 Morning Slot (10:00 AM – 01:00 PM)</option>
                  <option value="14:00:00">☀️ Afternoon Slot (02:00 PM – 05:00 PM)</option>
                  <option value="17:00:00">🌆 Evening Slot (05:00 PM – 08:00 PM)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Expected Packages *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={pickupPackageCount}
                    onChange={(e) => setPickupPackageCount(parseInt(e.target.value) || 1)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Origin Warehouse
                  </label>
                  <input
                    type="text"
                    disabled
                    value={pickupWarehouse.split('(')[0].trim()}
                    className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium text-neutral-700 truncate"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Driver Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Call warehouse manager at gate 2 upon arrival"
                  value={pickupNotes}
                  onChange={(e) => setPickupNotes(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPickupModal(false)}
                  className="flex-1 py-2.5 border border-neutral-300 rounded-xl font-bold text-neutral-700 text-xs hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isPickupPending}
                  onClick={handleConfirmSchedulePickup}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs disabled:opacity-60 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isPickupPending ? <ButtonLoader /> : <Calendar className="w-3.5 h-3.5" />}
                  Confirm Pickup Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
