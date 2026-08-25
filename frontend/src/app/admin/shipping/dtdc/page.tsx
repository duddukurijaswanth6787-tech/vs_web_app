'use client';

import React, { useState } from 'react';
import { Truck, Plus, RefreshCw, ShieldCheck, Search } from 'lucide-react';
import { adminOpsApi } from '@/features/admin-ops/admin-ops.api';
import type { DtdcShipmentDto } from '@/features/admin-ops/admin-ops.api';
import { orderService } from '@/features/orders/order.service';
import { useToast } from '@/components/toast/ToastProvider';
import { getApiErrorMessage } from '@/utils/api-error';

export default function DtdcShippingAdminPage() {
  const { toast } = useToast();
  const [orderRef, setOrderRef] = useState('');
  const [weight, setWeight] = useState('1.5');
  const [serviceType, setServiceType] = useState('STANDARD');
  const [loading, setLoading] = useState(false);
  const [shipment, setShipment] = useState<DtdcShipmentDto | null>(null);
  const [trackAwb, setTrackAwb] = useState('');
  const [tracking, setTracking] = useState<Record<string, unknown> | null>(null);

  const resolveOrderId = async (ref: string) => {
    const value = ref.trim();
    if (!value) throw new Error('Order number or ID is required');
    const uuidLike =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    if (uuidLike) return value;
    const order = await orderService.findByOrderNumber(value);
    return order.id;
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setShipment(null);
    try {
      const orderId = await resolveOrderId(orderRef);
      const result = await adminOpsApi.createDtdcShipment({
        orderId,
        serviceType,
        weightKg: Number(weight) || 0.5,
        pieces: 1,
      });
      setShipment(result);
      setTrackAwb(result?.awbNumber || '');
      toast(
        'success',
        'DTDC shipment created',
        `AWB: ${result?.awbNumber || 'n/a'} · Status: ${result?.status || 'BOOKED'}`,
      );
    } catch (err) {
      toast('error', 'Shipment failed', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async () => {
    if (!trackAwb.trim()) {
      toast('warning', 'AWB required');
      return;
    }
    setLoading(true);
    try {
      const result = await adminOpsApi.trackDtdc(trackAwb.trim());
      setTracking(result);
      toast('success', 'Tracking loaded', String(result?.status || 'OK'));
    } catch (err) {
      toast('error', 'Track failed', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-neutral-900 flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-[#0284c7]" />
            <span>DTDC Express Shipping Integration</span>
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Create waybills via `/shipping/dtdc/shipments` and track AWB status.
          </p>
        </div>

        <button
          type="button"
          onClick={handleTrack}
          className="p-2 border border-neutral-300 rounded-xl hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 text-xs font-bold transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-neutral-500" />
          <span>Sync / Track</span>
        </button>
      </div>

      <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <h3 className="text-xs font-bold text-neutral-900">DTDC API Gateway Connected</h3>
            <p className="text-[11px] text-neutral-600">
              Live mode needs DTDC_ENABLED + credentials; otherwise shipments are BOOKED_MOCK.
            </p>
          </div>
        </div>
        <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md">
          /shipping/dtdc READY
        </span>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#0284c7]" />
          <span>Dispatch Order via DTDC Express</span>
        </h2>

        <form onSubmit={handleCreateShipment} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 block">Order Number or ID</label>
            <input
              type="text"
              required
              value={orderRef}
              onChange={(e) => setOrderRef(e.target.value)}
              placeholder="VD-987654 or UUID"
              className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-hidden focus:border-[#0284c7]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 block">Parcel Weight (KG)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              required
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-hidden focus:border-[#0284c7]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 block">Service Type</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold focus:outline-hidden focus:border-[#0284c7]"
            >
              <option value="STANDARD">STANDARD</option>
              <option value="EXPRESS">EXPRESS</option>
              <option value="SURFACE">SURFACE</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-[#0284c7] hover:bg-[#0B3B78] disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
            >
              {loading ? 'Creating…' : 'Generate DTDC Waybill'}
            </button>
          </div>
        </form>

        {shipment && (
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 text-xs space-y-1">
            <p>
              <span className="font-bold">AWB:</span>{' '}
              <span className="font-mono text-[#0284c7]">{shipment.awbNumber}</span>
            </p>
            <p>
              <span className="font-bold">Status:</span> {shipment.status}
            </p>
            <p>
              <span className="font-bold">Service:</span> {shipment.serviceType}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <Search className="w-4 h-4 text-[#0284c7]" />
          Track AWB
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={trackAwb}
            onChange={(e) => setTrackAwb(e.target.value)}
            placeholder="AWB number"
            className="flex-1 border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono focus:outline-hidden focus:border-[#0284c7]"
          />
          <button
            type="button"
            onClick={handleTrack}
            disabled={loading}
            className="px-4 py-2 border border-neutral-300 rounded-xl text-xs font-bold hover:bg-neutral-50"
          >
            Track Shipment
          </button>
        </div>
        {tracking && (
          <pre className="text-[11px] bg-neutral-50 border border-neutral-100 rounded-xl p-3 overflow-auto">
            {JSON.stringify(tracking, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
