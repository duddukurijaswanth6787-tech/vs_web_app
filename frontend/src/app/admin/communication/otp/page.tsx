'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { KeyRound, Save, RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react';
import { adminOpsApi, OtpGatewayConfigDto, OtpTemplateOptionDto } from '@/features/admin-ops/admin-ops.api';
import { useToast } from '@/components/toast/ToastProvider';
import { getApiErrorMessage } from '@/utils/api-error';

const EMPTY_FORM: Omit<OtpGatewayConfigDto, 'apiKeyConfigured'> = {
  provider: 'mock',
  appName: '',
  templateLogin: '',
  templateRegister: '',
  templateVerifyPhone: '',
  expiryMinutes: 10,
};

export default function OtpGatewayAdminPage() {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: config, refetch } = useQuery({
    queryKey: ['admin', 'otp-gateway', 'config'],
    queryFn: () => adminOpsApi.getOtpGatewayConfig(),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['admin', 'otp-gateway', 'templates'],
    queryFn: () => adminOpsApi.getOtpTemplates(),
  });

  useEffect(() => {
    if (config) {
      setForm({
        provider: config.provider,
        appName: config.appName,
        templateLogin: config.templateLogin,
        templateRegister: config.templateRegister,
        templateVerifyPhone: config.templateVerifyPhone,
        expiryMinutes: config.expiryMinutes,
      });
    }
  }, [config]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminOpsApi.updateOtpGatewayConfig({
        ...form,
        ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
      });
      toast('success', 'OTP gateway saved', 'Configuration updated successfully.');
      setApiKey('');
      await refetch();
    } catch (err) {
      toast('error', 'Save failed', getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const apiKeyConfigured = config?.apiKeyConfigured ?? false;

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-neutral-900 flex items-center gap-2.5">
            <KeyRound className="w-6 h-6 text-[#800020]" />
            <span>OTP Gateway</span>
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Configure how login/registration OTPs are sent via StartMessaging.
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

      {apiKeyConfigured ? (
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-neutral-900">StartMessaging API Key Configured</h3>
              <p className="text-[11px] text-neutral-600">
                An API key is on file. Real OTPs will send when the provider below is StartMessaging.
              </p>
            </div>
          </div>
          <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md">KEY SET</span>
        </div>
      ) : (
        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-neutral-900">StartMessaging API Key Not Set</h3>
              <p className="text-[11px] text-neutral-600">
                Paste your API key below and save to enable real sends. Until then OTPs are mocked (logged, not delivered).
              </p>
            </div>
          </div>
          <span className="bg-amber-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md">KEY MISSING</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-neutral-900">Gateway Settings</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 block">Provider</label>
            <select
              value={form.provider}
              onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value as OtpGatewayConfigDto['provider'] }))}
              className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-[#800020]"
            >
              <option value="mock">Mock (log only, no real SMS)</option>
              <option value="startmessaging">StartMessaging</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 block">App Name (used as {'{{appName}}'} in templates)</label>
            <input
              type="text"
              value={form.appName}
              onChange={(e) => setForm((f) => ({ ...f, appName: e.target.value }))}
              placeholder="Vasanthi's Signature"
              className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-hidden focus:border-[#800020]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-neutral-700 block">OTP Validity (minutes, used as {'{{expiry}}'} in templates)</label>
            <input
              type="number"
              min={1}
              value={form.expiryMinutes}
              onChange={(e) => setForm((f) => ({ ...f, expiryMinutes: Number(e.target.value) || 1 }))}
              placeholder="10"
              className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-hidden focus:border-[#800020]"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-neutral-700 block">
            StartMessaging API Key {config?.apiKeyConfigured ? '(currently set — leave blank to keep it)' : ''}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={config?.apiKeyConfigured ? '••••••••••••••••••••' : 'sm_live_...'}
            autoComplete="new-password"
            className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:outline-hidden focus:border-[#800020]"
          />
          <p className="text-[11px] text-neutral-500">
            Stored securely on the server and never shown again after saving. Leave blank to keep the current key unchanged.
          </p>
        </div>

        <div className="pt-2 border-t border-neutral-100 space-y-4">
          <p className="text-[11px] text-neutral-500">
            Click a template below to assign it to Login, Register, or Verify Phone — or paste a Template ID directly into the fields underneath.
          </p>

          {templates.length > 0 && (
            <div className="space-y-2">
              {templates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  selectedFor={
                    form.templateLogin === t.id
                      ? 'Login'
                      : form.templateRegister === t.id
                        ? 'Register'
                        : form.templateVerifyPhone === t.id
                          ? 'Verify Phone'
                          : null
                  }
                  onAssign={(purpose) =>
                    setForm((f) => ({
                      ...f,
                      ...(purpose === 'Login' ? { templateLogin: t.id } : {}),
                      ...(purpose === 'Register' ? { templateRegister: t.id } : {}),
                      ...(purpose === 'Verify Phone' ? { templateVerifyPhone: t.id } : {}),
                    }))
                  }
                />
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 block">Login OTP Template ID</label>
              <input
                type="text"
                value={form.templateLogin}
                onChange={(e) => setForm((f) => ({ ...f, templateLogin: e.target.value }))}
                placeholder="e.g. 39beb731-de09-4..."
                className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:outline-hidden focus:border-[#800020]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 block">Register OTP Template ID</label>
              <input
                type="text"
                value={form.templateRegister}
                onChange={(e) => setForm((f) => ({ ...f, templateRegister: e.target.value }))}
                placeholder="e.g. 6990f1b1-6a28-4..."
                className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:outline-hidden focus:border-[#800020]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 block">Verify Phone OTP Template ID</label>
              <input
                type="text"
                value={form.templateVerifyPhone}
                onChange={(e) => setForm((f) => ({ ...f, templateVerifyPhone: e.target.value }))}
                placeholder="e.g. 3465e087-ff91-4..."
                className="w-full border border-neutral-300 rounded-xl px-3 py-2 text-xs font-mono text-neutral-900 focus:outline-hidden focus:border-[#800020]"
              />
            </div>
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
    </div>
  );
}

type OtpPurposeLabel = 'Login' | 'Register' | 'Verify Phone';
const PURPOSES: OtpPurposeLabel[] = ['Login', 'Register', 'Verify Phone'];

function TemplateCard({
  template,
  selectedFor,
  onAssign,
}: {
  template: OtpTemplateOptionDto;
  selectedFor: OtpPurposeLabel | null;
  onAssign: (purpose: OtpPurposeLabel) => void;
}) {
  return (
    <div className="border border-neutral-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <code className="text-[10px] text-neutral-400 block truncate">{template.id}</code>
        <p className="text-xs text-neutral-800 mt-0.5">{template.body}</p>
      </div>
      <div className="flex gap-1.5 shrink-0">
        {PURPOSES.map((purpose) => (
          <button
            key={purpose}
            type="button"
            onClick={() => onAssign(purpose)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
              selectedFor === purpose
                ? 'bg-[#800020] border-[#800020] text-white'
                : 'bg-white border-neutral-300 text-neutral-600 hover:border-[#800020] hover:text-[#800020]'
            }`}
          >
            {selectedFor === purpose ? `✓ ${purpose}` : purpose}
          </button>
        ))}
      </div>
    </div>
  );
}
