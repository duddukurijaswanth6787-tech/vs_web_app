'use client';

import { useState } from 'react';
import { useSettings, useUpdateSettings } from '@/features/storefront/storefront.hooks';
import { PageLoader, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { Button, LabeledField } from '@/components/forms/FormField';
import { getApiErrorMessage } from '@/utils/api-error';
import { Save, RotateCcw } from 'lucide-react';
import type { WebsiteSettings } from '@/features/storefront/storefront.types';

const defaultValues = {
  storeName: '', storeDescription: '', logo: '', favicon: '', supportPhone: '', supportEmail: '',
  whatsappNumber: '', supportHours: '', companyAddress: '', currency: 'INR', timezone: 'Asia/Kolkata',
  language: 'en', copyrightText: '',
};

type StoreForm = typeof defaultValues;

const fromSettings = (s: WebsiteSettings): StoreForm => ({
  storeName: s.storeName ?? '',
  storeDescription: s.storeDescription ?? '',
  logo: s.logo ?? '',
  favicon: s.favicon ?? '',
  supportPhone: s.supportPhone ?? '',
  supportEmail: s.supportEmail ?? '',
  whatsappNumber: s.whatsappNumber ?? '',
  supportHours: s.supportHours ?? '',
  companyAddress: s.companyAddress ?? '',
  currency: s.currency ?? 'INR',
  timezone: s.timezone ?? 'Asia/Kolkata',
  language: s.language ?? 'en',
  copyrightText: s.copyrightText ?? '',
});

export default function StoreInformationPage() {
  const { data, isLoading } = useSettings();
  const updateMut = useUpdateSettings();
  const [form, setForm] = useState<StoreForm>(defaultValues);
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
    } catch (err) { setError(getApiErrorMessage(err, 'Failed to save')); }
  };

  const reset = () => { if (data) setForm({ ...defaultValues, ...data }); };

  const update = (field: keyof StoreForm) => (value: string) => setForm(p => ({ ...p, [field]: value }));

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Store Information</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage your store name, contact details, and branding</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-6">
        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 font-medium">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700 font-medium">Settings saved successfully</div>}

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Branding</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledField label="Store Name" value={form.storeName} onChange={update('storeName')} placeholder="Vasanthi Designers" />
            <LabeledField label="Language" value={form.language} onChange={update('language')} />
            <LabeledField label="Logo URL" value={form.logo} onChange={update('logo')} placeholder="https://..." />
            <LabeledField label="Favicon URL" value={form.favicon} onChange={update('favicon')} placeholder="https://..." />
          </div>
          <LabeledField label="Store Description" value={form.storeDescription} onChange={update('storeDescription')} textarea placeholder="Brief description of your store" />
        </div>

        <div className="border-t border-neutral-100 pt-4 space-y-4">
          <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LabeledField label="Phone" value={form.supportPhone} onChange={update('supportPhone')} placeholder="+91 98765 43210" />
            <LabeledField label="Email" value={form.supportEmail} onChange={update('supportEmail')} type="email" placeholder="support@vasanthi.com" />
            <LabeledField label="WhatsApp Number" value={form.whatsappNumber} onChange={update('whatsappNumber')} placeholder="+91 98765 43210" />
            <LabeledField label="Support Hours" value={form.supportHours} onChange={update('supportHours')} placeholder="Mon-Sat, 10 AM - 7 PM" />
          </div>
          <LabeledField label="Company Address" value={form.companyAddress} onChange={update('companyAddress')} textarea />
        </div>

        <div className="border-t border-neutral-100 pt-4 space-y-4">
          <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Regional</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <LabeledField label="Currency" value={form.currency} onChange={update('currency')} placeholder="INR" />
            <LabeledField label="Timezone" value={form.timezone} onChange={update('timezone')} placeholder="Asia/Kolkata" />
            <LabeledField label="Copyright Text" value={form.copyrightText} onChange={update('copyrightText')} placeholder="© 2026 Vasanthi Designers" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
          <Button type="button" variant="secondary" onClick={reset}><RotateCcw className="w-4 h-4 mr-1" /> Reset</Button>
          <Button type="submit" disabled={updateMut.isPending}><ButtonLoader /> <Save className="w-4 h-4 mr-1" /> Save Changes</Button>
        </div>
      </form>
    </div>
  );
}