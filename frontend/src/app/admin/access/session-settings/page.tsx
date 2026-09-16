'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Timer, Save, RefreshCw, KeyRound, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { adminOpsApi, SessionExpirySettingsDto } from '@/features/admin-ops/admin-ops.api';
import { useUserSessions, useSessionStats, useRevokeSession, useRevokeExpiredSessions } from '@/features/sessions/session.hooks';
import { UserSession } from '@/features/sessions/session.types';
import { useToast } from '@/components/toast/ToastProvider';
import { getApiErrorMessage } from '@/utils/api-error';

const EMPTY_FORM: SessionExpirySettingsDto = {
  adminSessionHours: 24,
  accessTokenMinutes: 60,
  rememberMeAccessTokenDays: 30,
  refreshTokenDays: 30,
  rememberMeRefreshTokenDays: 90,
};

export default function SessionSettingsAdminPage() {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const { data: settings, refetch } = useQuery({
    queryKey: ['admin', 'session-settings'],
    queryFn: () => adminOpsApi.getSessionSettings(),
  });

  useEffect(() => {
    if (settings) {
      setForm({
        adminSessionHours: settings.adminSessionHours || 24,
        accessTokenMinutes: settings.accessTokenMinutes || 60,
        rememberMeAccessTokenDays: settings.rememberMeAccessTokenDays || 30,
        refreshTokenDays: settings.refreshTokenDays || 30,
        rememberMeRefreshTokenDays: settings.rememberMeRefreshTokenDays || 90,
      });
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminOpsApi.updateSessionSettings(form);
      toast('success', 'Session settings saved', 'Super Admin and user sessions updated successfully.');
      await refetch();
    } catch (err) {
      toast('error', 'Save failed', getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const applyRecommended = () => {
    setForm({
      adminSessionHours: 48,
      accessTokenMinutes: 120,
      rememberMeAccessTokenDays: 30,
      refreshTokenDays: 30,
      rememberMeRefreshTokenDays: 90,
    });
    toast('info', 'Recommended values selected', 'Click "Save Configuration" below to apply.');
  };

  return (
    <div className="p-6 space-y-6 max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-neutral-900 flex items-center gap-2.5">
            <Timer className="w-6 h-6 text-[#0284c7]" />
            <span>Login & Session Expiration Settings</span>
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Control how many hours or days Super Admin, Staff, and Customer sessions stay signed in before expiring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={applyRecommended}
            className="px-3 py-2 border border-sky-200 bg-sky-50/50 hover:bg-sky-50 text-sky-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Recommended Setup
          </button>
          <button
            type="button"
            onClick={() => void refetch()}
            className="p-2 border border-neutral-300 rounded-xl hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-neutral-500" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-6">
        {/* Super Admin & Staff Session Settings */}
        <div className="p-4 bg-sky-50/60 border border-sky-200/80 rounded-xl space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-sky-600 text-white text-[10px] font-black rounded-md uppercase tracking-wider">
                  High Priority
                </span>
                <h2 className="text-sm font-bold text-neutral-900">
                  Super Admin & Staff Session Duration (Hours)
                </h2>
              </div>
              <p className="text-xs text-neutral-600 mt-1">
                How many continuous hours Super Admin, Admin, and Staff remain securely logged in without premature timeouts.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-sky-800 bg-white px-3 py-1 rounded-lg border border-sky-200">
                Current: {form.adminSessionHours} Hours ({Math.round((form.adminSessionHours / 24) * 10) / 10} Days)
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={8760}
                value={form.adminSessionHours}
                onChange={(e) =>
                  setForm((f) => ({ ...f, adminSessionHours: Math.max(1, Number(e.target.value) || 1) }))
                }
                className="w-48 border border-neutral-300 rounded-xl px-3.5 py-2 text-sm font-bold text-neutral-900 bg-white focus:outline-hidden focus:border-[#0284c7]"
              />
              <span className="text-xs font-bold text-neutral-600">Hours</span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[11px] font-semibold text-neutral-500">Quick Presets:</span>
              {[
                { label: '8 Hours (Work shift)', hours: 8 },
                { label: '24 Hours (1 Day)', hours: 24 },
                { label: '48 Hours (2 Days)', hours: 48 },
                { label: '7 Days (168h)', hours: 168 },
                { label: '30 Days (720h)', hours: 720 },
              ].map((p) => (
                <button
                  key={p.hours}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, adminSessionHours: p.hours }))}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    form.adminSessionHours === p.hours
                      ? 'bg-sky-600 text-white border-sky-600 shadow-2xs'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Customer Normal Login */}
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-bold text-neutral-900">Customer Normal Login (Default)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 block">Access token validity (minutes)</label>
              <input
                type="number"
                min={1}
                value={form.accessTokenMinutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, accessTokenMinutes: Math.max(1, Number(e.target.value) || 1) }))
                }
                className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-hidden focus:border-[#0284c7]"
              />
              <p className="text-[11px] text-neutral-500">
                Duration of each active JWT token before transparent background renewal (e.g. 60 min).
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 block">Session validity (days)</label>
              <input
                type="number"
                min={1}
                value={form.refreshTokenDays}
                onChange={(e) =>
                  setForm((f) => ({ ...f, refreshTokenDays: Math.max(1, Number(e.target.value) || 1) }))
                }
                className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-hidden focus:border-[#0284c7]"
              />
              <p className="text-[11px] text-neutral-500">
                How many days a customer remains logged in without needing to enter password again.
              </p>
            </div>
          </div>
        </div>

        {/* Customer "Remember me" login */}
        <div className="pt-4 border-t border-neutral-100 space-y-3">
          <h2 className="text-sm font-bold text-neutral-900">Customer "Remember me" Login</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 block">Access token validity (days)</label>
              <input
                type="number"
                min={1}
                value={form.rememberMeAccessTokenDays}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rememberMeAccessTokenDays: Math.max(1, Number(e.target.value) || 1) }))
                }
                className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-hidden focus:border-[#0284c7]"
              />
              <p className="text-[11px] text-neutral-500">Used when the customer checked "Remember me" at login.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 block">Session validity (days)</label>
              <input
                type="number"
                min={1}
                value={form.rememberMeRefreshTokenDays}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rememberMeRefreshTokenDays: Math.max(1, Number(e.target.value) || 1) }))
                }
                className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-hidden focus:border-[#0284c7]"
              />
              <p className="text-[11px] text-neutral-500">
                How many days a "Remember me" session is kept active (e.g. 90 days).
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#0284c7] hover:bg-[#0B3B78] disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving…' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>

      <ActiveUserSessionsSection />
      <GoogleAuthSection />
      <RazorpaySection />
    </div>
  );
}

function GoogleAuthSection() {
  const { toast } = useToast();
  const [clientId, setClientId] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: config, refetch } = useQuery({
    queryKey: ['admin', 'google-auth', 'config'],
    queryFn: () => adminOpsApi.getGoogleAuthConfig(),
  });

  useEffect(() => {
    if (config) setClientId(config.clientId);
  }, [config]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminOpsApi.updateGoogleAuthConfig(clientId.trim());
      toast('success', 'Google Client ID saved', 'Takes effect immediately — no redeploy needed.');
      await refetch();
    } catch (err) {
      toast('error', 'Save failed', getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-4">
      <div>
        <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#0284c7]" />
          <span>Google Sign-In</span>
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Powers the "Continue with Google" button on the login page. From Google Cloud Console:
          Google Auth Platform &gt; Clients &gt; your Web application client.
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-neutral-700 block">Google OAuth Client ID</label>
        <input
          type="text"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="123456789-abc...apps.googleusercontent.com"
          className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:outline-hidden focus:border-[#0284c7]"
        />
        <p className="text-[11px] text-neutral-500">
          Not a secret — this is the same ID that's normally embedded directly in frontend JS, so it's shown here
          in full. The client secret from Google Cloud Console is never needed for this login flow.
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2.5 bg-[#0284c7] hover:bg-[#0B3B78] disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
      >
        <Save className="w-3.5 h-3.5" />
        <span>{saving ? 'Saving…' : 'Save Client ID'}</span>
      </button>
    </form>
  );
}

function RazorpaySection() {
  const { toast } = useToast();
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: config, refetch } = useQuery({
    queryKey: ['admin', 'razorpay', 'config'],
    queryFn: () => adminOpsApi.getRazorpayConfig(),
  });

  useEffect(() => {
    if (config) setKeyId(config.keyId);
  }, [config]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminOpsApi.updateRazorpayConfig({
        keyId: keyId.trim(),
        ...(keySecret.trim() ? { keySecret: keySecret.trim() } : {}),
        ...(webhookSecret.trim() ? { webhookSecret: webhookSecret.trim() } : {}),
      });
      toast('success', 'Razorpay settings saved', 'Takes effect immediately — no redeploy needed.');
      setKeySecret('');
      setWebhookSecret('');
      await refetch();
    } catch (err) {
      toast('error', 'Save failed', getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const statusPill = (label: string, configured: boolean) => (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
        configured
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-amber-50 text-amber-700 border-amber-200'
      }`}
    >
      {configured ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
      {label} {configured ? 'set' : 'not set'}
    </span>
  );

  return (
    <form onSubmit={handleSave} className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#0284c7]" />
            <span>Razorpay</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Powers online checkout payments and refunds. From Razorpay dashboard: Settings &gt; API Keys, and
            Settings &gt; Webhooks for the webhook secret.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {statusPill('Key Secret', !!config?.keySecretConfigured)}
          {statusPill('Webhook Secret', !!config?.webhookSecretConfigured)}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-neutral-700 block">Key ID</label>
        <input
          type="text"
          value={keyId}
          onChange={(e) => setKeyId(e.target.value)}
          placeholder="rzp_live_... or rzp_test_..."
          className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:outline-hidden focus:border-[#0284c7]"
        />
        <p className="text-[11px] text-neutral-500">
          Not a secret — this is the same ID normally embedded in frontend checkout JS.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-neutral-700 block">
            Key Secret {config?.keySecretConfigured ? '(currently set — leave blank to keep it)' : ''}
          </label>
          <input
            type="password"
            value={keySecret}
            onChange={(e) => setKeySecret(e.target.value)}
            placeholder={config?.keySecretConfigured ? '••••••••••••••••••••' : 'Paste Key Secret'}
            autoComplete="new-password"
            className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:outline-hidden focus:border-[#0284c7]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-neutral-700 block">
            Webhook Secret {config?.webhookSecretConfigured ? '(currently set — leave blank to keep it)' : ''}
          </label>
          <input
            type="password"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            placeholder={config?.webhookSecretConfigured ? '••••••••••••••••••••' : 'Paste Webhook Secret'}
            autoComplete="new-password"
            className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:outline-hidden focus:border-[#0284c7]"
          />
        </div>
      </div>
      <p className="text-[11px] text-neutral-500">
        Both secrets are stored securely on the server and never shown again after saving. Leave either blank to
        keep the current value unchanged.
      </p>

      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2.5 bg-[#0284c7] hover:bg-[#0B3B78] disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
      >
        <Save className="w-3.5 h-3.5" />
        <span>{saving ? 'Saving…' : 'Save Razorpay Settings'}</span>
      </button>
    </form>
  );
}

function ActiveUserSessionsSection() {
  const { toast } = useToast();
  const { data: rawSessions, isLoading, refetch } = useUserSessions();
  const { data: stats } = useSessionStats();
  const revokeMutation = useRevokeSession();
  const revokeExpiredMutation = useRevokeExpiredSessions();

  const sessions: UserSession[] = Array.isArray(rawSessions)
    ? rawSessions
    : Array.isArray((rawSessions as any)?.data)
    ? (rawSessions as any).data
    : Array.isArray((rawSessions as any)?.data?.data)
    ? (rawSessions as any).data.data
    : [];

  const handleRevoke = async (id: string) => {
    try {
      await revokeMutation.mutateAsync(id);
      toast('success', 'Session revoked', 'User session has been invalidated.');
      refetch();
    } catch (err) {
      toast('error', 'Revoke failed', getApiErrorMessage(err));
    }
  };

  const handleCleanExpired = async () => {
    try {
      await revokeExpiredMutation.mutateAsync();
      toast('success', 'Expired sessions cleaned', 'All stale sessions removed.');
      refetch();
    } catch (err) {
      toast('error', 'Cleanup failed', getApiErrorMessage(err));
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#0284c7]" />
            <span>Active Login Sessions ({sessions.length})</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Monitor live customer and staff sessions, inspect IP addresses & user agents, or forcefully revoke access.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCleanExpired}
          disabled={revokeExpiredMutation.isPending}
          className="px-3 py-1.5 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Purge Expired Sessions</span>
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-neutral-50 border border-neutral-200/80 p-3 rounded-xl">
            <span className="text-neutral-500 font-medium block text-[11px]">Total Active</span>
            <strong className="text-sm font-bold text-neutral-900">{stats.totalActiveSessions ?? sessions.length}</strong>
          </div>
          <div className="bg-neutral-50 border border-neutral-200/80 p-3 rounded-xl">
            <span className="text-neutral-500 font-medium block text-[11px]">Unique Users</span>
            <strong className="text-sm font-bold text-neutral-900">{stats.uniqueUsersActive ?? (sessions.length > 0 ? 1 : 0)}</strong>
          </div>
          <div className="bg-neutral-50 border border-neutral-200/80 p-3 rounded-xl">
            <span className="text-neutral-500 font-medium block text-[11px]">Revoked Count</span>
            <strong className="text-sm font-bold text-neutral-900">{stats.revokedSessionsCount ?? 0}</strong>
          </div>
          <div className="bg-neutral-50 border border-neutral-200/80 p-3 rounded-xl">
            <span className="text-neutral-500 font-medium block text-[11px]">Expired Count</span>
            <strong className="text-sm font-bold text-neutral-900">{stats.expiredSessionsCount ?? 0}</strong>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="p-8 text-center text-xs text-neutral-400 font-medium">Loading session monitoring data...</div>
      ) : sessions.length === 0 ? (
        <div className="p-6 text-center text-xs text-neutral-500 bg-neutral-50 rounded-xl">No active sessions currently logged in.</div>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold">
              <tr>
                <th className="p-3">User / Email</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">User Agent</th>
                <th className="p-3">Last Active</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="p-3 font-semibold text-neutral-900">{s.user?.email || s.userId}</td>
                  <td className="p-3 font-mono text-neutral-600">{s.ipAddress || '127.0.0.1'}</td>
                  <td className="p-3 text-neutral-500 max-w-[200px] truncate">{s.userAgent || 'Web Browser'}</td>
                  <td className="p-3 text-neutral-500">{new Date(s.lastActivityAt || s.createdAt).toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleRevoke(s.id)}
                      disabled={revokeMutation.isPending}
                      className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

