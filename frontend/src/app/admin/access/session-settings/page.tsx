'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Timer, Save, RefreshCw, KeyRound } from 'lucide-react';
import { adminOpsApi, SessionExpirySettingsDto } from '@/features/admin-ops/admin-ops.api';
import { useToast } from '@/components/toast/ToastProvider';
import { getApiErrorMessage } from '@/utils/api-error';

const EMPTY_FORM: SessionExpirySettingsDto = {
  accessTokenMinutes: 15,
  rememberMeAccessTokenDays: 30,
  refreshTokenDays: 7,
  rememberMeRefreshTokenDays: 30,
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
    if (settings) setForm(settings);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminOpsApi.updateSessionSettings(form);
      toast('success', 'Session settings saved', 'New logins will use the updated expiry.');
      await refetch();
    } catch (err) {
      toast('error', 'Save failed', getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const numberField = (
    key: keyof SessionExpirySettingsDto,
    label: string,
    helper: string,
  ) => (
    <div className="space-y-1">
      <label className="text-xs font-bold text-neutral-700 block">{label}</label>
      <input
        type="number"
        min={1}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: Math.max(1, Number(e.target.value) || 1) }))}
        className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-hidden focus:border-[#800020]"
      />
      <p className="text-[11px] text-neutral-500">{helper}</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-[1000px] mx-auto">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-neutral-900 flex items-center gap-2.5">
            <Timer className="w-6 h-6 text-[#800020]" />
            <span>Login Sessions</span>
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Control how long a customer or staff login stays valid before they're signed out.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refetch()}
          className="p-2 border border-neutral-300 rounded-xl hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 text-xs font-bold transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-neutral-500" />
          <span>Refresh</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-6">
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-neutral-900">Normal login</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {numberField(
              'accessTokenMinutes',
              'Access token validity (minutes)',
              'How long a session stays signed in before it silently needs a refresh.',
            )}
            {numberField(
              'refreshTokenDays',
              'Session validity (days)',
              'How many days after login the customer can be silently refreshed before being asked to log in again.',
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-100 space-y-3">
          <h2 className="text-sm font-bold text-neutral-900">"Remember me" login</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {numberField(
              'rememberMeAccessTokenDays',
              'Access token validity (days)',
              'Used when the customer checked "Remember me" at login.',
            )}
            {numberField(
              'rememberMeRefreshTokenDays',
              'Session validity (days)',
              'How many days a "Remember me" session is kept before requiring a fresh login.',
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-[#800020] hover:bg-[#600018] disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving…' : 'Save Configuration'}</span>
        </button>
      </form>

      <GoogleAuthSection />
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
          <KeyRound className="w-4 h-4 text-[#800020]" />
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
          className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:outline-hidden focus:border-[#800020]"
        />
        <p className="text-[11px] text-neutral-500">
          Not a secret — this is the same ID that's normally embedded directly in frontend JS, so it's shown here
          in full. The client secret from Google Cloud Console is never needed for this login flow.
        </p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2.5 bg-[#800020] hover:bg-[#600018] disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
      >
        <Save className="w-3.5 h-3.5" />
        <span>{saving ? 'Saving…' : 'Save Client ID'}</span>
      </button>
    </form>
  );
}
