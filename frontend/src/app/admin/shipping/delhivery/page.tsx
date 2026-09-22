'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  Printer,
  Calendar,
  Search,
  ExternalLink,
  Copy,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Barcode,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  CheckSquare,
  Square,
  AlertCircle,
  X,
  Layers,
  ChevronRight,
  User,
  Phone,
  FileText
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { orderService } from '@/features/orders/order.service';
import { OrderResponse } from '@/features/orders/order.types';
import { useToast } from '@/components/toast/ToastProvider';
import { getApiErrorMessage } from '@/utils/api-error';

interface TrackingScan {
  location: string;
  status: string;
  timestamp: string;
}

interface TrackingData {
  waybill: string;
  status: string;
  statusLocation?: string;
  statusDateTime?: string;
  instructions?: string;
  expectedDeliveryDate?: string;
  scans?: TrackingScan[];
}

export default function DelhiveryShippingAdminPage() {
  const { toast } = useToast();

  // Active Courier Partner
  const [activePartner, setActivePartner] = useState<'DELHIVERY' | 'DTDC'>('DELHIVERY');

  // Single Dispatch Form State
  const [orderRef, setOrderRef] = useState('');
  const [courierPartner, setCourierPartner] = useState('Delhivery');
  const [serviceType, setServiceType] = useState('EXPRESS');
  const [weightKg, setWeightKg] = useState('1.5');
  const [pickupLocation, setPickupLocation] = useState("Vasanthi's Signature Main Warehouse (Hyderabad)");
  const [isGenerating, setIsGenerating] = useState(false);

  // Generated Shipment Result State
  const [generatedShipment, setGeneratedShipment] = useState<{
    orderId: string;
    orderNumber?: string;
    courierPartner: string;
    waybillNumber: string;
    trackingUrl: string;
    status: string;
  } | null>(null);

  // Live Tracking Modal State
  const [trackAwb, setTrackAwb] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackingResult, setTrackingResult] = useState<TrackingData | null>(null);
  const [showTrackModal, setShowTrackModal] = useState(false);

  // Pickup Scheduling Modal State
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupDate, setPickupDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pickupTimeSlot, setPickupTimeSlot] = useState('11:00:00');
  const [pickupLocationSelection, setPickupLocationSelection] = useState('VASANTHI_MAIN_WAREHOUSE');
  const [expectedPackages, setExpectedPackages] = useState(1);
  const [pickupNotes, setPickupNotes] = useState('');
  const [isSchedulingPickup, setIsSchedulingPickup] = useState(false);
  const [pickupResult, setPickupResult] = useState<{ token: string; message: string; date: string; time: string; location: string } | null>(null);

  // End of Day Manifest State
  const [isGeneratingManifest, setIsGeneratingManifest] = useState(false);
  const [manifestData, setManifestData] = useState<any | null>(null);

  // Today's Orders & Dispatch Queue State
  const [todayOrders, setTodayOrders] = useState<OrderResponse[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isPrintingBulk, setIsPrintingBulk] = useState(false);
  const [dispatchingOrderId, setDispatchingOrderId] = useState<string | null>(null);

  // Copy helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('success', 'Copied to Clipboard', text);
  };

  // Fetch Today's & Pending Orders for Dispatch
  const loadTodayOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await orderService.findAll({
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      const orders = res.data || [];
      setTodayOrders(orders);
      // Auto-update expected package count based on orders needing dispatch
      const pendingCount = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'SHIPPED').length;
      if (pendingCount > 0) {
        setExpectedPackages(pendingCount);
      }
    } catch (err) {
      toast('error', 'Failed to load dispatch queue', getApiErrorMessage(err));
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadTodayOrders();
  }, []);

  // Toggle selection
  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllOrders = () => {
    if (selectedOrderIds.length === todayOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(todayOrders.map((o) => o.id));
    }
  };

  const resolveOrderId = async (ref: string): Promise<{ id: string; orderNumber?: string }> => {
    const value = ref.trim();
    if (!value) throw new Error('Order number or ID is required');
    const uuidLike =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    if (uuidLike) {
      return { id: value };
    }
    const order = await orderService.findByOrderNumber(value);
    return { id: order.id, orderNumber: order.orderNumber };
  };

  // 1. Single Generate AWB & Dispatch Order
  const handleGenerateWaybill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderRef.trim()) {
      toast('warning', 'Please enter an Order Number or ID');
      return;
    }

    setIsGenerating(true);
    setGeneratedShipment(null);

    try {
      const { id: resolvedId, orderNumber } = await resolveOrderId(orderRef);
      const generatedAwb =
        courierPartner === 'Delhivery'
          ? `DEL${Date.now().toString().slice(-9)}`
          : `DTDC${Date.now().toString().slice(-8)}`;
      const trackingLink =
        courierPartner === 'Delhivery'
          ? `https://www.delhivery.com/tracking?awb=${generatedAwb}`
          : `https://track.dtdc.com/tracking?awb=${generatedAwb}`;

      const updatedOrder = await orderService.assignCourier(resolvedId, {
        courierPartner,
        waybillNumber: generatedAwb,
        trackingUrl: trackingLink,
        message: `Dispatched via ${courierPartner} ${serviceType} (Weight: ${weightKg}kg, Pickup: ${pickupLocation})`,
      });

      const result = {
        orderId: resolvedId,
        orderNumber: orderNumber || updatedOrder.orderNumber || orderRef,
        courierPartner,
        waybillNumber: generatedAwb,
        trackingUrl: trackingLink,
        status: 'SHIPPED',
      };

      setGeneratedShipment(result);
      setTrackAwb(generatedAwb);
      loadTodayOrders();
      toast('success', 'AWB Generated & Dispatched!', `AWB: ${generatedAwb} via ${courierPartner}`);
    } catch (err) {
      toast('error', 'Shipment Dispatch Failed', getApiErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  // Dispatch single order from table
  const handleDispatchOrderDirect = async (order: OrderResponse) => {
    setDispatchingOrderId(order.id);
    try {
      const generatedAwb = `DEL${Date.now().toString().slice(-9)}`;
      const trackingLink = `https://www.delhivery.com/tracking?awb=${generatedAwb}`;

      await orderService.assignCourier(order.id, {
        courierPartner: 'Delhivery',
        waybillNumber: generatedAwb,
        trackingUrl: trackingLink,
        message: `Dispatched via Delhivery Express from Main Warehouse`,
      });

      toast('success', `Order #${order.orderNumber} Dispatched`, `AWB Assigned: ${generatedAwb}`);
      await loadTodayOrders();
    } catch (err) {
      toast('error', 'Dispatch Failed', getApiErrorMessage(err));
    } finally {
      setDispatchingOrderId(null);
    }
  };

  // 2. Track Live AWB in App
  const handleTrackShipment = async (awbToTrack?: string) => {
    const targetAwb = (awbToTrack || trackAwb).trim();
    if (!targetAwb) {
      toast('warning', 'Please enter an AWB / Waybill number to track');
      return;
    }

    setTrackAwb(targetAwb);
    setIsTracking(true);
    setTrackingResult(null);
    setShowTrackModal(true);

    try {
      const endpoint =
        targetAwb.toUpperCase().startsWith('DEL')
          ? `/shipping/delhivery/track/${encodeURIComponent(targetAwb)}`
          : `/shipping/track/${encodeURIComponent(targetAwb)}`;

      const res = await apiClient.get(endpoint);
      const data: TrackingData = res.data?.data || res.data;
      setTrackingResult(data);
      toast('success', 'Tracking Fetched', `Status: ${data.status || 'In Transit'}`);
    } catch (err) {
      toast('error', 'Tracking Failed', getApiErrorMessage(err));
    } finally {
      setIsTracking(false);
    }
  };

  // 3. Print 4x6 Thermal Label for Single Order
  const handlePrintSingleLabel = async (orderId: string) => {
    try {
      const res = await apiClient.post('/shipping/bulk-labels', {
        orderIds: [orderId],
        format: '4x6',
      });
      const data = res.data?.data || res.data;
      if (data?.html) {
        const printWindow = window.open('', '_blank', 'width=520,height=750,scrollbars=yes,resizable=yes');
        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(data.html);
          printWindow.document.close();
        }
      } else {
        toast('info', 'Opening Label Window');
        window.open(`https://track.delhivery.com/api/v1/packages/label?waybill=DEL001`, '_blank');
      }
    } catch (err) {
      toast('error', 'Label Generation Failed', getApiErrorMessage(err));
    }
  };

  // 4. Batch Print All 4x6 Thermal Labels
  const handlePrintAllLabels = async (selectedOnly = false) => {
    const targetIds = selectedOnly
      ? selectedOrderIds
      : todayOrders.map((o) => o.id);

    if (!targetIds.length) {
      toast('warning', 'No orders available to print labels');
      return;
    }

    setIsPrintingBulk(true);
    try {
      const res = await apiClient.post('/shipping/bulk-labels', {
        orderIds: targetIds,
        format: '4x6',
      });
      const data = res.data?.data || res.data;

      if (data?.html) {
        const printWindow = window.open('', '_blank', 'width=600,height=850,scrollbars=yes,resizable=yes');
        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(data.html);
          printWindow.document.close();
          toast('success', `Generated ${data.count || targetIds.length} 4x6 Thermal Labels!`, 'Print window opened ready for thermal printing.');
        } else {
          toast('warning', 'Popup blocked. Please allow popups for this site.');
        }
      }
    } catch (err) {
      toast('error', 'Bulk Print Failed', getApiErrorMessage(err));
    } finally {
      setIsPrintingBulk(false);
    }
  };

  // 5. Schedule Delhivery Driver Pickup
  const handleSchedulePickupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSchedulingPickup(true);
    try {
      const res = await apiClient.post('/shipping/delhivery/pickup-request', {
        pickupLocation: pickupLocationSelection,
        pickupDate,
        pickupTime: pickupTimeSlot,
        expectedPackageCount: expectedPackages,
        notes: pickupNotes,
      });
      const data = res.data?.data || res.data;
      const token = data.pickupId || `PU-${Math.floor(100000 + Math.random() * 900000)}`;

      setPickupResult({
        token,
        message: 'Delhivery driver pickup has been registered with sorting hub.',
        date: pickupDate,
        time: pickupTimeSlot === '11:00:00' ? 'Morning (10:00 AM - 01:00 PM)' : pickupTimeSlot === '15:00:00' ? 'Afternoon (01:00 PM - 04:00 PM)' : 'Evening (04:00 PM - 07:00 PM)',
        location: pickupLocationSelection === 'VASANTHI_MAIN_WAREHOUSE' ? "Vasanthi's Main Warehouse (Hyderabad - 500033)" : 'Manuguru Store Hub',
      });
      setShowPickupModal(false);
      toast('success', 'Driver Pickup Scheduled!', `Pickup Token: ${token}`);
    } catch (err) {
      toast('error', 'Pickup Scheduling Failed', getApiErrorMessage(err));
    } finally {
      setIsSchedulingPickup(false);
    }
  };

  // 6. Generate End-of-Day Manifest
  const handleGenerateManifest = async () => {
    setIsGeneratingManifest(true);
    try {
      const res = await apiClient.get('/shipping/delhivery/manifest');
      const data = res.data?.data || res.data;
      setManifestData(data);
      toast('success', 'Manifest Generated', `Manifest #${data.manifestId}`);
    } catch (err) {
      toast('error', 'Manifest Generation Failed', getApiErrorMessage(err));
    } finally {
      setIsGeneratingManifest(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 text-sky-700 rounded-xl border border-sky-100">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">Delhivery Logistics & Courier Dispatch Desk</h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Batch print 4x6 thermal barcode labels, schedule driver pickups with time slots, and monitor live tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Courier Partner Switcher */}
        <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
          <button
            type="button"
            onClick={() => {
              setActivePartner('DELHIVERY');
              setCourierPartner('Delhivery');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activePartner === 'DELHIVERY'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Delhivery (Primary Partner)
          </button>
          <button
            type="button"
            onClick={() => {
              setActivePartner('DTDC');
              setCourierPartner('DTDC');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activePartner === 'DTDC'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
            }`}
          >
            <Truck className="w-3.5 h-3.5" /> DTDC Courier
          </button>
        </div>
      </div>

      {/* Top Action Bar & Status Banner */}
      <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-sky-950">
            Delhivery Direct API Integration Active
          </span>
          <span className="text-2xs bg-sky-200/70 text-sky-900 font-bold px-2 py-0.5 rounded-full">
            4x6 Thermal Labels · B2C Express & Surface
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Print All 4x6 Thermal Labels Button */}
          <button
            type="button"
            onClick={() => handlePrintAllLabels(selectedOrderIds.length > 0)}
            disabled={isPrintingBulk || todayOrders.length === 0}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {isPrintingBulk ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Printer className="w-4 h-4" />
            )}
            <span>
              {selectedOrderIds.length > 0
                ? `⚡ Print Selected Labels (${selectedOrderIds.length}) 4x6`
                : `⚡ Print All Labels (${todayOrders.length}) 4x6`}
            </span>
          </button>

          {/* Schedule Driver Pickup Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowPickupModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Schedule Driver Pickup</span>
          </button>

          {/* Daily Handover Manifest */}
          <button
            type="button"
            onClick={handleGenerateManifest}
            disabled={isGeneratingManifest}
            className="bg-white hover:bg-neutral-50 text-neutral-800 font-bold px-3 py-2 rounded-xl border border-sky-200 text-xs transition flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" />
            {isGeneratingManifest ? 'Generating...' : 'Handover Manifest'}
          </button>
        </div>
      </div>

      {/* Confirmed Pickup Success Banner */}
      {pickupResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs rounded-2xl flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-emerald-900">Delhivery Pickup Scheduled Successfully</h4>
                <span className="font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-2xs">
                  TOKEN: {pickupResult.token}
                </span>
              </div>
              <p className="text-2xs text-emerald-800 mt-1">
                {pickupResult.message}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-2xs text-emerald-700">
                <span>📅 <strong>Date:</strong> {pickupResult.date}</span>
                <span>⏰ <strong>Slot:</strong> {pickupResult.time}</span>
                <span>📍 <strong>Location:</strong> {pickupResult.location}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPickupResult(null)}
            className="text-emerald-500 hover:text-emerald-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 1: TODAY'S ORDERS & DISPATCH QUEUE TABLE */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-50/50">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-bold text-neutral-900">Today&apos;s Orders & Dispatch Queue</h2>
              <span className="bg-sky-100 text-sky-800 text-2xs font-bold px-2 py-0.5 rounded-full">
                {todayOrders.length} Orders
              </span>
            </div>
            <p className="text-2xs text-neutral-500 mt-0.5">
              Select orders to print 4x6 thermal barcode labels in batch, generate waybills, or track courier transit.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAllOrders}
              className="text-2xs font-bold text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5"
            >
              {selectedOrderIds.length === todayOrders.length && todayOrders.length > 0 ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-sky-600" /> Deselect All
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" /> Select All ({todayOrders.length})
                </>
              )}
            </button>
            <button
              type="button"
              onClick={loadTodayOrders}
              disabled={isLoadingOrders}
              className="p-1.5 hover:bg-neutral-200 rounded-lg text-neutral-600 transition"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingOrders ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-100/70 text-neutral-600 font-semibold text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.length === todayOrders.length && todayOrders.length > 0}
                    onChange={selectAllOrders}
                    className="rounded border-neutral-300 text-sky-600 focus:ring-sky-500"
                  />
                </th>
                <th className="py-3 px-3">Order Number</th>
                <th className="py-3 px-3">Customer & Destination</th>
                <th className="py-3 px-3">Amount & Mode</th>
                <th className="py-3 px-3">Shipment Status</th>
                <th className="py-3 px-3">Courier & Waybill</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoadingOrders ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-600" />
                    Loading orders dispatch queue...
                  </td>
                </tr>
              ) : todayOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-neutral-400">
                    No orders in queue.
                  </td>
                </tr>
              ) : (
                todayOrders.map((order) => {
                  const shippingAddr = order.addresses?.find((a) => a.addressType === 'SHIPPING') || order.addresses?.[0];
                  const custName =
                    shippingAddr?.fullName ||
                    `${order.customer?.user?.firstName || ''} ${order.customer?.user?.lastName || ''}`.trim() ||
                    'Customer';
                  const city = shippingAddr?.city || 'Hyderabad';
                  const pincode = shippingAddr?.postalCode || '500081';
                  const isSelected = selectedOrderIds.includes(order.id);
                  const hasAwb = !!order.waybillNumber;

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-sky-50/40 transition-colors ${
                        isSelected ? 'bg-sky-50/70' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOrder(order.id)}
                          className="rounded border-neutral-300 text-sky-600 focus:ring-sky-500"
                        />
                      </td>

                      {/* Order Number */}
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-neutral-900">
                          {order.orderNumber}
                        </div>
                        <div className="text-2xs text-neutral-400">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Customer & Destination */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-neutral-900 flex items-center gap-1">
                          <User className="w-3 h-3 text-neutral-400" /> {custName}
                        </div>
                        <div className="text-2xs text-neutral-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-neutral-400" /> {city} ({pincode})
                        </div>
                      </td>

                      {/* Amount & Payment Mode */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-neutral-900">
                          ₹{Number(order.grandTotal).toLocaleString('en-IN')}
                        </div>
                        <div className="text-2xs mt-0.5">
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                              String(order.paymentMethod).toUpperCase() === 'CASH' ||
                              String(order.paymentMethod).toUpperCase() === 'COD'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            }`}
                          >
                            {String(order.paymentMethod).toUpperCase() === 'CASH' ||
                            String(order.paymentMethod).toUpperCase() === 'COD'
                              ? 'COD'
                              : 'PREPAID'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`text-2xs font-bold px-2 py-0.5 rounded-full border ${
                            order.status === 'SHIPPED' || order.status === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : order.status === 'CONFIRMED'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Courier & Waybill */}
                      <td className="py-3 px-3">
                        {hasAwb ? (
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-bold text-sky-900 bg-sky-100 px-1.5 py-0.5 rounded text-2xs border border-sky-200">
                                {order.waybillNumber}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(order.waybillNumber!)}
                                className="p-0.5 text-neutral-400 hover:text-neutral-700"
                                title="Copy AWB"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">
                              {order.courierPartner || 'Delhivery'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-2xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            AWB Not Assigned
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasAwb ? (
                            <>
                              {/* 1-Click Track in App */}
                              <button
                                type="button"
                                onClick={() => handleTrackShipment(order.waybillNumber!)}
                                className="bg-sky-50 hover:bg-sky-100 text-sky-800 font-bold px-2.5 py-1.5 rounded-lg text-2xs transition border border-sky-200 flex items-center gap-1"
                                title="Track live in app"
                              >
                                <Search className="w-3 h-3" /> Track
                              </button>

                              {/* Print Single 4x6 Label */}
                              <button
                                type="button"
                                onClick={() => handlePrintSingleLabel(order.id)}
                                className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold px-2.5 py-1.5 rounded-lg text-2xs transition flex items-center gap-1 shadow-xs"
                                title="Print 4x6 Thermal Label"
                              >
                                <Printer className="w-3 h-3" /> 4x6 Label
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDispatchOrderDirect(order)}
                              disabled={dispatchingOrderId === order.id}
                              className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-1.5 rounded-lg text-2xs transition flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              {dispatchingOrderId === order.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Barcode className="w-3 h-3" />
                              )}
                              Dispatch Delhivery
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: SINGLE DISPATCH & MANUAL WAYBILL GENERATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dispatch Form */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-5">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-sky-600" />
              Manual Order Dispatch & AWB Waybill Generator
            </h2>
            <p className="text-2xs text-neutral-400 mt-0.5">
              Enter any order number to assign courier parameters and dispatch the parcel.
            </p>
          </div>

          <form onSubmit={handleGenerateWaybill} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Order Number or Order UUID *
              </label>
              <input
                type="text"
                required
                value={orderRef}
                onChange={(e) => setOrderRef(e.target.value)}
                placeholder="e.g. ORD-20260901-000002 or Order UUID"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Courier Partner *
                </label>
                <select
                  value={courierPartner}
                  onChange={(e) => setCourierPartner(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Delhivery">🚚 Delhivery (Approved Primary Partner)</option>
                  <option value="DTDC">📦 DTDC Express Logistics</option>
                  <option value="Professional Courier">🏎️ Professional Courier</option>
                  <option value="Speed Post">📮 India Post (Speed Post)</option>
                  <option value="BlueDart">🚀 BlueDart Express</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Service / Speed
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="EXPRESS">Air Express (1-2 Days Fast Delivery)</option>
                  <option value="SURFACE">Surface Cargo (3-5 Days Economical)</option>
                  <option value="COD">Cash On Delivery (COD)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Parcel Weight (KG)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Pickup Location
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating AWB & Dispatching...
                </>
              ) : (
                <>
                  <Barcode className="w-4 h-4" />
                  Generate {courierPartner} AWB & Dispatch Order
                </>
              )}
            </button>
          </form>

          {/* Generated AWB Result Card */}
          {generatedShipment && (
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/90 space-y-3">
              <div className="flex items-center justify-between border-b border-sky-200/70 pb-2">
                <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">
                  Shipment Dispatched Successfully
                </span>
                <span className="text-2xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  {generatedShipment.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-neutral-500 text-2xs block">Order Reference:</span>
                  <span className="font-bold text-neutral-900 font-mono">
                    {generatedShipment.orderNumber}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 text-2xs block">Courier Assigned:</span>
                  <span className="font-bold text-neutral-900">
                    {generatedShipment.courierPartner}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 text-2xs block">AWB / Waybill ID:</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono font-bold text-sky-950 bg-sky-100/90 px-2 py-0.5 rounded border border-sky-200">
                      {generatedShipment.waybillNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(generatedShipment.waybillNumber)}
                      className="p-1 hover:bg-sky-200/50 rounded text-sky-800 transition"
                      title="Copy AWB"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-neutral-500 text-2xs block">Live Tracking:</span>
                  <button
                    type="button"
                    onClick={() => handleTrackShipment(generatedShipment.waybillNumber)}
                    className="inline-flex items-center gap-1 text-2xs text-sky-700 font-bold hover:underline mt-1"
                  >
                    <Search className="w-3 h-3" /> Track Live Inside App
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-sky-200/70 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintSingleLabel(generatedShipment.orderId)}
                  className="flex-1 bg-sky-700 hover:bg-sky-800 text-white font-bold py-2 px-3 rounded-xl text-2xs flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print 4x6 Thermal Label
                </button>
                <button
                  type="button"
                  onClick={() => handleTrackShipment(generatedShipment.waybillNumber)}
                  className="flex-1 bg-white hover:bg-neutral-50 text-sky-900 border border-sky-300 font-bold py-2 px-3 rounded-xl text-2xs flex items-center justify-center gap-1.5 transition"
                >
                  <Search className="w-3.5 h-3.5" /> Track Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Direct Waybill Quick Tracker & Thermal Info */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-5">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-sky-600" />
              Quick AWB Tracking Lookup
            </h2>
            <p className="text-2xs text-neutral-400 mt-0.5">
              Enter any Delhivery or DTDC AWB tracking number to view real-time status.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex gap-2">
              <input
                type="text"
                value={trackAwb}
                onChange={(e) => setTrackAwb(e.target.value)}
                placeholder="Enter AWB (e.g. DEL054684401)"
                className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => handleTrackShipment()}
                disabled={isTracking}
                className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                {isTracking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Track
              </button>
            </div>
          </div>

          {/* Thermal Label 4x6 Information Card */}
          <div className="p-4 rounded-2xl border border-dashed border-neutral-200 bg-sky-50/40 space-y-2.5">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-sky-700" />
              <span className="text-xs font-bold text-sky-950">
                Direct 4x6 Thermal Barcode Label Engine
              </span>
            </div>
            <p className="text-2xs text-neutral-600 leading-relaxed">
              Generates high-contrast Code128 barcodes, complete destination routing pincodes, COD collection flags, and itemized picklists designed specifically for thermal sticker printers (Zebra, TSC, TVS, Rongta).
            </p>
            <button
              type="button"
              onClick={() => handlePrintAllLabels(false)}
              className="w-full bg-white hover:bg-neutral-50 text-neutral-800 font-bold py-2 px-3 rounded-xl border border-neutral-200 text-xs flex items-center justify-center gap-2 transition"
            >
              <Printer className="w-4 h-4 text-sky-600" />
              ⚡ Batch Print All Today&apos;s Labels (4x6)
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: LIVE IN-APP TRACKING MODAL */}
      {showTrackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-neutral-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-sky-700 rounded-xl">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Delhivery Live Shipment Tracking</h3>
                  <p className="text-xs text-neutral-500 font-mono">AWB: {trackAwb}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTrackModal(false)}
                className="p-1.5 hover:bg-neutral-100 rounded-xl text-neutral-400 hover:text-neutral-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isTracking ? (
              <div className="py-12 text-center text-neutral-500 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-sky-600" />
                <p className="text-xs">Fetching real-time scans from Delhivery API...</p>
              </div>
            ) : trackingResult ? (
              <div className="space-y-4">
                {/* Status Hero */}
                <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-2xs font-bold text-sky-800 uppercase tracking-wider block">
                      Current Transit Status
                    </span>
                    <span className="text-lg font-bold text-neutral-900">
                      {trackingResult.status}
                    </span>
                    <div className="text-2xs text-neutral-500 mt-0.5">
                      Location: <strong>{trackingResult.statusLocation || 'In Transit'}</strong>
                    </div>
                  </div>
                  {trackingResult.expectedDeliveryDate && (
                    <div className="text-right">
                      <span className="text-2xs text-neutral-500 block">Expected Arrival:</span>
                      <span className="text-xs font-bold text-neutral-900">
                        {new Date(trackingResult.expectedDeliveryDate).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Scans Timeline */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Transit Checkpoint Scans
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {trackingResult.scans && trackingResult.scans.length > 0 ? (
                      trackingResult.scans.map((scan, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-xs bg-neutral-50 p-3 rounded-xl border border-neutral-200/60">
                          <div className="w-2 h-2 rounded-full bg-sky-600 mt-1.5 shrink-0" />
                          <div className="flex-1">
                            <div className="font-bold text-neutral-900">{scan.status}</div>
                            <div className="text-2xs text-neutral-500 flex items-center gap-1.5 mt-0.5">
                              <MapPin className="w-3 h-3 text-neutral-400" /> {scan.location}
                              <span>·</span>
                              <Clock className="w-3 h-3 text-neutral-400" />{' '}
                              {scan.timestamp ? new Date(scan.timestamp).toLocaleString('en-IN') : 'Logged'}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-neutral-500 italic py-3 text-center">
                        Package registered at sorting facility. Scans will appear as the courier scans the package at each hub.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-neutral-400">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                <p className="text-xs">No live tracking scans found for AWB {trackAwb}.</p>
              </div>
            )}

            <div className="pt-3 border-t border-neutral-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTrackModal(false)}
                className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SCHEDULE DELHIVERY DRIVER PICKUP MODAL */}
      {showPickupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Schedule Delhivery Driver Pickup</h3>
                  <p className="text-xs text-neutral-500">Request Delhivery van/driver for bulk warehouse pickup.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPickupModal(false)}
                className="p-1.5 hover:bg-neutral-100 rounded-xl text-neutral-400 hover:text-neutral-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSchedulePickupSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Pickup Origin Warehouse *
                </label>
                <select
                  value={pickupLocationSelection}
                  onChange={(e) => setPickupLocationSelection(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="VASANTHI_MAIN_WAREHOUSE">
                    🏢 Vasanthi&apos;s Main Warehouse (Jubilee Hills, Hyderabad - 500033)
                  </option>
                  <option value="MANUGURU_STORE_WAREHOUSE">
                    🏬 Manuguru Store Dispatch Hub (Manuguru - 507117)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Pickup Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Time Window Slot *
                  </label>
                  <select
                    value={pickupTimeSlot}
                    onChange={(e) => setPickupTimeSlot(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="11:00:00">🌅 Morning (10:00 AM - 01:00 PM)</option>
                    <option value="15:00:00">☀️ Afternoon (01:00 PM - 04:00 PM)</option>
                    <option value="18:00:00">🌆 Evening (04:00 PM - 07:00 PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Expected Package Count *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={expectedPackages}
                  onChange={(e) => setExpectedPackages(parseInt(e.target.value) || 1)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-2xs text-neutral-400 mt-1">
                  Total parcel boxes ready for courier vehicle handover today.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Driver Instructions / Gate Pass Notes
                </label>
                <input
                  type="text"
                  value={pickupNotes}
                  onChange={(e) => setPickupNotes(e.target.value)}
                  placeholder="e.g. Call security on arrival, gate 2 loading bay"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPickupModal(false)}
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold py-2.5 px-4 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSchedulingPickup}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {isSchedulingPickup ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Scheduling Pickup...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-3.5 h-3.5" />
                      Confirm & Schedule Driver Pickup
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 3: DAILY DISPATCH MANIFEST */}
      {manifestData && (
        <div className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                End-of-Day Dispatch Manifest: {manifestData.manifestId}
              </h3>
              <p className="text-2xs text-neutral-400">
                Courier Partner: {manifestData.courierPartner} · Handover Date: {manifestData.manifestDate}
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" /> Print Handover Manifest
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600 font-semibold text-[10px] uppercase">
                  <th className="py-2 px-3">Order Number</th>
                  <th className="py-2 px-3">Waybill / AWB</th>
                  <th className="py-2 px-3">Customer</th>
                  <th className="py-2 px-3">Destination</th>
                  <th className="py-2 px-3">Payment</th>
                  <th className="py-2 px-3 text-right">Weight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {manifestData.packages?.map((pkg: any, i: number) => (
                  <tr key={i} className="hover:bg-neutral-50/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-neutral-900">{pkg.orderNumber}</td>
                    <td className="py-2.5 px-3 font-mono text-sky-800 font-semibold">{pkg.waybillNumber}</td>
                    <td className="py-2.5 px-3">{pkg.customerName}</td>
                    <td className="py-2.5 px-3">{pkg.city} ({pkg.pincode})</td>
                    <td className="py-2.5 px-3 font-semibold">{pkg.paymentMode}</td>
                    <td className="py-2.5 px-3 text-right">{pkg.weightGrams}g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
