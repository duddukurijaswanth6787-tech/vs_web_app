'use client';

import { useState } from 'react';
import { useSettings, useUpdateSettings } from '@/features/storefront/storefront.hooks';
import { PageLoader, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { Button } from '@/components/forms/FormField';
import { getApiErrorMessage } from '@/utils/api-error';
import {
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Clock,
  Eye,
  RefreshCw,
  Phone,
  MessageCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import type { WebsiteSettings } from '@/features/storefront/storefront.types';

const HANAMKONDA_MESSAGE = `నమస్కారం! మేము ప్రస్తుతం హనుమకొండ లో జరుగుతున్న ప్రత్యేక ఎక్స్‌పో లో పాల్గొంటున్నాము. మా కలెక్షన్స్ & స్టాక్ మొత్తం ఎక్స్‌పో లో అందుబాటులో ఉన్నందున, వెబ్‌సైట్ ద్వారా ఆన్‌లైన్ ఆర్డర్లు రాబోయే 3 రోజుల పాటు తాత్కాలికంగా నిలిపివేయబడ్డాయి. సోమవారం (Monday) నుండి వెబ్‌సైట్ యధావిధిగా పనిచేస్తుంది.

Dear Valued Customers, we are currently exhibiting our exclusive collection at the Hanamkonda Expo for the next 3 days! To prevent inventory discrepancies with physical sales, online orders are temporarily paused. Our online store will resume full operations on Monday. Thank you!`;

const GENERAL_EXPO_MESSAGE = `We are currently exhibiting at a live fashion exhibition! Due to high physical sales, our online storefront and checkout are temporarily paused. We will reopen shortly with refreshed collections. For urgent orders, please contact our support team.`;

const MAINTENANCE_MESSAGE = `We are currently upgrading our boutique storefront and systems to serve you better. Online orders are temporarily paused and will resume shortly. Thank you for your patience!`;

const formDefaults = {
  maintenanceMode: false,
  maintenanceMessage: HANAMKONDA_MESSAGE,
  maintenanceStartTime: '',
  maintenanceEndTime: '',
  whitelistedIps: '',
  supportPhone: '',
  whatsappNumber: '',
  supportEmail: '',
};

type MaintenanceForm = typeof formDefaults;

const toDateInputVal = (val?: string) => {
  if (!val) return '';
  if (val.length >= 10 && val.includes('-')) return val.slice(0, 10);
  return val;
};

const fromSettings = (s: WebsiteSettings): MaintenanceForm => ({
  maintenanceMode: s.maintenanceMode ?? false,
  maintenanceMessage:
    s.storeDescription ||
    s.metaDescription ||
    (s as any).maintenanceMessage ||
    HANAMKONDA_MESSAGE,
  maintenanceStartTime: toDateInputVal(s.maintenanceStartTime),
  maintenanceEndTime: toDateInputVal(s.maintenanceEndTime),
  whitelistedIps: s.whitelistedIps ?? '',
  supportPhone: s.supportPhone ?? '',
  whatsappNumber: s.whatsappNumber ?? '',
  supportEmail: s.supportEmail ?? '',
});

export default function ExpoMaintenanceAdminPage() {
  const { data, isLoading } = useSettings();
  const updateMut = useUpdateSettings();
  const [form, setForm] = useState<MaintenanceForm>(formDefaults);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<'hanamkonda' | 'general' | 'maintenance' | 'custom'>('hanamkonda');

  const [prevSettings, setPrevSettings] = useState(data);
  if (data && data !== prevSettings) {
    setPrevSettings(data);
    setForm(fromSettings(data));
  }

  if (isLoading) return <PageLoader />;

  const handleApplyTemplate = (template: 'hanamkonda' | 'general' | 'maintenance' | 'custom') => {
    setSelectedTemplate(template);
    if (template === 'hanamkonda') {
      setForm((p) => ({
        ...p,
        maintenanceMessage: HANAMKONDA_MESSAGE,
      }));
    } else if (template === 'general') {
      setForm((p) => ({
        ...p,
        maintenanceMessage: GENERAL_EXPO_MESSAGE,
      }));
    } else if (template === 'maintenance') {
      setForm((p) => ({
        ...p,
        maintenanceMessage: MAINTENANCE_MESSAGE,
      }));
    }
  };

  const sanitizePayload = (formData: MaintenanceForm) => {
    return {
      maintenanceMode: formData.maintenanceMode,
      storeDescription: formData.maintenanceMessage,
      metaDescription: formData.maintenanceMessage,
      supportPhone: formData.supportPhone || undefined,
      whatsappNumber: formData.whatsappNumber || undefined,
      supportEmail: formData.supportEmail || undefined,
    };
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await updateMut.mutateAsync(sanitizePayload(form));
      setSuccess(
        form.maintenanceMode
          ? 'Expo & Site Lock Mode is now ACTIVE! Customers will see the Expo announcement screen.'
          : 'Expo & Site Lock Mode is DEACTIVATED. Storefront is now LIVE for all customers!'
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save settings'));
    }
  };

  const handleQuickToggle = async (targetState: boolean) => {
    setError(null);
    setSuccess(null);
    const updated = { ...form, maintenanceMode: targetState };
    setForm(updated);
    try {
      await updateMut.mutateAsync(sanitizePayload(updated));
      setSuccess(
        targetState
          ? 'Expo & Site Lock Mode ACTIVATED immediately!'
          : 'Expo & Site Lock Mode DEACTIVATED! Storefront is live.'
      );
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update toggle state'));
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white p-6 rounded-2xl border border-neutral-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full text-amber-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Expo & Storefront Lock Controller
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Expo & Temporary Site Lock Mode
          </h1>
          <p className="text-xs text-neutral-300 mt-1 max-w-xl leading-relaxed">
            Quickly pause the customer website during physical exhibitions (like Hanamkonda Expo) to prevent inventory collisions while you sell on-site.
          </p>
        </div>

        {/* Live Status Indicator & One-Click Quick Actions */}
        <div className="flex items-center gap-3">
          <div
            className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
              form.maintenanceMode
                ? 'bg-rose-950/70 border-rose-600/60 text-rose-300'
                : 'bg-emerald-950/70 border-emerald-600/60 text-emerald-300'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                form.maintenanceMode ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
              }`}
            />
            {form.maintenanceMode ? 'EXPO LOCK ACTIVE' : 'STOREFRONT LIVE'}
          </div>

          <button
            type="button"
            onClick={() => handleQuickToggle(!form.maintenanceMode)}
            disabled={updateMut.isPending}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
              form.maintenanceMode
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {form.maintenanceMode ? 'Reopen Storefront' : 'Activate Expo Lock'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700 font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          {success}
        </div>
      )}

      {/* 1-Click Preset Templates */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
              1-Click Preset Templates
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Select a pre-filled announcement template for the exhibition:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Template 1 */}
          <button
            type="button"
            onClick={() => handleApplyTemplate('hanamkonda')}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedTemplate === 'hanamkonda'
                ? 'border-amber-500 bg-amber-50/50 shadow-sm ring-2 ring-amber-500/20'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                🏛️ Hanamkonda Expo (3 Days)
              </span>
              <span className="text-[10px] font-semibold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 line-clamp-2">
              Pre-configured Telugu & English notice for Hanamkonda Expo with Monday reopening.
            </p>
          </button>

          {/* Template 2 */}
          <button
            type="button"
            onClick={() => handleApplyTemplate('general')}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedTemplate === 'general'
                ? 'border-amber-500 bg-amber-50/50 shadow-sm ring-2 ring-amber-500/20'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                🌟 General Exhibition / Fair
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 line-clamp-2">
              Standard notice for general pop-up exhibitions and lifestyle events.
            </p>
          </button>

          {/* Template 3 */}
          <button
            type="button"
            onClick={() => handleApplyTemplate('maintenance')}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedTemplate === 'maintenance'
                ? 'border-amber-500 bg-amber-50/50 shadow-sm ring-2 ring-amber-500/20'
                : 'border-neutral-200 hover:border-neutral-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                🛠️ Boutique Maintenance
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 line-clamp-2">
              Standard maintenance notice for catalogue refresh and inventory syncing.
            </p>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-6"
        >
          {/* Master Toggle Bar */}
          <div
            className="flex items-center justify-between p-4 rounded-xl border"
            style={{
              borderColor: form.maintenanceMode ? '#fca5a5' : '#e5e7eb',
              backgroundColor: form.maintenanceMode ? '#fef2f2' : '#fafafa',
            }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    form.maintenanceMode ? 'bg-red-500 animate-pulse' : 'bg-green-500'
                  }`}
                />
                <span className="text-sm font-bold text-neutral-900">
                  Global Storefront Lock Toggle
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {form.maintenanceMode
                  ? 'Active: All customer pages show the Expo screen. No online orders allowed.'
                  : 'Inactive: Storefront is live and open for orders.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, maintenanceMode: !p.maintenanceMode }))}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${
                form.maintenanceMode ? 'bg-red-500' : 'bg-neutral-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                  form.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Announcement Message Content */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                Announcement Message (Telugu & English Supported)
              </label>
              <textarea
                value={form.maintenanceMessage}
                onChange={(e) => setForm((p) => ({ ...p, maintenanceMessage: e.target.value }))}
                rows={7}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs leading-relaxed font-sans focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-hidden transition-all"
                placeholder="Enter announcement text to display to visitors..."
              />
              <p className="text-[10px] text-neutral-400 mt-1">
                Explain the expo details and why online ordering is temporarily paused.
              </p>
            </div>

            {/* Schedule (Optional Date Range) */}
            <div className="border-t border-neutral-100 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  Schedule Dates (Optional - Date Only)
                </h3>
                {(form.maintenanceStartTime || form.maintenanceEndTime) && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, maintenanceStartTime: '', maintenanceEndTime: '' }))
                    }
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 underline"
                  >
                    Clear Dates
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={form.maintenanceStartTime}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, maintenanceStartTime: e.target.value }))
                    }
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">
                    End / Reopen Date
                  </label>
                  <input
                    type="date"
                    value={form.maintenanceEndTime}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, maintenanceEndTime: e.target.value }))
                    }
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs font-sans"
                  />
                </div>
              </div>
              <p className="text-[10px] text-neutral-400">
                Time is not required. You can pick only dates or simply use the master toggle above.
              </p>
            </div>

            {/* Contact Information */}
            <div className="border-t border-neutral-100 pt-4 space-y-3">
              <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-neutral-500" />
                Emergency / Expo Inquiries Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={form.whatsappNumber}
                    onChange={(e) => setForm((p) => ({ ...p, whatsappNumber: e.target.value }))}
                    placeholder="+91 99999 99999"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">
                    Support Phone
                  </label>
                  <input
                    type="text"
                    value={form.supportPhone}
                    onChange={(e) => setForm((p) => ({ ...p, supportPhone: e.target.value }))}
                    placeholder="+91 99999 99999"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
            <Button type="submit" disabled={updateMut.isPending} className="bg-neutral-900 text-white text-xs px-6 py-2.5 rounded-xl font-bold">
              <ButtonLoader />
              <Save className="w-4 h-4 mr-1.5" />
              Save & Apply Settings
            </Button>
          </div>
        </form>

        {/* Right Column: Live Customer Preview */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-neutral-500" />
              Live Visitor Screen Preview
            </h3>
            <span className="text-[10px] text-neutral-400">Exact Customer View</span>
          </div>

          {/* Mini Device Frame */}
          <div className="bg-[#11050A] border-4 border-neutral-800 rounded-3xl p-4 text-white shadow-2xl space-y-4 text-center font-sans overflow-hidden relative">
            {/* Ambient subtle glow */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-rose-900/40 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
              <div className="text-left">
                <p className="text-xs font-serif font-bold text-amber-100">
                  {data?.storeName || "Vasanthi's Signature"}
                </p>
                <p className="text-[8px] text-amber-400 uppercase tracking-widest">
                  Designer Boutique
                </p>
              </div>
              <span className="text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                EXPO LIVE
              </span>
            </div>

            {/* Badge */}
            <div className="relative z-10 inline-flex items-center gap-1 bg-amber-500/15 border border-amber-400/30 px-3 py-1 rounded-full text-[10px] text-amber-200">
              <MapPin className="w-3 h-3 text-amber-400" />
              <span>Hanamkonda Expo</span>
            </div>

            {/* Title */}
            <div className="relative z-10 space-y-1">
              <h4 className="text-sm font-serif font-bold text-white">
                We Are Live at the Expo!
              </h4>
              <p className="text-[11px] text-amber-200/90 font-serif">
                హనుమకొండ ఎక్స్‌పో లో ఉన్నాము!
              </p>
            </div>

            {/* Message Preview Box */}
            <div className="relative z-10 bg-black/40 border border-white/10 rounded-xl p-3 text-[10px] text-neutral-200 text-left leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line">
              {form.maintenanceMessage || HANAMKONDA_MESSAGE}
            </div>

            {/* Reopening indicator */}
            <div className="relative z-10 bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center gap-2 text-left">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-[8px] uppercase font-bold text-neutral-400">Reopening</p>
                <p className="text-[10px] font-semibold text-white">Monday (సోమవారం)</p>
              </div>
            </div>

            {/* Action buttons preview */}
            <div className="relative z-10 pt-1 flex flex-col gap-2">
              <div className="w-full bg-emerald-600 text-white text-[10px] font-bold py-2 rounded-lg flex items-center justify-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                Chat on WhatsApp
              </div>
              <div className="w-full bg-white/10 border border-white/20 text-white text-[10px] font-bold py-2 rounded-lg flex items-center justify-center gap-1.5">
                <Phone className="w-3 h-3 text-amber-400" />
                Call Support
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
