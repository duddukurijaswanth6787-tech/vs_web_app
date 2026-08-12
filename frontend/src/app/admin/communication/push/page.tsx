'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Send, RefreshCw, Smartphone } from 'lucide-react';
import { adminOpsApi } from '@/features/admin-ops/admin-ops.api';
import { useToast } from '@/components/toast/ToastProvider';
import { getApiErrorMessage } from '@/utils/api-error';

export default function PushNotificationsAdminPage() {
  const { toast } = useToast();
  const [title, setTitle] = useState('Festive Flash Sale');
  const [body, setBody] = useState('Flat 25% OFF on pure Kanjivaram silk sarees today only!');
  const [targetUserId, setTargetUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([]);

  const loadLogs = useCallback(async () => {
    try {
      const result = await adminOpsApi.pushLogs(1, 30);
      const list = Array.isArray(result?.logs) ? result.logs : Array.isArray(result) ? result : [];
      setLogs(list as Array<Record<string, unknown>>);
    } catch (err) {
      toast('error', 'Failed to load push logs', getApiErrorMessage(err));
    }
  }, [toast]);

  useEffect(() => {
    let active = true;
    adminOpsApi.pushLogs(1, 30).then((result) => {
      if (active) {
        const list = Array.isArray(result?.logs) ? result.logs : Array.isArray(result) ? result : [];
        setLogs(list as Array<Record<string, unknown>>);
      }
    }).catch((err) => {
      if (active) {
        toast('error', 'Failed to load push logs', getApiErrorMessage(err));
      }
    });
    return () => {
      active = false;
    };
  }, [toast]);

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await adminOpsApi.sendPush({
        title,
        body,
        userId: targetUserId.trim() || undefined,
        data: { source: 'admin-broadcast' },
      });
      toast(
        'success',
        'Push queued',
        `Status: ${result?.status || 'queued'} · targets: ${result?.targetCount ?? result?.successCount ?? 'n/a'}`,
      );
      await loadLogs();
    } catch (err) {
      toast('error', 'Push failed', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-neutral-900 flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-[#800020]" />
            <span>Push Notifications Manager</span>
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Broadcast via `/push/send` and audit `/push/logs`.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          className="p-2 border border-neutral-300 rounded-xl hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 text-xs font-bold transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-neutral-500" />
          <span>Refresh Logs</span>
        </button>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <Send className="w-4 h-4 text-[#800020]" />
          <span>Compose Push Notification Campaign</span>
        </h2>

        <form onSubmit={handleSendPush} className="space-y-4 max-w-2xl">
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 block">Notification Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-bold text-neutral-900 focus:outline-hidden focus:border-[#800020]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 block">Message Body</label>
            <textarea
              rows={3}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full border border-neutral-300 rounded-xl p-3 text-xs text-neutral-900 focus:outline-hidden focus:border-[#800020]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 block">
              Target User ID (optional — leave empty for all devices)
            </label>
            <input
              type="text"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="Customer user UUID or blank for broadcast"
              className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono focus:outline-hidden focus:border-[#800020]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-[#800020] hover:bg-[#600018] disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Broadcasting…' : 'Broadcast Push Notification'}</span>
          </button>
        </form>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-3">
        <h2 className="text-sm font-bold text-neutral-900">Recent Push Logs</h2>
        {logs.length === 0 ? (
          <p className="text-xs text-neutral-500">No push logs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Targets</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={String(log.id || idx)} className="border-t border-neutral-100">
                    <td className="px-3 py-2">
                      <p className="font-bold">{String(log.title || '')}</p>
                      <p className="text-neutral-500 line-clamp-1">{String(log.body || '')}</p>
                    </td>
                    <td className="px-3 py-2 font-bold text-[#800020]">{String(log.status || '')}</td>
                    <td className="px-3 py-2">{String(log.targetCount ?? log.successCount ?? 0)}</td>
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
