'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PhoneCall, Send, RefreshCw, ShieldCheck } from 'lucide-react';
import { adminOpsApi } from '@/features/admin-ops/admin-ops.api';
import { useToast } from '@/components/toast/ToastProvider';
import { getApiErrorMessage } from '@/utils/api-error';

const toLogList = (result: unknown): Array<Record<string, unknown>> => {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>;
  if (result && typeof result === 'object') {
    const r = result as { logs?: unknown; data?: unknown };
    if (Array.isArray(r.logs)) return r.logs as Array<Record<string, unknown>>;
    if (Array.isArray(r.data)) return r.data as Array<Record<string, unknown>>;
  }
  return [];
};

export default function SmsGatewayAdminPage() {
  const { toast } = useToast();
  const [mobileNumber, setMobileNumber] = useState('');
  const [template, setTemplate] = useState('CUSTOM');
  const [message, setMessage] = useState('Your order has been updated. - Vasanthi Designers');
  const [loading, setLoading] = useState(false);

  const { data: smsLogData, refetch: reloadLogs } = useQuery({
    queryKey: ['admin', 'sms', 'logs'],
    queryFn: () => adminOpsApi.smsLogs(1, 30),
  });
  const logs = toLogList(smsLogData);

  const normalizedPhone = useMemo(
    () => mobileNumber.replace(/\D/g, '').slice(-10),
    [mobileNumber],
  );

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
      toast('warning', 'Invalid mobile', 'Enter a valid 10-digit Indian mobile number.');
      return;
    }
    setLoading(true);
    try {
      const result = await adminOpsApi.sendSms({
        phone: normalizedPhone,
        template,
        message,
      });
      toast(
        'success',
        'SMS queued',
        `Status: ${result?.status || 'queued'} · +91 ${normalizedPhone}`,
      );
      setMobileNumber('');
      await reloadLogs();
    } catch (err) {
      toast('error', 'SMS failed', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-neutral-900 flex items-center gap-2.5">
            <PhoneCall className="w-6 h-6 text-[#800020]" />
            <span>SMS Provider Gateway & Logs</span>
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Send SMS via `/sms/send` and audit delivery logs from `/sms/logs`.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void reloadLogs()}
          className="p-2 border border-neutral-300 rounded-xl hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 text-xs font-bold transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-neutral-500" />
          <span>Refresh Logs</span>
        </button>
      </div>

      <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <h3 className="text-xs font-bold text-neutral-900">SMS API Connected</h3>
            <p className="text-[11px] text-neutral-600">
              Live send requires ENABLE_SMS + provider credentials; otherwise messages are MOCK_SENT.
            </p>
          </div>
        </div>
        <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md">
          /sms READY
        </span>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <Send className="w-4 h-4 text-[#800020]" />
          <span>Send Customer SMS Message</span>
        </h2>

        <form onSubmit={handleSendSms} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 block">Recipient Mobile (+91)</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="9876543210"
                className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-hidden focus:border-[#800020]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 block">Template</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-[#800020]"
              >
                <option value="CUSTOM">CUSTOM</option>
                <option value="ORDER_CONFIRMED">ORDER_CONFIRMED</option>
                <option value="ORDER_SHIPPED">ORDER_SHIPPED</option>
                <option value="ORDER_DELIVERED">ORDER_DELIVERED</option>
                <option value="OTP">OTP</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 block">SMS Body</label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-neutral-300 rounded-xl p-3 text-xs text-neutral-900 focus:outline-hidden focus:border-[#800020]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-[#800020] hover:bg-[#600018] disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Sending…' : 'Send SMS Message'}</span>
          </button>
        </form>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-3">
        <h2 className="text-sm font-bold text-neutral-900">Recent SMS Logs</h2>
        {logs.length === 0 ? (
          <p className="text-xs text-neutral-500">No SMS logs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Template</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Message</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={String(log.id || idx)} className="border-t border-neutral-100">
                    <td className="px-3 py-2 font-mono">{String(log.phone || '')}</td>
                    <td className="px-3 py-2">{String(log.template || '')}</td>
                    <td className="px-3 py-2 font-bold text-[#800020]">{String(log.status || '')}</td>
                    <td className="px-3 py-2 text-neutral-600 line-clamp-1 max-w-xs">{String(log.message || '')}</td>
                    <td className="px-3 py-2 text-neutral-500">
                      {log.createdAt ? new Date(String(log.createdAt)).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
