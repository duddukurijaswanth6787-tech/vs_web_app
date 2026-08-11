'use client';

import { useEffect, useState } from 'react';
import { useSettings, useUpdateSettings } from '@/features/storefront/storefront.hooks';
import { PageLoader, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { Button } from '@/components/forms/FormField';
import { getApiErrorMessage } from '@/utils/api-error';
import { Save, Eye } from 'lucide-react';

export default function MaintenancePage() {
  const { data, isLoading } = useSettings();
  const updateMut = useUpdateSettings();
  const [form, setForm] = useState({ maintenanceMode: false, maintenanceMessage: '', maintenanceStartTime: '', maintenanceEndTime: '', whitelistedIps: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (data) setForm({
      maintenanceMode: data.maintenanceMode ?? false,
      maintenanceMessage: data.maintenanceMessage ?? '',
      maintenanceStartTime: data.maintenanceStartTime ?? '',
      maintenanceEndTime: data.maintenanceEndTime ?? '',
      whitelistedIps: data.whitelistedIps ?? '',
    });
  }, [data]);

  if (isLoading) return <PageLoader />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(false);
    try {
      await updateMut.mutateAsync(form);
      setSuccess(true);
    } catch (err) { setError(getApiErrorMessage(err, 'Failed to save maintenance settings')); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Maintenance Mode</h1>
        <p className="text-xs text-neutral-400 mt-1">Control storefront availability during maintenance</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-6">
        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 font-medium">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700 font-medium">Maintenance settings saved</div>}

        <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: form.maintenanceMode ? '#fecaca' : '#e5e7eb', backgroundColor: form.maintenanceMode ? '#fef2f2' : '#fafafa' }}>
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${form.maintenanceMode ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
              <span className="text-sm font-bold text-neutral-900">Maintenance Mode</span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">{form.maintenanceMode ? 'Your store is currently in maintenance mode. Customers see the maintenance page.' : 'Your store is live and accessible to customers.'}</p>
          </div>
          <button type="button" onClick={() => setForm(p => ({ ...p, maintenanceMode: !p.maintenanceMode }))} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${form.maintenanceMode ? 'bg-red-500' : 'bg-neutral-300'}`}>
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${form.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Maintenance Page Content</h3>
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Message</label>
            <textarea value={form.maintenanceMessage} onChange={(e) => setForm(p => ({ ...p, maintenanceMessage: e.target.value }))} placeholder="We'll be back soon! Our store is currently undergoing scheduled maintenance." className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm" rows={3} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Start Time</label>
              <input type="datetime-local" value={form.maintenanceStartTime} onChange={(e) => setForm(p => ({ ...p, maintenanceStartTime: e.target.value }))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">End Time</label>
              <input type="datetime-local" value={form.maintenanceEndTime} onChange={(e) => setForm(p => ({ ...p, maintenanceEndTime: e.target.value }))} className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-4 space-y-4">
          <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Access Control</h3>
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">Whitelisted IPs</label>
            <textarea value={form.whitelistedIps} onChange={(e) => setForm(p => ({ ...p, whitelistedIps: e.target.value }))} placeholder="One IP per line or comma-separated" className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-sm font-mono" rows={3} />
            <p className="text-[9px] text-neutral-400 mt-1">IPs that can access the storefront while in maintenance mode. Use * for all.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
          <Button type="submit" disabled={updateMut.isPending}><ButtonLoader /> <Save className="w-4 h-4 mr-1" /> Save Maintenance Settings</Button>
        </div>
      </form>
    </div>
  );
}
