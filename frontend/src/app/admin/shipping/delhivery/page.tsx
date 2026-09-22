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
  FileText,
  PhoneCall,
  Navigation,
  Radio,
  Trash2,
  Box,
  Link as LinkIcon
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { orderService } from '@/features/orders/order.service';
import { OrderResponse } from '@/features/orders/order.types';
import { useWarehouseList } from '@/features/warehouse/warehouse.hooks';
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

interface ScheduledPickupItem {
  pickupId: string;
  pickupLocation: string;
  pickupDate: string;
  pickupTime: string;
  timeSlot: string;
  expectedPackageCount: number;
  orderNumbers?: string[];
  orderIds?: string[];
  status: 'SCHEDULED' | 'DRIVER_ASSIGNED' | 'OUT_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED';
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  notes?: string;
  createdAt: string;
}

export default function DelhiveryShippingAdminPage() {
  const { toast } = useToast();

  // Active Warehouses from DB
  const { data: warehouseListData } = useWarehouseList({ status: 'ACTIVE' });
  const warehouses = warehouseListData?.data || [];

  // Active Courier Partner
  const [activePartner, setActivePartner] = useState<'DELHIVERY' | 'DTDC'>('DELHIVERY');

  // Single Dispatch Form State
  const [orderRef, setOrderRef] = useState('');
  const [courierPartner, setCourierPartner] = useState('Delhivery');
  const [serviceType, setServiceType] = useState('EXPRESS');
  const [weightKg, setWeightKg] = useState('1.5');
  const [pickupLocation, setPickupLocation] = useState('Manuguru Main Warehouse (Manuguru - 507117)');
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

  // Scheduled Driver Pickups Roster
  const [scheduledPickups, setScheduledPickups] = useState<ScheduledPickupItem[]>([]);
  const [isLoadingPickups, setIsLoadingPickups] = useState(false);

  // Pickup Scheduling Modal State
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupDate, setPickupDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pickupTimeSlot, setPickupTimeSlot] = useState('11:00:00');
  const [pickupLocationSelection, setPickupLocationSelection] = useState('MNG-01');
  const [expectedPackages, setExpectedPackages] = useState(1);
  const [pickupTargetOrderNumbers, setPickupTargetOrderNumbers] = useState<string[]>([]);
  const [pickupNotes, setPickupNotes] = useState('');
  const [isSchedulingPickup, setIsSchedulingPickup] = useState(false);
  const [pickupResult, setPickupResult] = useState<{ token: string; message: string; date: string; time: string; location: string } | null>(null);

  // Auto-sync default warehouse
  useEffect(() => {
    if (warehouses.length > 0) {
      const def = warehouses.find((w: any) => w.isDefault) || warehouses[0];
      const codeOrId = def.code || def.id;
      if (!warehouses.some((w: any) => w.code === pickupLocationSelection || w.id === pickupLocationSelection)) {
        setPickupLocationSelection(codeOrId);
      }
      setPickupLocation(`${def.name} (${def.city || 'Manuguru'} - ${def.postalCode || '507117'})`);
    }
  }, [warehouses]);

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

  // 1. Fetch Scheduled Pickups from API + Persistent Storage
  const loadPickupRequests = async () => {
    setIsLoadingPickups(true);
    try {
      const res = await apiClient.get('/shipping/delhivery/pickup-requests');
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) {
        setScheduledPickups(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('vs_scheduled_pickups', JSON.stringify(data));
        }
      } else if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('vs_scheduled_pickups');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setScheduledPickups(parsed);
            }
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Failed to load scheduled pickups', err);
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('vs_scheduled_pickups');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) setScheduledPickups(parsed);
          } catch {}
        }
      }
    } finally {
      setIsLoadingPickups(false);
    }
  };

  // 2. Fetch Today's Orders for Dispatch
  const loadTodayOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await orderService.findAll({
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      const orders = res.data || [];
      setTodayOrders(orders);
      
      const targetOrders = orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'SHIPPED');
      setExpectedPackages(Math.max(1, targetOrders.length || 1));
      setPickupTargetOrderNumbers(targetOrders.map((o) => o.orderNumber));
    } catch (err) {
      toast('error', 'Failed to load dispatch queue', getApiErrorMessage(err));
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadTodayOrders();
    loadPickupRequests();
  }, []);

  // Find if an order has a linked scheduled pickup
  const getOrderPickup = (order: OrderResponse): ScheduledPickupItem | undefined => {
    return scheduledPickups.find(
      (p) =>
        p.status !== 'CANCELLED' &&
        (p.orderNumbers?.includes(order.orderNumber) ||
          p.orderIds?.includes(order.id) ||
          (scheduledPickups.length === 1 && todayOrders.length === 1))
    );
  };

  // Helper: Get available Delhivery time slots with same-day cutoff validation
  const getTimeSlotsForDate = (dateStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

    const slots = [
      {
        value: '11:00:00',
        label: '🌅 Morning (10:00 AM - 01:00 PM)',
        cutoffMinutes: 10 * 60 + 30, // 10:30 AM cutoff for same-day morning driver dispatch
        shortName: 'Morning (10:00 AM - 01:00 PM)',
      },
      {
        value: '15:00:00',
        label: '☀️ Afternoon (01:00 PM - 04:00 PM)',
        cutoffMinutes: 13 * 60 + 30, // 1:30 PM cutoff for same-day afternoon driver dispatch
        shortName: 'Afternoon (01:00 PM - 04:00 PM)',
      },
      {
        value: '18:00:00',
        label: '🌆 Evening (04:00 PM - 07:00 PM)',
        cutoffMinutes: 16 * 60 + 30, // 4:30 PM cutoff for same-day evening driver dispatch
        shortName: 'Evening (04:00 PM - 07:00 PM)',
      },
    ];

    if (dateStr === todayStr) {
      return slots.map((s) => {
        const isPast = currentTotalMinutes >= s.cutoffMinutes;
        return {
          ...s,
          disabled: isPast,
          statusLabel: isPast ? '— ❌ Cutoff Passed' : '— ✅ Available Today',
        };
      });
    }

    return slots.map((s) => ({
      ...s,
      disabled: false,
      statusLabel: '',
    }));
  };

  // Open pickup modal pre-populated for specific orders
  const openPickupModalForOrders = (orders?: OrderResponse[]) => {
    const list =
      orders && orders.length > 0
        ? orders
        : selectedOrderIds.length > 0
        ? todayOrders.filter((o) => selectedOrderIds.includes(o.id))
        : todayOrders;

    const targetOrderNumbers = list.map((o) => o.orderNumber);

    // Calculate total package count from item quantities (1 box per item/parcel)
    let totalBoxes = 0;
    list.forEach((o) => {
      if (o.items && o.items.length > 0) {
        totalBoxes += o.items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
      } else {
        totalBoxes += 1;
      }
    });

    setPickupTargetOrderNumbers(targetOrderNumbers);
    setExpectedPackages(Math.max(1, totalBoxes));

    // Choose default valid time slot for today
    const todayStr = new Date().toISOString().split('T')[0];
    const slots = getTimeSlotsForDate(todayStr);
    const firstAvailable = slots.find((s) => !s.disabled) || slots[0];
    setPickupDate(todayStr);
    setPickupTimeSlot(firstAvailable.value);

    setShowPickupModal(true);
  };

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

  // 5. Schedule Delhivery Driver Pickup Submit
  const handleSchedulePickupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSchedulingPickup(true);
    try {
      const selectedWh = warehouses.find((w: any) => w.code === pickupLocationSelection || w.id === pickupLocationSelection) || warehouses[0];
      const locDisplayName = selectedWh ? `${selectedWh.name} (${selectedWh.city || 'Manuguru'} - ${selectedWh.postalCode || '507117'})` : 'Manuguru Main Warehouse (Manuguru - 507117)';

      const res = await apiClient.post('/shipping/delhivery/pickup-request', {
        pickupLocation: pickupLocationSelection,
        pickupDate,
        pickupTime: pickupTimeSlot,
        expectedPackageCount: expectedPackages,
        orderNumbers: pickupTargetOrderNumbers,
        notes: pickupNotes,
      });
      const data = res.data?.data || res.data;
      const token = data.pickupId || `PU-${Math.floor(100000 + Math.random() * 900000)}`;

      setPickupResult({
        token,
        message: 'Delhivery driver pickup has been registered with sorting hub.',
        date: pickupDate,
        time: pickupTimeSlot === '11:00:00' ? 'Morning (10:00 AM - 01:00 PM)' : pickupTimeSlot === '15:00:00' ? 'Afternoon (01:00 PM - 04:00 PM)' : 'Evening (04:00 PM - 07:00 PM)',
        location: locDisplayName,
      });
      const newPickupItem: ScheduledPickupItem = {
        pickupId: token,
        pickupLocation: locDisplayName,
        pickupDate,
        pickupTime: pickupTimeSlot,
        timeSlot: pickupTimeSlot === '11:00:00' ? 'Morning (10:00 AM - 01:00 PM)' : pickupTimeSlot === '15:00:00' ? 'Afternoon (01:00 PM - 04:00 PM)' : 'Evening (04:00 PM - 07:00 PM)',
        expectedPackageCount: expectedPackages,
        orderNumbers: pickupTargetOrderNumbers,
        status: 'SCHEDULED',
        driverName: 'Delhivery Hub Assigned Driver',
        driverPhone: '+91 1800 103 6354',
        vehicleNumber: 'Delhivery Logistics Van',
        notes: pickupNotes,
        createdAt: new Date().toISOString(),
      };

      const updatedList = [newPickupItem, ...scheduledPickups.filter((p) => p.pickupId !== token)];
      setScheduledPickups(updatedList);
      if (typeof window !== 'undefined') {
        localStorage.setItem('vs_scheduled_pickups', JSON.stringify(updatedList));
      }

      setShowPickupModal(false);
      await loadPickupRequests();
      toast('success', 'Driver Pickup Scheduled!', `Pickup Token: ${token} for ${pickupTargetOrderNumbers.length} orders`);
    } catch (err) {
      toast('error', 'Pickup Scheduling Failed', getApiErrorMessage(err));
    } finally {
      setIsSchedulingPickup(false);
    }
  };

  // 6. Cancel a Scheduled Pickup
  const handleCancelPickup = async (pickupId: string) => {
    if (!confirm(`Are you sure you want to cancel pickup request ${pickupId}?`)) return;
    try {
      await apiClient.post(`/shipping/delhivery/pickup-request/${encodeURIComponent(pickupId)}/cancel`);
      const filtered = scheduledPickups.filter((p) => p.pickupId !== pickupId);
      setScheduledPickups(filtered);
      if (typeof window !== 'undefined') {
        localStorage.setItem('vs_scheduled_pickups', JSON.stringify(filtered));
      }
      toast('success', 'Pickup Request Cancelled', `Token ${pickupId} status updated.`);
      await loadPickupRequests();
    } catch (err) {
      toast('error', 'Cancellation Failed', getApiErrorMessage(err));
    }
  };

  // 7. Generate End-of-Day Manifest
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
              <h1 className="text-xl font-bold text-neutral-900">Delhivery Logistics &amp; Courier Dispatch Desk</h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Batch print 4x6 thermal barcode labels, schedule driver pickups linked to today&apos;s orders, and track transit in real time.
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
            Delhivery B2C Express &amp; Surface Gateway Active
          </span>
          <span className="text-2xs bg-sky-200/70 text-sky-900 font-bold px-2 py-0.5 rounded-full">
            4x6 Thermal Labels · Driver Roster Linked
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
            onClick={() => openPickupModalForOrders()}
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

      {/* SECTION 1: SCHEDULED DRIVER PICKUPS & ARRIVAL ROSTER (SUPER ADMIN TRACKER) */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-50/50">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900">Scheduled Driver Pickups &amp; Arrival Tracker</h2>
                <p className="text-2xs text-neutral-500">
                  Track when Delhivery drivers will arrive at your warehouse, driver phone, vehicle numbers &amp; linked order IDs.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadPickupRequests}
              disabled={isLoadingPickups}
              className="text-2xs font-bold text-neutral-700 bg-white border border-neutral-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 hover:bg-neutral-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPickups ? 'animate-spin text-sky-600' : ''}`} />
              Refresh Driver Roster
            </button>
            <button
              type="button"
              onClick={() => openPickupModalForOrders()}
              className="text-2xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" /> + Schedule Driver Pickup
            </button>
          </div>
        </div>

        {/* Pickups Roster Grid */}
        <div className="p-5">
          {isLoadingPickups ? (
            <div className="py-8 text-center text-neutral-400">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
              Loading live pickup schedule...
            </div>
          ) : scheduledPickups.filter((p) => p.status !== 'CANCELLED').length === 0 ? (
            <div className="p-6 rounded-2xl bg-neutral-50 border border-dashed border-neutral-200 text-center space-y-2">
              <Package className="w-8 h-8 text-neutral-400 mx-auto" />
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-neutral-800">No Driver Pickups Scheduled Yet</h3>
                <p className="text-2xs text-neutral-500 max-w-md mx-auto">
                  When you have orders ready for courier handover, click &quot;Schedule Driver Pickup&quot; to book a Delhivery van arrival window.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openPickupModalForOrders()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer mt-2"
              >
                <Calendar className="w-3.5 h-3.5" /> Schedule Pickup for Today&apos;s Orders ({todayOrders.length})
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scheduledPickups
                .filter((p) => p.status !== 'CANCELLED')
                .map((pickup) => (
                  <div
                    key={pickup.pickupId}
                    className="p-4 rounded-2xl border transition-all space-y-3 bg-gradient-to-br from-emerald-50/70 via-white to-sky-50/40 border-emerald-200 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-neutral-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-sky-950 bg-sky-100/90 px-2 py-0.5 rounded border border-sky-200">
                            {pickup.pickupId}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              pickup.status === 'DRIVER_ASSIGNED'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : pickup.status === 'OUT_FOR_PICKUP'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-amber-100 text-amber-800 border-amber-200'
                            }`}
                          >
                            {pickup.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-2xs text-neutral-500 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-neutral-400" />
                          <span>Pickup Date: <strong>{pickup.pickupDate}</strong></span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCancelPickup(pickup.pickupId)}
                        className="text-neutral-400 hover:text-red-600 p-1 rounded-lg transition"
                        title="Cancel Pickup Request"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Slot & Warehouse Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-neutral-50/80 rounded-xl border border-neutral-150 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                          Arrival Window Slot
                        </span>
                        <span className="font-bold text-neutral-900 text-2xs flex items-center gap-1 text-emerald-800">
                          <Clock className="w-3 h-3 text-emerald-600" /> {pickup.timeSlot}
                        </span>
                        <span className="text-[10px] text-neutral-500 block">
                          Packages Ready: <strong>{pickup.expectedPackageCount} Box(es)</strong>
                        </span>
                      </div>

                      <div className="p-2.5 bg-neutral-50/80 rounded-xl border border-neutral-150 space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                          Pickup Warehouse Hub
                        </span>
                        <span className="font-semibold text-neutral-900 text-2xs block truncate">
                          {pickup.pickupLocation}
                        </span>
                        {pickup.notes && (
                          <span className="text-[10px] text-neutral-500 block italic truncate">
                            Note: {pickup.notes}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Linked Orders Strip */}
                    {pickup.orderNumbers && pickup.orderNumbers.length > 0 && (
                      <div className="p-2 bg-white rounded-xl border border-neutral-200 text-2xs flex items-center gap-1.5 flex-wrap">
                        <span className="text-neutral-500 font-bold uppercase text-[9px] flex items-center gap-1">
                          <LinkIcon className="w-3 h-3 text-sky-600" /> Linked Orders:
                        </span>
                        {pickup.orderNumbers.map((num, idx) => (
                          <span key={idx} className="font-mono font-bold text-sky-900 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                            {num}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Driver Contact Box */}
                    {pickup.driverName && (
                      <div className="p-2.5 bg-sky-50/70 border border-sky-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-2xs shrink-0">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-neutral-900 text-2xs truncate">
                              Driver: {pickup.driverName}
                            </div>
                            <div className="text-[10px] text-neutral-500 truncate flex items-center gap-1">
                              <Truck className="w-3 h-3 text-sky-600" /> {pickup.vehicleNumber || 'Van'}
                            </div>
                          </div>
                        </div>

                        {pickup.driverPhone && (
                          <a
                            href={`tel:${pickup.driverPhone}`}
                            className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-2.5 py-1 rounded-lg text-2xs flex items-center gap-1 transition shrink-0"
                          >
                            <PhoneCall className="w-3 h-3" /> Call Driver
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: TODAY'S ORDERS & DISPATCH QUEUE TABLE */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-50/50">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-bold text-neutral-900">Today&apos;s Orders &amp; Dispatch Queue</h2>
              <span className="bg-sky-100 text-sky-800 text-2xs font-bold px-2 py-0.5 rounded-full">
                {todayOrders.length} Orders
              </span>
            </div>
            <p className="text-2xs text-neutral-500 mt-0.5">
              Select orders to print 4x6 thermal barcode labels in batch, generate waybills, or schedule driver pickup.
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
                <th className="py-3 px-3">Customer &amp; Destination</th>
                <th className="py-3 px-3">Amount &amp; Mode</th>
                <th className="py-3 px-3">Shipment Status</th>
                <th className="py-3 px-3">Courier &amp; Waybill</th>
                <th className="py-3 px-3">Driver Pickup</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoadingOrders ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-600" />
                    Loading orders dispatch queue...
                  </td>
                </tr>
              ) : todayOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-400">
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
                  const linkedPickup = getOrderPickup(order);

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

                      {/* Driver Pickup Column */}
                      <td className="py-3 px-3">
                        {linkedPickup ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.5 rounded text-2xs border border-emerald-200">
                                {linkedPickup.pickupId}
                              </span>
                            </div>
                            <div className="text-[10px] text-emerald-800 font-medium truncate">
                              {linkedPickup.timeSlot.split(' ')[0]} ({linkedPickup.status.replace(/_/g, ' ')})
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openPickupModalForOrders([order])}
                            className="text-2xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg transition"
                          >
                            + Schedule Pickup
                          </button>
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

      {/* SECTION 3: SINGLE DISPATCH & MANUAL WAYBILL GENERATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dispatch Form */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-5">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-sky-600" />
              Manual Order Dispatch &amp; AWB Waybill Generator
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
                  Generating AWB &amp; Dispatching...
                </>
              ) : (
                <>
                  <Barcode className="w-4 h-4" />
                  Generate {courierPartner} AWB &amp; Dispatch Order
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
                    <Search className="w-3.5 h-3.5" /> Track Live Inside App
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
                          <div className="w-2.5 h-2.5 rounded-full bg-sky-600 mt-1.5 shrink-0" />
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
                  <p className="text-xs text-neutral-500">Request Delhivery van/driver for warehouse package handover.</p>
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
              {/* Target Orders Notification */}
              {pickupTargetOrderNumbers.length > 0 && (
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-2xs text-sky-950 space-y-1">
                  <span className="font-bold block text-sky-900">
                    📦 Orders Included in this Pickup Request ({pickupTargetOrderNumbers.length}):
                  </span>
                  <div className="flex flex-wrap gap-1 font-mono">
                    {pickupTargetOrderNumbers.map((num, idx) => (
                      <span key={idx} className="bg-white px-1.5 py-0.5 rounded border border-sky-200 font-bold">
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Pickup Origin Warehouse *
                </label>
                <select
                  value={pickupLocationSelection}
                  onChange={(e) => setPickupLocationSelection(e.target.value)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {warehouses.length > 0 ? (
                    warehouses.map((wh: any) => (
                      <option key={wh.id} value={wh.code || wh.id}>
                        🏢 {wh.name} ({wh.city || 'Manuguru'} - {wh.postalCode || '507117'}) {wh.isDefault ? '· (Default Hub)' : ''}
                      </option>
                    ))
                  ) : (
                    <option value="MNG-01">
                      🏬 Manuguru Main Warehouse (Manuguru - 507117) · (Default Hub)
                    </option>
                  )}
                </select>

                {/* Selected Warehouse Physical Address & Contact Card */}
                {(() => {
                  const selectedWh = warehouses.find((w: any) => w.code === pickupLocationSelection || w.id === pickupLocationSelection) || warehouses[0];
                  const displayAddress = selectedWh?.address
                    ? `${selectedWh.address}, ${selectedWh.city || 'Manuguru'}, ${selectedWh.state || 'Telangana'} - ${selectedWh.postalCode || '507117'}`
                    : 'VASANTHI CREATIONS PVT LTD 2-1-156/3 Ashoknagar main road, Samithi singaram grama panchayati, Beside MORE super market, Manuguru, Telangana 507117';
                  const displayPhone = selectedWh?.phone || '+91 7660922416';
                  const displayContact = selectedWh?.contactPerson || 'Duddukuri Jaswanth';
                  return (
                    <div className="mt-2.5 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-2xs text-emerald-950 space-y-1">
                      <div className="flex items-start gap-1.5 font-semibold text-emerald-900">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{displayAddress}</span>
                      </div>
                      <div className="flex items-center gap-3 text-emerald-800 pt-1 border-t border-emerald-200/60">
                        <span>👤 Contact: <strong>{displayContact}</strong></span>
                        <span>📞 Phone: <strong>{displayPhone}</strong></span>
                      </div>
                    </div>
                  );
                })()}
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
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setPickupDate(newDate);
                      const slots = getTimeSlotsForDate(newDate);
                      const currentObj = slots.find((s) => s.value === pickupTimeSlot);
                      if (!currentObj || currentObj.disabled) {
                        const firstValid = slots.find((s) => !s.disabled) || slots[0];
                        setPickupTimeSlot(firstValid.value);
                      }
                    }}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                    Time Window Slot *
                  </label>
                  {(() => {
                    const availableSlots = getTimeSlotsForDate(pickupDate);
                    const allDisabled = availableSlots.every((s) => s.disabled);
                    return (
                      <>
                        <select
                          value={pickupTimeSlot}
                          onChange={(e) => setPickupTimeSlot(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {availableSlots.map((s) => (
                            <option key={s.value} value={s.value} disabled={s.disabled} className={s.disabled ? 'text-neutral-400 bg-neutral-100' : ''}>
                              {s.label} {s.statusLabel}
                            </option>
                          ))}
                        </select>
                        {allDisabled && (
                          <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-1.5 rounded-lg mt-1 font-medium">
                            ⚠️ Today&apos;s same-day driver cutoffs have passed. Please select tomorrow for morning collection.
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Expected Package Count *
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    ⚡ Auto-calculated from order items
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  required
                  value={expectedPackages}
                  onChange={(e) => setExpectedPackages(parseInt(e.target.value) || 1)}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-2xs text-neutral-400 mt-1">
                  Total parcel boxes ready for courier vehicle handover. Each item/quantity in the selected orders is counted as 1 ready box.
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
                      Confirm &amp; Schedule Driver Pickup
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 4: DAILY DISPATCH MANIFEST */}
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
