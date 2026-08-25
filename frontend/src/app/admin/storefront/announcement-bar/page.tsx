'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSettings, useCreateSetting, useUpdateSetting } from '@/features/settings/settings.hooks';
import { PageLoader, ButtonLoader } from '@/components/feedback/FeedbackStates';
import {
  Megaphone,
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Smartphone,
  Monitor,
  Palette,
  Type,
  Link2,
} from 'lucide-react';

const COLOR_PRESETS = [
  { name: 'Signature Maroon', bg: '#0284c7', text: '#FFFFFF' },
  { name: 'Royal Gold', bg: '#D4AF37', text: '#0A0A0A' },
  { name: 'Midnight Black', bg: '#171717', text: '#F59E0B' },
  { name: 'Deep Navy', bg: '#0F2C59', text: '#FFFFFF' },
  { name: 'Emerald Green', bg: '#064E3B', text: '#A7F3D0' },
  { name: 'Rose Velvet', bg: '#9F1239', text: '#FFE4E6' },
];

const ANNOUNCEMENT_PRESETS = [
  { text: 'Festive Sale is Live! Get up to 30% OFF', linkText: 'Shop Now →', link: '/offers' },
  { text: 'We Are coming with a new and different types of dresses and frocks', linkText: 'Explore →', link: '/collections' },
  { text: '✨ Free Shipping on all Prepaid Orders across India!', linkText: 'View Collections →', link: '/catalog/products' },
  { text: '🔥 Flash Sale: Extra 15% OFF on Ethnic Wear — Use Code: FESTIVE15', linkText: 'Claim Discount →', link: '/promotions/offers' },
  { text: 'NEW ARRIVALS: Exclusive Festive & Wedding Collection Out Now!', linkText: 'Shop New →', link: '/catalog/products?sort=newest' },
];

export default function AnnouncementBarAdminPage() {
  const { data: allSettingsData, isLoading, refetch } = useSettings({ limit: 500 });
  const createSettingMut = useCreateSetting();
  const updateSettingMut = useUpdateSetting();

  const settingsList = allSettingsData?.data || [];
  const announcementEnabledSetting = settingsList.find((s) => s.key === 'announcement_bar_enabled');
  const mobileAnnouncementSetting = settingsList.find((s) => s.key === 'announcement_bar_mobile_enabled');
  const announcementTextSetting = settingsList.find((s) => s.key === 'announcement_bar_text');
  const announcementLinkSetting = settingsList.find((s) => s.key === 'announcement_bar_link');
  const announcementLinkTextSetting = settingsList.find((s) => s.key === 'announcement_bar_link_text');
  const announcementBgColorSetting = settingsList.find((s) => s.key === 'announcement_bar_bg_color');
  const announcementTextColorSetting = settingsList.find((s) => s.key === 'announcement_bar_text_color');

  const [barEnabled, setBarEnabled] = useState<boolean>(true);
  const [mobileEnabled, setMobileEnabled] = useState<boolean>(true);
  const [text, setText] = useState<string>('Festive Sale is Live! Get up to 30% OFF');
  const [link, setLink] = useState<string>('/offers');
  const [linkText, setLinkText] = useState<string>('Shop Now →');
  const [bgColor, setBgColor] = useState<string>('#0284c7');
  const [textColor, setTextColor] = useState<string>('#FFFFFF');

  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [prevData, setPrevData] = useState(allSettingsData);
  if (allSettingsData !== prevData) {
    setPrevData(allSettingsData);
    if (announcementEnabledSetting) setBarEnabled(announcementEnabledSetting.value === 'true');
    if (mobileAnnouncementSetting) setMobileEnabled(mobileAnnouncementSetting.value === 'true');
    if (announcementTextSetting) setText(announcementTextSetting.value || '');
    if (announcementLinkSetting) setLink(announcementLinkSetting.value || '/offers');
    if (announcementLinkTextSetting) setLinkText(announcementLinkTextSetting.value || 'Shop Now →');
    if (announcementBgColorSetting) setBgColor(announcementBgColorSetting.value || '#0284c7');
    if (announcementTextColorSetting) setTextColor(announcementTextColorSetting.value || '#FFFFFF');
  }

  const saveSingleSetting = async (key: string, value: string, existingSetting?: { id: string }) => {
    if (existingSetting) {
      await updateSettingMut.mutateAsync({ id: existingSetting.id, dto: { value } });
    } else {
      await createSettingMut.mutateAsync({ key, value });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await saveSingleSetting('announcement_bar_enabled', String(barEnabled), announcementEnabledSetting);
      await saveSingleSetting('announcement_bar_mobile_enabled', String(mobileEnabled), mobileAnnouncementSetting);
      await saveSingleSetting('announcement_bar_text', text, announcementTextSetting);
      await saveSingleSetting('announcement_bar_link', link, announcementLinkSetting);
      await saveSingleSetting('announcement_bar_link_text', linkText, announcementLinkTextSetting);
      await saveSingleSetting('announcement_bar_bg_color', bgColor, announcementBgColorSetting);
      await saveSingleSetting('announcement_bar_text_color', textColor, announcementTextColorSetting);

      await refetch();
      setStatusMessage({ type: 'success', text: 'Top Announcement Bar settings saved and updated live!' });
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to save announcement bar settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const applyPreset = (presetText: string, presetLinkText: string, presetLink: string) => {
    setText(presetText);
    setLinkText(presetLinkText);
    setLink(presetLink);
  };

  const applyColorPreset = (bgHex: string, textHex: string) => {
    setBgColor(bgHex);
    setTextColor(textHex);
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#0284c7]/10 text-[#0284c7] rounded-xl shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Top Announcement Bar Manager</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${barEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'}`}>
                {barEnabled ? 'Active Live' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Customize the top notification header banner displayed across the entire storefront in real-time.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 sm:flex-none justify-center bg-[#0284c7] hover:bg-[#660019] text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-all flex items-center gap-2 shadow-sm min-h-[40px] disabled:opacity-50"
          >
            {isSaving ? <ButtonLoader /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Updating...' : 'Save & Publish Live'}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Live Storefront Preview Box */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-neutral-600" />
            <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Live Storefront Preview</span>
          </div>
          <div className="flex items-center bg-white p-1 rounded-lg border border-neutral-200 gap-1">
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${previewDevice === 'desktop' ? 'bg-[#0284c7] text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${previewDevice === 'mobile' ? 'bg-[#0284c7] text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile</span>
            </button>
          </div>
        </div>

        <div className="p-6 bg-neutral-100/70 flex flex-col items-center justify-center min-h-[120px]">
          <div className={`w-full transition-all duration-300 ${previewDevice === 'mobile' ? 'max-w-sm border-x-4 border-neutral-400 rounded-lg overflow-hidden shadow-md' : 'w-full shadow-sm rounded-lg overflow-hidden'}`}>
            {barEnabled ? (
              <div
                style={{ backgroundColor: bgColor, color: textColor }}
                className={
                  mobileEnabled
                    ? 'py-2 px-3 text-center text-[10px] sm:text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5'
                    : 'hidden sm:flex py-2 px-3 text-center text-xs font-semibold tracking-wide items-center justify-center gap-2'
                }
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
                <span className="truncate">{text || 'Enter announcement text below...'}</span>
                {link && linkText && (
                  <span className="underline font-bold text-amber-300 shrink-0 ml-1 cursor-pointer">
                    {linkText}
                  </span>
                )}
              </div>
            ) : (
              <div className="py-2 px-3 bg-neutral-300 text-neutral-600 text-center text-xs font-medium italic">
                (Announcement Bar Disabled)
              </div>
            )}

            {/* Fake Store Header mock below preview */}
            <div className="bg-white border-t border-neutral-200 p-3 flex items-center justify-between">
              <span className="font-serif font-bold text-sm text-[#0284c7]">Vasanthi&apos;s Signature</span>
              <span className="text-[10px] text-neutral-400 font-mono">Store Navigation Mock</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-6">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2 border-b border-neutral-100 pb-3">
              <Type className="w-4 h-4 text-[#0284c7]" />
              Announcement Content & Controls
            </h2>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 cursor-pointer hover:bg-neutral-100/60 transition-all">
                <span className="text-xs font-bold text-neutral-800">Enable Announcement Bar</span>
                <input
                  type="checkbox"
                  checked={barEnabled}
                  onChange={(e) => setBarEnabled(e.target.checked)}
                  className="h-4.5 w-4.5 rounded-md border-neutral-300 text-[#0284c7] focus:ring-[#0284c7] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 cursor-pointer hover:bg-neutral-100/60 transition-all">
                <span className="text-xs font-bold text-neutral-800">Show on Mobile Devices</span>
                <input
                  type="checkbox"
                  checked={mobileEnabled}
                  onChange={(e) => setMobileEnabled(e.target.checked)}
                  className="h-4.5 w-4.5 rounded-md border-neutral-300 text-[#0284c7] focus:ring-[#0284c7] cursor-pointer"
                />
              </label>
            </div>

            {/* Text Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-neutral-700">Announcement Text</label>
                <span className="text-[10px] text-neutral-400 font-mono">{text.length} characters</span>
              </div>
              <textarea
                rows={2}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. Festive Sale is Live! Get up to 30% OFF Shop Now"
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs font-medium text-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
              />
            </div>

            {/* Link Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-neutral-500" />
                  Link Text / Action Button
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. Shop Now →"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                  Destination URL
                </label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="e.g. /offers or /collections"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                />
              </div>
            </div>
          </div>

          {/* Color Customization Box */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-6">
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-2 border-b border-neutral-100 pb-3">
              <Palette className="w-4 h-4 text-[#0284c7]" />
              Color Scheme & Theme
            </h2>

            {/* Color Presets */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700">Quick Theme Presets</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyColorPreset(preset.bg, preset.text)}
                    className="p-2 rounded-xl border border-neutral-200 flex items-center gap-2 hover:border-neutral-400 transition-all text-left"
                  >
                    <span className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: preset.bg }} />
                    <span className="text-[11px] font-semibold text-neutral-700 truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Hex Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">Background Color (Hex)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-neutral-200 p-0.5 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">Text Color (Hex)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-9 h-9 rounded-lg border border-neutral-200 p-0.5 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#0284c7]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Quick Presets & Tips */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Ready-Made Templates
            </h3>
            <p className="text-xs text-neutral-500">Click any template below to load instant copy and links into the form:</p>

            <div className="space-y-2">
              {ANNOUNCEMENT_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p.text, p.linkText, p.link)}
                  className="w-full text-left p-3 bg-neutral-50 hover:bg-[#0284c7]/5 hover:border-[#0284c7]/30 rounded-xl border border-neutral-200 transition-all space-y-1 group"
                >
                  <p className="text-xs font-semibold text-neutral-800 group-hover:text-[#0284c7] line-clamp-2">{p.text}</p>
                  <span className="text-[10px] font-bold text-[#0284c7] underline inline-block">{p.linkText}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-5 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-xs font-bold tracking-wide uppercase text-amber-300 flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5" />
              Pro Tip & Instant Cache
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              When you click <strong className="text-white">Save & Publish Live</strong>, the system instantly clears backend Redis cache and invalidates React Query clients across all user sessions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
