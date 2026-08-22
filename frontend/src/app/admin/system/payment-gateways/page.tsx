'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Key, ShieldCheck, CheckCircle2, AlertCircle, Save, Lock, Eye, EyeOff, RefreshCw, Globe, HelpCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/utils/api-error';
import { apiClient } from '@/lib/api/client';
export default function PaymentGatewaysPage() {
  const { user } = useAuth();
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const [keySecretConfigured, setKeySecretConfigured] = useState(false);
  const [webhookSecretConfigured, setWebhookSecretConfigured] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchConfig = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.get('/payments/config');
      const data = res.data;
      const config = data.data || data;
      setKeyId(config.keyId || '');
      setKeySecretConfigured(Boolean(config.keySecretConfigured));
      setWebhookSecretConfigured(Boolean(config.webhookSecretConfigured));
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Failed to load gateway config'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload: Record<string, string> = {};
      if (keyId.trim()) payload.keyId = keyId.trim();
      if (keySecret.trim()) payload.keySecret = keySecret.trim();
      if (webhookSecret.trim()) payload.webhookSecret = webhookSecret.trim();

      await apiClient.patch('/payments/config', payload);

      setSuccessMsg('Razorpay API Keys and Webhook Secret saved successfully in database!');
      setKeySecret('');
      setWebhookSecret('');
      fetchConfig();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Failed to save gateway config'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 font-sans text-neutral-900">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0284c7] to-[#0369a1] rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sky-100 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" /> Super Admin Security Settings
          </div>
          <h1 className="text-2xl font-bold font-serif">Razorpay API Keys & Webhooks Configuration</h1>
          <p className="text-xs text-sky-100/90 max-w-2xl">
            Manage your live Razorpay Key ID, Key Secret, and Webhook Secret dynamically. Database credentials override default environment variables automatically without requiring app redeployments.
          </p>
        </div>

        <button
          onClick={fetchConfig}
          disabled={loading}
          className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Config</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl shadow-2xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-2xl shadow-2xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSave} className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Razorpay Payment Gateway Credentials</h2>
              <p className="text-xs text-neutral-500">Configure public Key ID, private Key Secret, and Webhook verification secret</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-2xs font-bold">
            <span className={`px-2.5 py-1 rounded-full ${keyId ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              {keyId ? '● GATEWAY CONFIGURED' : '○ KEYS NEEDED'}
            </span>
          </div>
        </div>

        {/* Fields Grid */}
        <div className="space-y-4">
          {/* Razorpay Key ID */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Razorpay Key ID (Public Key)
            </label>
            <div className="relative">
              <input
                type="text"
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
                placeholder="rzp_live_xxxxxxxxxxxxxx"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-2.5 text-xs text-neutral-900 font-mono focus:outline-none focus:border-sky-500 focus:bg-white transition"
              />
              <Key className="w-4 h-4 text-neutral-400 absolute right-4 top-3" />
            </div>
            <p className="text-[11px] text-neutral-400">Safe to pass to client browser during Razorpay popup modal initialization.</p>
          </div>

          {/* Razorpay Key Secret */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Razorpay Key Secret (Private Secret)
              </label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${keySecretConfigured ? 'text-emerald-700 bg-emerald-50' : 'text-neutral-500 bg-neutral-100'}`}>
                {keySecretConfigured ? '✔ SECRET CONFIGURED IN DB' : 'NOT SET'}
              </span>
            </div>
            <div className="relative">
              <input
                type={showKeySecret ? 'text' : 'password'}
                value={keySecret}
                onChange={(e) => setKeySecret(e.target.value)}
                placeholder={keySecretConfigured ? '•••••••••••••••••••• (Leave blank to keep existing)' : 'Enter Razorpay Key Secret'}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-2.5 text-xs text-neutral-900 font-mono focus:outline-none focus:border-sky-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowKeySecret(!showKeySecret)}
                className="absolute right-4 top-3 text-neutral-400 hover:text-neutral-600"
              >
                {showKeySecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-neutral-400">Never exposed to client; used strictly by NestJS backend for order creation and capture verification.</p>
          </div>

          {/* Razorpay Webhook Secret */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Razorpay Webhook Secret (x-razorpay-signature validation)
              </label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${webhookSecretConfigured ? 'text-emerald-700 bg-emerald-50' : 'text-neutral-500 bg-neutral-100'}`}>
                {webhookSecretConfigured ? '✔ WEBHOOK SECRET CONFIGURED' : 'NOT SET'}
              </span>
            </div>
            <div className="relative">
              <input
                type={showWebhookSecret ? 'text' : 'password'}
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder={webhookSecretConfigured ? '•••••••••••••••••••• (Leave blank to keep existing)' : 'Enter Webhook Secret'}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-2.5 text-xs text-neutral-900 font-mono focus:outline-none focus:border-sky-500 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                className="absolute right-4 top-3 text-neutral-400 hover:text-neutral-600"
              >
                {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-neutral-400">
              Webhook Endpoint URL to paste in Razorpay Dashboard: <code className="bg-neutral-100 px-2 py-0.5 rounded text-neutral-800 font-mono text-[10px]">https://api.vsboutique.shop/api/v1/payments/webhook</code>
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold px-6 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Payment Credentials</span>
          </button>
        </div>
      </form>
    </div>
  );
}
