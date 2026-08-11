'use client';

import { useEffect, useState } from 'react';
import { useSettings, useUpdateSettings } from '@/features/storefront/storefront.hooks';
import { PageLoader, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { Button } from '@/components/forms/FormField';
import { getApiErrorMessage } from '@/utils/api-error';
import { Save } from 'lucide-react';

export default function SeoPage() {
  const { data, isLoading } = useSettings();
  const updateMut = useUpdateSettings();
  const [form, setForm] = useState({
    metaTitle: '', metaDescription: '', metaKeywords: '', ogImage: '',
    robots: '', canonicalUrl: '', googleAnalyticsId: '', googleTagManagerId: '', facebookPixelId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (data) setForm({
      metaTitle: data.metaTitle ?? '',
      metaDescription: data.metaDescription ?? '',
      metaKeywords: data.metaKeywords ?? '',
      ogImage: data.ogImage ?? '',
      robots: data.robots ?? '',
      canonicalUrl: data.canonicalUrl ?? '',
      googleAnalyticsId: data.googleAnalyticsId ?? '',
      googleTagManagerId: data.googleTagManagerId ?? '',
      facebookPixelId: data.facebookPixelId ?? '',
    });
  }, [data]);

  if (isLoading) return <PageLoader />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(false);
    try {
      await updateMut.mutateAsync(form);
      setSuccess(true);
    } catch (err) { setError(getApiErrorMessage(err, 'Failed to save SEO settings')); }
  };

  const Field = ({ label, field, type = 'text', placeholder }: { label: string; field: keyof typeof form; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea value={form[field] as string} onChange={(e) => setForm(p => ({ ...p, [field]: e.target.value }))} placeholder={placeholder} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm" rows={3} />
      ) : (
        <input type={type} value={form[field] as string} onChange={(e) => setForm(p => ({ ...p, [field]: e.target.value }))} placeholder={placeholder} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
      )}
    </div>
  );

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
          <Field label="Meta Title" field="metaTitle" placeholder="Vasanthi Designers — Premium Fashion" />
          <Field label="Meta Description" field="metaDescription" type="textarea" placeholder="Discover the latest trends in fashion..." />
          <Field label="Meta Keywords" field="metaKeywords" placeholder="fashion, clothing, designer wear, ethnic wear" />
        </div>

        <div className="border-t border-neutral-100 pt-4 space-y-4">
          <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Open Graph</h3>
          <Field label="OG Image URL" field="ogImage" placeholder="https://..." />
        </div>

        <div className="border-t border-neutral-100 pt-4 space-y-4">
          <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Crawling & Indexing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Robots" field="robots" placeholder="index, follow" />
            <Field label="Canonical URL" field="canonicalUrl" placeholder="https://vasanthi.com" />
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-4 space-y-4">
          <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Analytics & Tracking</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Google Analytics ID" field="googleAnalyticsId" placeholder="G-XXXXXXXXXX" />
            <Field label="Google Tag Manager" field="googleTagManagerId" placeholder="GTM-XXXXXXX" />
            <Field label="Facebook Pixel ID" field="facebookPixelId" placeholder="1234567890" />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-neutral-100">
          <Button type="submit" disabled={updateMut.isPending}><ButtonLoader /> <Save className="w-4 h-4 mr-1" /> Save SEO Settings</Button>
        </div>
      </form>
    </div>
  );
}
