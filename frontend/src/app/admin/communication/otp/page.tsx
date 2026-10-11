'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  KeyRound,
  Save,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  Phone,
  User,
  UserCheck,
  UserX,
  Clock,
  Search,
  Filter,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  XCircle,
  TrendingUp,
  Activity,
  Sliders,
} from 'lucide-react';
import {
  adminOpsApi,
  OtpGatewayConfigDto,
  OtpTemplateOptionDto,
  OtpAdminLogItem,
} from '@/features/admin-ops/admin-ops.api';
import { useToast } from '@/components/toast/ToastProvider';
import { getApiErrorMessage } from '@/utils/api-error';

const EMPTY_FORM: Omit<OtpGatewayConfigDto, 'apiKeyConfigured'> = {
  provider: 'mock',
  appName: '',
  templateLogin: '',
  templateRegister: '',
  templateVerifyPhone: '',
  templateOrderConfirmed: '',
  expiryMinutes: 10,
};

export default function OtpGatewayAdminPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'tracker' | 'gateway'>('tracker');
  const [form, setForm] = useState(EMPTY_FORM);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  // Tracker Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [purposeFilter, setPurposeFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  // Queries
  const { data: config, refetch: refetchConfig } = useQuery({
    queryKey: ['admin', 'otp-gateway', 'config'],
    queryFn: () => adminOpsApi.getOtpGatewayConfig(),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['admin', 'otp-gateway', 'templates'],
    queryFn: () => adminOpsApi.getOtpTemplates(),
  });

  const {
    data: logsData,
    refetch: refetchLogs,
    isLoading: isLoadingLogs,
    isFetching: isFetchingLogs,
  } = useQuery({
    queryKey: ['admin', 'otp-logs', page, searchTerm, statusFilter, purposeFilter],
    queryFn: () =>
      adminOpsApi.getOtpAdminLogs({
        page,
        limit: 20,
        search: searchTerm,
        status: statusFilter,
        purpose: purposeFilter,
      }),
    refetchInterval: 15000, // Auto-refresh every 15s for live OTP activity
  });

  useEffect(() => {
    if (config) {
      setForm({
        provider: config.provider,
        appName: config.appName,
        templateLogin: config.templateLogin,
        templateRegister: config.templateRegister,
        templateVerifyPhone: config.templateVerifyPhone,
        templateOrderConfirmed: config.templateOrderConfirmed,
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
      await refetchConfig();
    } catch (err) {
      toast('error', 'Save failed', getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const apiKeyConfigured = config?.apiKeyConfigured ?? false;
  const stats = logsData?.stats || {
    total: 0,
    verified: 0,
    abandoned: 0,
    pending: 0,
    conversionRate: 0,
  };

  const getStatusBadge = (status: OtpAdminLogItem['status']) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Logged In
          </span>
        );
      case 'ABANDONED':
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
            <UserX className="h-3.5 w-3.5 text-rose-600" />
            Dropped Off
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            In Progress
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getRelativeTime = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-neutral-900 flex items-center gap-2.5">
            <KeyRound className="w-6 h-6 text-[#0284c7]" />
            <span>OTP & Login Activity Center</span>
          </h1>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            Real-time tracking of phone number logins, completed verifications, and dropped-off users.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'tracker') refetchLogs();
              else refetchConfig();
            }}
            disabled={isFetchingLogs}
            className="p-2.5 border border-neutral-300 rounded-xl hover:bg-neutral-50 text-neutral-700 flex items-center gap-1.5 text-xs font-bold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-neutral-500 ${isFetchingLogs ? 'animate-spin text-[#0284c7]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-neutral-200 gap-8">
        <button
          type="button"
          onClick={() => setActiveTab('tracker')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all relative ${
            activeTab === 'tracker'
              ? 'text-[#0284c7] border-b-2 border-[#0284c7]'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Live OTP & Drop-off Tracker</span>
          <span className="rounded-full bg-sky-100 text-[#0284c7] px-2 py-0.5 text-[11px] font-black">
            {stats.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gateway')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-all relative ${
            activeTab === 'gateway'
              ? 'text-[#0284c7] border-b-2 border-[#0284c7]'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Gateway Settings (StartMessaging)</span>
          {apiKeyConfigured ? (
            <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-black">
              ACTIVE
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-black">
              NOT SET
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: LIVE OTP & DROP-OFF TRACKER */}
      {activeTab === 'tracker' && (
        <div className="space-y-6">
          
          {/* Real-time KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total OTPs Sent</span>
                <div className="rounded-xl bg-sky-50 p-2.5 text-[#0284c7]">
                  <Phone className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-neutral-900">{stats.total}</p>
              <p className="mt-1 text-xs text-neutral-400">All authentication attempts</p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Completed Logins</span>
                <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                  <UserCheck className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-emerald-700">{stats.verified}</p>
              <p className="mt-1 text-xs text-emerald-600 font-medium">
                {stats.conversionRate}% Login Conversion Rate
              </p>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50/30 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Dropped Off (Abandoned)</span>
                <div className="rounded-xl bg-rose-100 p-2.5 text-rose-700">
                  <UserX className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-rose-700">{stats.abandoned}</p>
              <p className="mt-1 text-xs text-rose-600 font-medium">Entered phone but left without logging in</p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Active In Progress</span>
                <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-amber-700">{stats.pending}</p>
              <p className="mt-1 text-xs text-amber-600 font-medium">Within 10-minute expiry window</p>
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by phone number or customer name..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:border-[#0284c7]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-700 focus:outline-none focus:border-[#0284c7]"
              >
                <option value="ALL">All Statuses</option>
                <option value="VERIFIED">🟢 Logged In / Verified</option>
                <option value="ABANDONED">🔴 Dropped Off (Abandoned)</option>
                <option value="PENDING">🟡 In Progress</option>
              </select>

              <select
                value={purposeFilter}
                onChange={(e) => {
                  setPurposeFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs rounded-xl border border-neutral-200 bg-white px-3 py-2 text-neutral-700 focus:outline-none focus:border-[#0284c7]"
              >
                <option value="ALL">All Purposes</option>
                <option value="LOGIN">Login</option>
                <option value="REGISTER">Register</option>
                <option value="VERIFY_PHONE">Verify Phone</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">User & Mobile Number</th>
                    <th className="py-3.5 px-4">Purpose</th>
                    <th className="py-3.5 px-4">Login Status</th>
                    <th className="py-3.5 px-4">Attempts</th>
                    <th className="py-3.5 px-4">Requested At</th>
                    <th className="py-3.5 px-4">Actions & Recovery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {isLoadingLogs ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-neutral-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#0284c7] mb-2" />
                        Loading live OTP activity logs...
                      </td>
                    </tr>
                  ) : logsData?.items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-neutral-400">
                        <Phone className="h-8 w-8 mx-auto text-neutral-300 mb-2" />
                        No OTP attempts found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    logsData?.items.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                        
                        {/* User & Mobile */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                              {item.name ? item.name.charAt(0) : <Phone className="h-4 w-4 text-slate-500" />}
                            </div>
                            <div>
                              <p className="font-bold text-neutral-900 flex items-center gap-1.5">
                                {item.name || 'Visitor / Guest'}
                                {item.user && (
                                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                                    Customer
                                  </span>
                                )}
                              </p>
                              <a
                                href={`tel:+91${item.phone}`}
                                className="font-mono text-neutral-500 hover:text-[#0284c7] transition-colors"
                              >
                                +91 {item.phone}
                              </a>
                            </div>
                          </div>
                        </td>

                        {/* Purpose */}
                        <td className="py-3.5 px-4">
                          <span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-600">
                            {item.purpose}
                          </span>
                        </td>

                        {/* Login Status */}
                        <td className="py-3.5 px-4">
                          <div>
                            {getStatusBadge(item.status)}
                            {item.verifiedAt && (
                              <p className="text-[10px] text-neutral-400 mt-1">
                                Verified in {Math.max(1, Math.round((new Date(item.verifiedAt).getTime() - new Date(item.createdAt).getTime()) / 1000))}s
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Attempts */}
                        <td className="py-3.5 px-4 text-neutral-600 font-mono">
                          {item.attempts} / {item.maxAttempts}
                        </td>

                        {/* Requested At */}
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-neutral-700">{getRelativeTime(item.createdAt)}</p>
                          <p className="text-[10px] text-neutral-400">{formatDate(item.createdAt)}</p>
                        </td>

                        {/* Actions & Recovery */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {/* WhatsApp Follow-up */}
                            <a
                              href={`https://wa.me/91${item.phone}?text=Hello!%20We%20noticed%20you%20were%20trying%20to%20log%20in%20to%20Vasanthi's%20Signature.%20How%20can%20we%20assist%20you?`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-2xs transition-colors"
                              title="Message customer on WhatsApp"
                            >
                              <MessageSquare className="h-3 w-3" />
                              WhatsApp
                            </a>

                            {/* View Customer Profile */}
                            {item.user ? (
                              <Link
                                href={`/admin/customers/${item.user.id}`}
                                className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 px-2 py-1 text-[11px] font-semibold transition-colors"
                              >
                                View
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            ) : null}
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {logsData && logsData.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 bg-neutral-50/40 text-xs">
                <span className="text-neutral-500">
                  Showing Page {logsData.page} of {logsData.totalPages} ({logsData.total} total logs)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-lg border border-neutral-200 bg-white disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= logsData.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 rounded-lg border border-neutral-200 bg-white disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GATEWAY CONFIGURATION */}
      {activeTab === 'gateway' && (
        <div className="space-y-6">
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

          <form onSubmit={handleSave} className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-6 shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">Provider</label>
                <select
                  value={form.provider}
                  onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value as 'mock' | 'startmessaging' }))}
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-xl focus:border-[#0284c7] focus:outline-none"
                >
                  <option value="startmessaging">StartMessaging (Real SMS via API)</option>
                  <option value="mock">Mock (Development / No Real SMS)</option>
                </select>
                <p className="text-[10px] text-neutral-500">
                  Switch to StartMessaging for live customer SMS delivery.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">App Name (Substituted in Templates)</label>
                <input
                  type="text"
                  value={form.appName}
                  onChange={(e) => setForm((f) => ({ ...f, appName: e.target.value }))}
                  placeholder="Vasanthi's Signature"
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-xl focus:border-[#0284c7] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">StartMessaging API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={apiKeyConfigured ? '•••••••••••••••• (Leave blank to keep existing)' : 'Enter API Key (sm_live_...)'}
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-xl focus:border-[#0284c7] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">OTP Validity (Minutes)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={form.expiryMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, expiryMinutes: Number(e.target.value) || 10 }))}
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-xl focus:border-[#0284c7] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">Template ID (Login OTP)</label>
                <input
                  type="text"
                  value={form.templateLogin}
                  onChange={(e) => setForm((f) => ({ ...f, templateLogin: e.target.value }))}
                  placeholder="e.g. 39beb731-de09-4a1d-bbbf-3cc9a12936f9"
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-xl focus:border-[#0284c7] focus:outline-none font-mono text-[11px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">Template ID (Register OTP)</label>
                <input
                  type="text"
                  value={form.templateRegister}
                  onChange={(e) => setForm((f) => ({ ...f, templateRegister: e.target.value }))}
                  placeholder="e.g. 3465e087-ff91-4e9a-a33c-e571ec5fae45"
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-xl focus:border-[#0284c7] focus:outline-none font-mono text-[11px]"
                />
              </div>

            </div>

            <div className="pt-4 border-t border-neutral-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0284c7] hover:bg-[#0B3B78] text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
