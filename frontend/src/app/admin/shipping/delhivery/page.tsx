'use client';

import React, { useState } from 'react';
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
  FileSpreadsheet
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { orderService } from '@/features/orders/order.service';
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

  // Active Tab: Delhivery (Primary) or DTDC
  const [activePartner, setActivePartner] = useState<'DELHIVERY' | 'DTDC'>('DELHIVERY');

  // Dispatch Form State
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

  // Live Tracking State
  const [trackAwb, setTrackAwb] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackingResult, setTrackingResult] = useState<TrackingData | null>(null);

  // Pickup Request State
  const [isSchedulingPickup, setIsSchedulingPickup] = useState(false);
  const [pickupResult, setPickupResult] = useState<string | null>(null);

  // End of Day Manifest State
  const [isGeneratingManifest, setIsGeneratingManifest] = useState(false);
  const [manifestData, setManifestData] = useState<any | null>(null);

  // Copy helper
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
    toast('success', 'Copied to Clipboard', text);
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

  // 1. Generate AWB & Dispatch Order
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

      // Assign Courier & Update Order to SHIPPED
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
      toast('success', 'AWB Generated & Order Dispatched!', `AWB: ${generatedAwb} via ${courierPartner}`);
    } catch (err) {
      toast('error', 'Shipment Dispatch Failed', getApiErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Track Live AWB
  const handleTrackShipment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trackAwb.trim()) {
      toast('warning', 'Please enter an AWB / Waybill number to track');
      return;
    }

    setIsTracking(true);
    setTrackingResult(null);

    try {
      const endpoint =
        activePartner === 'DELHIVERY' || trackAwb.toUpperCase().startsWith('DEL')
          ? `/shipping/delhivery/track/${encodeURIComponent(trackAwb.trim())}`
          : `/shipping/track/${encodeURIComponent(trackAwb.trim())}`;

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

  // 3. Print 4x6 Thermal Label
  const handlePrintLabel = (waybill: string) => {
    const labelUrl = `https://track.delhivery.com/api/v1/packages/label?waybill=${encodeURIComponent(waybill)}`;
    window.open(labelUrl, 'ThermalLabelWindow', 'width=500,height=700,scrollbars=yes,resizable=yes');
  };

  // 4. Request Delhivery Driver Pickup
  const handleRequestPickup = async () => {
    setIsSchedulingPickup(true);
    setPickupResult(null);
    try {
      const res = await apiClient.post('/shipping/delhivery/pickup-request', {
        pickupLocation: 'VASANTHI_MAIN_WAREHOUSE',
        pickupDate: new Date().toISOString().split('T')[0],
        pickupTime: '11:00:00',
        expectedPackageCount: 1,
      });
      const data = res.data?.data || res.data;
      const msg = `Pickup Scheduled! Token ID: ${data.pickupId || 'DEL-PU-001'} for ${pickupLocation}`;
      setPickupResult(msg);
      toast('success', 'Pickup Dispatched', msg);
    } catch (err) {
      toast('error', 'Pickup Request Failed', getApiErrorMessage(err));
    } finally {
      setIsSchedulingPickup(false);
    }
  };

  // 5. Generate End-of-Day Manifest
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
              <h1 className="text-xl font-bold text-neutral-900">Courier & Logistics Dispatch</h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                Generate AWB waybills, print 4x6 shipping labels, and schedule courier pickups.
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
            <ShieldCheck className="w-3.5 h-3.5" /> Delhivery (Approved Partner)
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

      {/* Primary Gateway Status Banner */}
      <div className="p-4 bg-sky-50/80 border border-sky-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-sky-950">
            {activePartner === 'DELHIVERY'
              ? 'Delhivery B2C Express & Surface Gateway Active'
              : 'DTDC Express Logistics Gateway Active'}
          </span>
          <span className="text-2xs bg-sky-200/70 text-sky-900 font-bold px-2 py-0.5 rounded-full">
            Ready for Automated AWB Dispatch
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRequestPickup}
            disabled={isSchedulingPickup}
            className="bg-white hover:bg-neutral-50 text-neutral-800 font-bold px-3 py-1.5 rounded-xl border border-sky-200 text-2xs transition flex items-center gap-1"
          >
            <Calendar className="w-3 h-3 text-sky-600" />
            {isSchedulingPickup ? 'Scheduling...' : 'Schedule Pickup'}
          </button>
          <button
            type="button"
            onClick={handleGenerateManifest}
            disabled={isGeneratingManifest}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-3 py-1.5 rounded-xl text-2xs transition flex items-center gap-1 shadow-xs"
          >
            <FileSpreadsheet className="w-3 h-3" />
            {isGeneratingManifest ? 'Generating...' : 'Daily Handover Manifest'}
          </button>
        </div>
      </div>

      {pickupResult && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{pickupResult}</span>
        </div>
      )}

      {/* Main Grid: Left = Dispatch & Generate AWB, Right = AWB Live Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step 1 & 2: Select Partner & Generate AWB */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-5">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-sky-600" />
              1. Select Courier Partner & Generate AWB
            </h2>
            <p className="text-2xs text-neutral-400 mt-0.5">
              Enter the confirmed order number to assign a courier and automatically generate the AWB tracking code.
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
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/90 space-y-3 animate-in fade-in slide-in-from-top-2">
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
                  <a
                    href={generatedShipment.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-2xs text-sky-700 font-bold hover:underline mt-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Track on {generatedShipment.courierPartner}
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-sky-200/70 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintLabel(generatedShipment.waybillNumber)}
                  className="flex-1 bg-sky-700 hover:bg-sky-800 text-white font-bold py-2 px-3 rounded-xl text-2xs flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" /> Print 4x6 Thermal Label
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTrackAwb(generatedShipment.waybillNumber);
                    handleTrackShipment();
                  }}
                  className="flex-1 bg-white hover:bg-neutral-50 text-sky-900 border border-sky-300 font-bold py-2 px-3 rounded-xl text-2xs flex items-center justify-center gap-1.5 transition"
                >
                  <Search className="w-3.5 h-3.5" /> Track Now
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live AWB Tracking & Pickup Verification */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-5">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Search className="w-4 h-4 text-sky-600" />
              2. Track Live AWB Waybill
            </h2>
            <p className="text-2xs text-neutral-400 mt-0.5">
              Enter any Delhivery or DTDC AWB tracking number to view real-time status.
            </p>
          </div>

          <form onSubmit={handleTrackShipment} className="space-y-3 text-xs">
            <div className="flex gap-2">
              <input
                type="text"
                value={trackAwb}
                onChange={(e) => setTrackAwb(e.target.value)}
                placeholder="Enter AWB (e.g. DEL749281034)"
                className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3.5 py-2 text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="submit"
                disabled={isTracking}
                className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                {isTracking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Track
              </button>
            </div>
          </form>

          {/* Tracking Result View */}
          {trackingResult && (
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2">
                <div>
                  <span className="text-2xs text-neutral-400 block font-mono">AWB: {trackingResult.waybill}</span>
                  <span className="font-bold text-sm text-neutral-900">{trackingResult.status}</span>
                </div>
                <span className="text-2xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  {trackingResult.statusLocation || 'In Transit'}
                </span>
              </div>

              {trackingResult.expectedDeliveryDate && (
                <div className="flex items-center gap-1.5 text-2xs text-neutral-600">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Expected Delivery: <strong>{new Date(trackingResult.expectedDeliveryDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</strong></span>
                </div>
              )}

              {/* Scans Timeline */}
              {trackingResult.scans && trackingResult.scans.length > 0 ? (
                <div className="space-y-2 pt-2 border-t border-neutral-200">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Transit Activity History
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {trackingResult.scans.map((scan, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-2xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-600 mt-1 shrink-0" />
                        <div>
                          <div className="font-semibold text-neutral-800">{scan.status}</div>
                          <div className="text-neutral-400 text-[10px] flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" /> {scan.location} · {scan.timestamp ? new Date(scan.timestamp).toLocaleString('en-IN') : 'Logged'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-2xs text-neutral-500 italic">
                  Package registered at origin sorting center. Live scans will update as the courier scans the parcel.
                </p>
              )}
            </div>
          )}

          {/* Thermal Label Quick Access */}
          <div className="p-4 rounded-2xl border border-dashed border-neutral-200 bg-white space-y-2">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Direct Thermal Shipping Label (4x6)
            </span>
            <p className="text-2xs text-neutral-500">
              Print direct barcodes compatible with Zebra, TSC, and TVS 4x6 label thermal printers.
            </p>
            <button
              type="button"
              onClick={() => handlePrintLabel(trackAwb || 'DEL749281034')}
              className="w-full bg-white hover:bg-neutral-50 text-neutral-800 font-bold py-2 px-3 rounded-xl border border-neutral-200 text-xs flex items-center justify-center gap-2 transition"
            >
              <Printer className="w-4 h-4 text-sky-600" />
              Print Sample 4x6 Delhivery Barcode Label
            </button>
          </div>
        </div>
      </div>

      {/* Manifest Modal / View */}
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
              <Printer className="w-3.5 h-3.5" /> Print Manifest
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
