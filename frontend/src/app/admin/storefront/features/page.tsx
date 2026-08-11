'use client';

import { useState, useMemo } from 'react';
import { useFeatures, useUpdateFeature, useBulkUpdateFeatures } from '@/features/storefront/storefront.hooks';
import type { FeatureToggle } from '@/features/storefront/storefront.types';
import { PageLoader, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/api-error';
import { Save, X } from 'lucide-react';

const groupOrder = ['CUSTOMER', 'PRODUCT', 'CHECKOUT', 'SEARCH', 'MARKETING', 'AI'];

export default function FeaturesPage() {
  const { data: features, isLoading } = useFeatures();
  const updateMut = useUpdateFeature();
  const bulkMut = useBulkUpdateFeatures();
  const [changed, setChanged] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<string, FeatureToggle[]> = {};
    for (const f of features ?? []) {
      const g = f.category || 'OTHER';
      if (!map[g]) map[g] = [];
      map[g].push(f);
    }
    return map;
  }, [features]);

  const toggle = (key: string, current: boolean) => {
    setChanged(p => ({ ...p, [key]: !current }));
  };

  const saveChanges = async () => {
    setError(null);
    const enable = Object.entries(changed).filter(([, v]) => v).map(([k]) => k);
    const disable = Object.entries(changed).filter(([, v]) => !v).map(([k]) => k);
    try {
      if (enable.length > 0 || disable.length > 0) await bulkMut.mutateAsync({ enable, disable });
      setChanged({});
    } catch (err) { setError(getApiErrorMessage(err, 'Failed to save')); }
  };

  if (isLoading) return <PageLoader />;

  const hasChanges = Object.keys(changed).length > 0;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Feature Toggles</h1>
          <p className="text-xs text-neutral-400 mt-1">Enable or disable storefront features</p>
        </div>
        {hasChanges && (
          <button onClick={saveChanges} disabled={bulkMut.isPending} className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-sm">
            {bulkMut.isPending && <ButtonLoader />} <Save className="w-4 h-4" /> Save Changes
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium flex items-center justify-between"><span>{error}</span><button onClick={() => setError(null)}><X className="w-4 h-4" /></button></div>}

      {groupOrder.filter(g => grouped[g]).map((group) => (
        <div key={group} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-200">
            <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">{group}</h3>
          </div>
          <div className="divide-y divide-neutral-100">
            {grouped[group].map((feature) => {
              const isOn = changed[feature.key] !== undefined ? changed[feature.key] : feature.enabled;
              const isModified = changed[feature.key] !== undefined;
              return (
                <div key={feature.key} className={`flex items-center justify-between px-5 py-3.5 ${isModified ? 'bg-amber-50/50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-900">{feature.name}</span>
                      {isModified && <span className="text-[9px] text-amber-600 font-bold uppercase bg-amber-100 px-1.5 py-0.5 rounded">Modified</span>}
                    </div>
                    {feature.description && <p className="text-[11px] text-neutral-400 mt-0.5">{feature.description}</p>}
                    <p className="text-[9px] text-neutral-300 mt-0.5">Updated: {new Date(feature.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => toggle(feature.key, feature.enabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4 ${isOn ? 'bg-green-500' : 'bg-neutral-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
