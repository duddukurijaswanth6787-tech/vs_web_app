'use client';

import { useState, useEffect } from 'react';
import { useSocialLinks, useUpdateSocialLink } from '@/features/storefront/storefront.hooks';
import type { SocialLink } from '@/features/storefront/storefront.types';
import { PageLoader, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/api-error';
import { Save, ExternalLink, X, Globe } from 'lucide-react';

// ponytail: lucide-react removed brand icons; using generic Globe
const platformIcons: Record<string, React.ReactNode> = {
  facebook: <Globe className="w-6 h-6" />,
  instagram: <Globe className="w-6 h-6" />,
  youtube: <Globe className="w-6 h-6" />,
  pinterest: <Globe className="w-6 h-6" />,
  twitter: <Globe className="w-6 h-6" />,
  whatsapp: <Globe className="w-6 h-6" />,
};

const platformColors: Record<string, string> = {
  facebook: 'text-blue-600 bg-blue-50 border-blue-200',
  instagram: 'text-pink-600 bg-pink-50 border-pink-200',
  youtube: 'text-red-600 bg-red-50 border-red-200',
  pinterest: 'text-red-700 bg-red-50 border-red-200',
  twitter: 'text-sky-500 bg-sky-50 border-sky-200',
  whatsapp: 'text-green-600 bg-green-50 border-green-200',
};

export default function SocialLinksPage() {
  const { data: links, isLoading } = useSocialLinks();
  const updateMut = useUpdateSocialLink();
  const [editState, setEditState] = useState<Record<string, { url: string; enabled: boolean }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (links) {
      const init: Record<string, { url: string; enabled: boolean }> = {};
      for (const l of links) init[l.platform] = { url: l.url ?? '', enabled: l.enabled };
      setEditState(prev => {
        const merged = { ...init };
        for (const k of Object.keys(prev)) if (init[k]) merged[k] = prev[k];
        return merged;
      });
    }
  }, [links]);

  const handleSave = async (platform: string) => {
    setSaving(platform); setError(null);
    const state = editState[platform];
    if (!state) return;
    try {
      await updateMut.mutateAsync({ platform, dto: { url: state.url || undefined, enabled: state.enabled } });
    } catch (err) { setError(getApiErrorMessage(err, `Failed to update ${platform}`)); }
    finally { setSaving(null); }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Social Links</h1>
        <p className="text-xs text-neutral-400 mt-1">Manage social media links displayed on the storefront</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium flex items-center justify-between"><span>{error}</span><button onClick={() => setError(null)}><X className="w-4 h-4" /></button></div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {links?.map((link) => {
          const state = editState[link.platform];
          if (!state) return null;
          const isDirty = state.url !== (link.url ?? '') || state.enabled !== link.enabled;
          return (
            <div key={link.platform} className={`bg-white rounded-2xl border p-5 shadow-sm ${isDirty ? 'border-amber-300 ring-1 ring-amber-200' : 'border-neutral-200'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl ${platformColors[link.platform] ?? 'text-neutral-600 bg-neutral-100 border-neutral-200'}`}>
                  {platformIcons[link.platform] ?? <Globe className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 capitalize">{link.platform}</h3>
                  {link.title && <p className="text-[10px] text-neutral-400">{link.title}</p>}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-neutral-500 uppercase mb-1">URL</label>
                  <div className="flex items-center gap-2">
                    <input type="url" value={state.url} onChange={(e) => setEditState(p => ({ ...p, [link.platform]: { ...p[link.platform], url: e.target.value } }))} placeholder="https://facebook.com/..." className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-mono" />
                    {state.url && <a href={state.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-neutral-100 rounded text-neutral-400"><ExternalLink className="w-3.5 h-3.5" /></a>}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={state.enabled} onChange={(e) => setEditState(p => ({ ...p, [link.platform]: { ...p[link.platform], enabled: e.target.checked } }))} className="rounded border-neutral-300" />
                    <span className="text-[10px] font-semibold text-neutral-500 uppercase">Enabled</span>
                  </label>
                  <button onClick={() => handleSave(link.platform)} disabled={saving === link.platform || !isDirty} className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-1.5 px-3 rounded-lg text-xs disabled:opacity-50 flex items-center gap-1">
                    {saving === link.platform && <ButtonLoader />} <Save className="w-3 h-3" /> Save
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
