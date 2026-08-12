'use client';

import { useState } from 'react';
import { useSettings, useUpdateSettings } from '@/features/storefront/storefront.hooks';
import { PageLoader, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { Button, LabeledField } from '@/components/forms/FormField';
import { getApiErrorMessage } from '@/utils/api-error';
import { Save } from 'lucide-react';
import type { WebsiteSettings } from '@/features/storefront/storefront.types';

const formDefaults = {
  metaTitle: '', metaDescription: '', metaKeywords: '', ogImage: '',
  robots: '', canonicalUrl: '', googleAnalyticsId: '', googleTagManagerId: '', facebookPixelId: '',
};

type SeoForm = typeof formDefaults;

const fromSettings = (s: WebsiteSettings): SeoForm => ({
  metaTitle: s.metaTitle ?? '',
  metaDescription: s.metaDescription ?? '',
  metaKeywords: s.metaKeywords ?? '',
  ogImage: s.ogImage ?? '',
  robots: s.robots ?? '',
  canonicalUrl: s.canonicalUrl ?? '',
  googleAnalyticsId: s.googleAnalyticsId ?? '',
  googleTagManagerId: s.googleTagManagerId ?? '',
  facebookPixelId: s.facebookPixelId ?? '',
});

export default function SeoPage() {
  const { data, isLoading } = useSettings();
  const updateMut = useUpdateSettings();
  const [form, setForm] = useState<SeoForm>(formDefaults);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [prevSettings, setPrevSettings] = useState(data);
  if (data && data !== prevSettings) {
    setPrevSettings(data);
    setForm(fromSettings(data));
  }

  if (isLoading) return <PageLoader />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(false);
    try {
      await updateMut.mutateAsync(form);
      setSuccess(true);
    } catch (err) { setError(getApiErrorMessage(err, 'Failed to save SEO settings')); }
  };

  const update = (field: keyof SeoForm) => (value: string) => setForm(p => ({ ...p, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <h1 className="text-xl font-bold text-neutral-900 tracking-tight">SEO Settings</h1>
        <p className="text-xs text-neutral-400 mt-1">Manage search engine optimization and analytics</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-6">
        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 font-medium">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700 font-medium">SEO settings saved successfully</div>}

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Meta Tags</h3>
          <LabeledField label="Meta Title" value={form.metaTitle} onChange={update('metaTitle')} placeholder="Vasanthi Designers — Premium Fashion" />
          <LabeledField label="Meta Description" value={form.metaDescription} onChange={update('metaDescription')} textarea placeholder="Discover the latest trends in fashion..." />
          <LabeledField label="Meta Keywords" value={form.metaKeywords} onChange={update('metaKeywords')} placeholder="fashion, clothing, designer wear, ethnic wear" />
        </div>

        <div className="border-t border-neutral-100 pt-4 space-y-4">
          <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Open Graph</h3>
          <LabeledField label="OG Image URL" value={form.ogImage} onChange={update('ogImage')} placeholder="https://..." />
        </div>

        <div className="border-t border-neutral-100 pt-4 space-y-4">
          <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Crawling & Indexing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledField label="Robots" value={form.robots} onChange={update('robots')} placeholder="index, follow" />
            <LabeledField label="Canonical URL" value={form.canonicalUrl} onChange={update('canonicalUrl')} placeholder="https://vasanthi.com" />
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-4 space-y-4">
          <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Analytics & Tracking</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LabeledField label="Google Analytics ID" value={form.googleAnalyticsId} onChange={update('googleAnalyticsId')} placeholder="G-XXXXXXXXXX" />
            <LabeledField label="Google Tag Manager" value={form.googleTagManagerId} onChange={update('googleTagManagerId')} placeholder="GTM-XXXXXXX" />
            <LabeledField label="Facebook Pixel ID" value={form.facebookPixelId} onChange={update('facebookPixelId')} placeholder="1234567890" />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-neutral-100">
          <Button type="submit" disabled={updateMut.isPending}><ButtonLoader /> <Save className="w-4 h-4 mr-1" /> Save SEO Settings</Button>
        </div>
      </form>
    </div>
  );
}