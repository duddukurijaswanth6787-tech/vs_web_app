'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Send,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Server,
  Key,
  Globe,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Cloud,
  Sparkles,
} from 'lucide-react';
import { adminOpsApi, EmailConfigDto } from '@/features/admin-ops/admin-ops.api';
import { useToast } from '@/components/toast/ToastProvider';
import { getApiErrorMessage } from '@/utils/api-error';

const PROVIDER_PRESETS = [
  {
    id: 'AMAZON_SES',
    name: 'Amazon SES (AWS)',
    host: 'email-smtp.ap-south-1.amazonaws.com',
    port: 587,
    secure: false,
    description: 'Ultra-low cost high-deliverability enterprise email for India & global',
    badge: 'Recommended for High Volume',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    id: 'SENDGRID',
    name: 'Twilio SendGrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    user: 'apikey',
    description: 'Fast cloud SMTP relay with rich delivery tracking & template support',
    badge: 'Fastest 1-Min Setup',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  {
    id: 'ZOHO',
    name: 'Zoho Mail / Workspace',
    host: 'smtp.zoho.in',
    port: 465,
    secure: true,
    description: 'Custom domain business email for Indian enterprises',
    badge: 'Indian Workspace',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 'CUSTOM',
    name: 'Custom SMTP Server',
    host: '',
    port: 587,
    secure: false,
    description: 'Connect any custom SMTP relay, Postfix, or cloud gateway',
    badge: 'Self-Hosted / Generic',
    badgeColor: 'bg-neutral-100 text-neutral-800 border-neutral-200',
  },
];

export default function TransactionalEmailAdminPage() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    enabled: true,
    provider: 'AMAZON_SES',
    smtpHost: 'email-smtp.ap-south-1.amazonaws.com',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPassword: '',
    fromAddress: 'orders@vasanthissignature.in',
    fromName: "Vasanthi's Signature",
    enableOrderConfirmation: true,
    enableInvoicePdf: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch current config
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ['admin', 'email', 'config'],
    queryFn: () => adminOpsApi.getEmailConfig(),
  });

  // Fetch email logs
  const { data: logsData, isLoading: logsLoading, refetch: reloadLogs } = useQuery({
    queryKey: ['admin', 'email', 'logs'],
    queryFn: () => adminOpsApi.emailLogs(1, 30),
  });

  useEffect(() => {
    if (configData) {
      setForm((prev) => ({
        ...prev,
        enabled: configData.enabled ?? true,
        provider: configData.provider || 'AMAZON_SES',
        smtpHost: configData.smtpHost || 'email-smtp.ap-south-1.amazonaws.com',
        smtpPort: configData.smtpPort || 587,
        smtpSecure: configData.smtpSecure ?? false,
        smtpUser: configData.smtpUser || '',
        fromAddress: configData.fromAddress || 'orders@vasanthissignature.in',
        fromName: configData.fromName || "Vasanthi's Signature",
        enableOrderConfirmation: configData.enableOrderConfirmation ?? true,
        enableInvoicePdf: configData.enableInvoicePdf ?? true,
      }));
    }
  }, [configData]);

  // Update Config Mutation
  const updateMutation = useMutation({
    mutationFn: (payload: any) => adminOpsApi.updateEmailConfig(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'email', 'config'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
      toast('success', 'Email Config Saved', 'Transactional email settings updated successfully.');
    },
    onError: (err) => {
      toast('error', 'Save Failed', getApiErrorMessage(err));
    },
  });

  const handleApplyPreset = (preset: typeof PROVIDER_PRESETS[0]) => {
    setForm((prev) => ({
      ...prev,
      provider: preset.id,
      smtpHost: preset.host || prev.smtpHost,
      smtpPort: preset.port,
      smtpSecure: preset.secure,
      smtpUser: (preset as any).user || prev.smtpUser,
    }));
    toast('info', `${preset.name} Selected`, 'Host & port preset applied. Please fill in your API credentials.');
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) {
      toast('warning', 'Recipient Required', 'Enter an email address to send the test message.');
      return;
    }
    setTestLoading(true);
    try {
      await adminOpsApi.sendTestEmail({ to: testEmail.trim() });
      toast('success', 'Test Email Sent!', `A branded test email was dispatched to ${testEmail}.`);
      await reloadLogs();
    } catch (err) {
      toast('error', 'Test Send Failed', getApiErrorMessage(err));
    } finally {
      setTestLoading(false);
    }
  };

  const logs = logsData?.data || [];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto font-sans text-neutral-900">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#500014] rounded-3xl p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-sky-200 text-xs font-bold uppercase tracking-wider">
            <Mail className="w-4 h-4" /> Branded Transactional Email & PDF Invoices
          </div>
          <h1 className="text-2xl font-bold font-serif">Amazon SES / SendGrid Domain Gateway</h1>
          <p className="text-xs text-sky-100/90 leading-relaxed">
            Configure automated order confirmation emails, branded Tax Invoices (PDF/HTML), customer welcome emails, and password resets from your custom domain (e.g. <span className="font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded">orders@vasanthissignature.in</span>).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void reloadLogs()}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Transactional email settings successfully saved to database. Live sender is active!</span>
        </div>
      )}

      {/* QUICK PRESETS */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-700">
          <Sparkles className="w-3.5 h-3.5 text-[#0284c7]" /> 1-Click Provider Quick Presets
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PROVIDER_PRESETS.map((preset) => {
            const isSelected = form.provider === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'border-[#0284c7] bg-sky-50/50 ring-2 ring-[#0284c7]/20 shadow-xs'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-neutral-900">{preset.name}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${preset.badgeColor}`}>
                    {preset.badge}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 leading-tight">{preset.description}</p>
                {preset.host && (
                  <div className="text-[10px] font-mono text-neutral-400 truncate">
                    Host: {preset.host}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: CONFIGURATION FORM (8 COLS) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xs space-y-6">
          <form onSubmit={handleSaveConfig} className="space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#0284c7]" />
                <h2 className="font-bold text-sm text-neutral-900 font-serif">SMTP & Sender Credentials</h2>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-700">
                <span>Master Email System:</span>
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                  className="w-4 h-4 accent-[#0284c7] rounded cursor-pointer"
                />
                <span className={form.enabled ? 'text-emerald-600' : 'text-neutral-400'}>
                  {form.enabled ? 'ENABLED' : 'DISABLED'}
                </span>
              </label>
            </div>

            {/* SENDER IDENTITY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-neutral-400" /> From Email Address *
                </span>
                <input
                  required
                  type="email"
                  placeholder="orders@vasanthissignature.in"
                  value={form.fromAddress}
                  onChange={(e) => setForm({ ...form, fromAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-50/50 border border-neutral-200 rounded-xl text-xs font-mono outline-none focus:border-[#0284c7] focus:bg-white"
                />
                <span className="text-[10px] text-neutral-400">Must be a verified identity in SES or SendGrid</span>
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-neutral-700">From Sender Name *</span>
                <input
                  required
                  type="text"
                  placeholder="Vasanthi's Signature"
                  value={form.fromName}
                  onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-50/50 border border-neutral-200 rounded-xl text-xs outline-none focus:border-[#0284c7] focus:bg-white"
                />
              </label>
            </div>

            {/* SMTP HOST & PORT */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="sm:col-span-2 block space-y-1">
                <span className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-neutral-400" /> SMTP Host Server *
                </span>
                <input
                  required
                  type="text"
                  placeholder="email-smtp.ap-south-1.amazonaws.com"
                  value={form.smtpHost}
                  onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-50/50 border border-neutral-200 rounded-xl text-xs font-mono outline-none focus:border-[#0284c7] focus:bg-white"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-neutral-700">Port *</span>
                  <input
                    required
                    type="number"
                    value={form.smtpPort}
                    onChange={(e) => setForm({ ...form, smtpPort: parseInt(e.target.value, 10) || 587 })}
                    className="w-full px-3 py-2.5 bg-neutral-50/50 border border-neutral-200 rounded-xl text-xs font-mono outline-none focus:border-[#0284c7] focus:bg-white"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-neutral-700">SSL/TLS</span>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, smtpSecure: !form.smtpSecure })}
                    className={`w-full py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      form.smtpSecure ? 'bg-sky-50 border-sky-300 text-sky-800' : 'bg-neutral-100 border-neutral-200 text-neutral-600'
                    }`}
                  >
                    {form.smtpSecure ? 'SSL (465)' : 'STARTTLS (587)'}
                  </button>
                </label>
              </div>
            </div>

            {/* AUTHENTICATION USERNAME & PASSWORD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-neutral-400" /> SMTP Username / IAM Access Key ID
                </span>
                <input
                  type="text"
                  placeholder="e.g. AKIAIOSFODNN7EXAMPLE or apikey"
                  value={form.smtpUser}
                  onChange={(e) => setForm({ ...form, smtpUser: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-50/50 border border-neutral-200 rounded-xl text-xs font-mono outline-none focus:border-[#0284c7] focus:bg-white"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-neutral-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-neutral-400" /> SMTP Password / Secret API Key
                  </span>
                  {configData?.hasPassword && (
                    <span className="text-[10px] text-emerald-600 font-bold">● Password Set</span>
                  )}
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={configData?.hasPassword ? '•••••••••••••••• (Leave blank to keep unchanged)' : 'Enter Secret Key / SendGrid API Key'}
                    value={form.smtpPassword}
                    onChange={(e) => setForm({ ...form, smtpPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 pr-10 bg-neutral-50/50 border border-neutral-200 rounded-xl text-xs font-mono outline-none focus:border-[#0284c7] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>
            </div>

            {/* AUTOMATION TOGGLES */}
            <div className="pt-3 border-t border-neutral-100 space-y-2">
              <span className="text-xs font-bold text-neutral-900 block">Automated Transactional Triggers</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enableOrderConfirmation}
                    onChange={(e) => setForm({ ...form, enableOrderConfirmation: e.target.checked })}
                    className="mt-0.5 accent-[#0284c7] rounded cursor-pointer"
                  />
                  <div className="space-y-0.5 text-xs">
                    <span className="font-bold text-neutral-900 block">Order Confirmation Email</span>
                    <span className="text-[11px] text-neutral-500">Auto-dispatches upon payment or COD checkout</span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.enableInvoicePdf}
                    onChange={(e) => setForm({ ...form, enableInvoicePdf: e.target.checked })}
                    className="mt-0.5 accent-[#0284c7] rounded cursor-pointer"
                  />
                  <div className="space-y-0.5 text-xs">
                    <span className="font-bold text-neutral-900 block">Tax Invoice Link & Breakdown</span>
                    <span className="text-[11px] text-neutral-500">Includes GST breakdown & instant invoice view</span>
                  </div>
                </label>
              </div>
            </div>

            {/* SAVE BUTTON */}
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{updateMutation.isPending ? 'Saving Settings...' : 'Save & Activate Email Configuration'}</span>
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: TEST EMAIL & CONNECTION STATUS (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          {/* SEND TEST EMAIL CARD */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
              <Send className="w-4 h-4 text-[#0284c7]" />
              <h3 className="font-bold text-sm text-neutral-900 font-serif">Verify SMTP Gateway</h3>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Send a real test email with full brand styling to any inbox to verify that Amazon SES / SendGrid authentication is working.
            </p>

            <form onSubmit={handleSendTest} className="space-y-3">
              <label className="block space-y-1">
                <span className="text-[11px] font-semibold text-neutral-700">Recipient Email</span>
                <input
                  required
                  type="email"
                  placeholder="e.g. admin@vasanthissignature.in"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-50/50 border border-neutral-200 rounded-xl text-xs outline-none focus:border-[#0284c7] focus:bg-white"
                />
              </label>

              <button
                type="submit"
                disabled={testLoading || !testEmail.trim()}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testLoading ? 'Dispatching...' : 'Send Live Test Email'}</span>
              </button>
            </form>
          </div>

          {/* SETUP INSTRUCTIONS GUIDE */}
          <div className="bg-sky-50/60 border border-sky-200 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-sky-900 font-bold text-xs">
              <Cloud className="w-4 h-4 text-[#0284c7]" />
              <span>Amazon SES & SendGrid Tips</span>
            </div>
            <ul className="text-[11px] text-sky-900/80 space-y-1.5 list-disc pl-4 leading-relaxed">
              <li>
                <strong>Amazon SES:</strong> Verify your domain <span className="font-mono">vasanthissignature.in</span> in AWS SES console (DKIM & MX records).
              </li>
              <li>
                <strong>SendGrid:</strong> Use Username <span className="font-mono">apikey</span> and paste your generated SG API Key as Password.
              </li>
              <li>
                <strong>Zoho/Gmail:</strong> Use an App-Specific Password rather than your account login password.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* RECENT EMAIL AUDIT LOGS */}
      <div className="bg-white rounded-3xl p-6 border border-neutral-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#0284c7]" />
            <h3 className="font-bold text-sm text-neutral-900 font-serif">Transactional Email Audit History</h3>
          </div>
          <span className="text-xs text-neutral-500 font-medium">
            Total Logged: <strong className="text-neutral-900">{logsData?.meta?.total ?? logs.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200/80 text-neutral-500 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Date / Time</th>
                <th className="py-2.5 px-3">Recipient</th>
                <th className="py-2.5 px-3">Template</th>
                <th className="py-2.5 px-3">Subject</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Message ID / Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-400 text-xs">
                    No transactional emails logged yet. Click "Send Live Test Email" above to test.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-3 text-neutral-500 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 font-semibold text-neutral-900">{log.toEmail}</td>
                    <td className="py-3 px-3 font-mono text-[10px]">
                      <span className="bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md">
                        {log.template}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-neutral-700 max-w-xs truncate">{log.subject}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-bold text-[10px] px-2 py-0.5 rounded-md uppercase ${
                          log.status === 'SENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'MOCK_SENT'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[10px] text-neutral-400 max-w-xs truncate">
                      {log.providerRef || log.error || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
