'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSettings, useCreateSetting, useUpdateSetting } from '@/features/settings/settings.hooks';
import { useBanners, useCreateBanner, useUpdateBanner, useDeleteBanner } from '@/features/banners/banner.hooks';
import { BannerResponse } from '@/features/banners/banner.types';
import { ButtonLoader } from '@/components/feedback/FeedbackStates';
import { Plus, Trash2, Edit3, X, Image as ImageIcon } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDate } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';
import { categorizeApiError } from '@/lib/api-error-handler';
import { getApiErrorMessage } from '@/utils/api-error';
import { RemoteImage } from '@/components/media/RemoteImage';
import { MediaPickerModal } from '@/components/media/MediaPickerModal';
import type { LibraryMedia } from '@/features/catalog/media/library.types';
import DataTable from '@/components/tables/DataTable';
import type { Column } from '@/components/tables/DataTable';

const bannerSchema = z.object({
  title: z.string().min(2, 'Title is too short').max(100),
  description: z.string().max(200).optional(),
  imageUrl: z.string().url('Must be valid image URL'),
  mobileImageUrl: z.string().url('Must be valid image URL').optional().or(z.literal('')),
  linkUrl: z.string().url('Must be valid destination URL').optional().or(z.literal('')),
  placement: z.string().min(2, 'Placement key is required'),
  displayOrder: z.number().int().min(0),
  isActive: z.boolean(),
  ctaEnabled: z.boolean(),
  ctaStyle: z.enum(['solid', 'transparent']),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof bannerSchema>;

export default function BannersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const pageParam = parseInt(searchParams.get('page') || '1');
  const placement = searchParams.get('placement') || '';

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeBanner, setActiveBanner] = useState<BannerResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [autoplayEnabled, setAutoplayEnabled] = useState<boolean>(true);
  const [autoplayInterval, setAutoplayInterval] = useState<number>(5);
  const [mobileAnnouncementEnabled, setMobileAnnouncementEnabled] = useState<boolean>(true);
  const [announcementBarText, setAnnouncementBarText] = useState<string>('Festive Sale is Live! Get up to 30% OFF');
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  const { data: allSettingsData, refetch: refetchSettings } = useSettings({ limit: 500 });
  const createSettingMut = useCreateSetting();
  const updateSettingMut = useUpdateSetting();

  const settingsList = allSettingsData?.data || [];
  const intervalSetting = settingsList.find(s => s.key === 'banner_autoplay_interval');
  const enabledSetting = settingsList.find(s => s.key === 'banner_autoplay_enabled');
  const mobileAnnouncementSetting = settingsList.find(s => s.key === 'announcement_bar_mobile_enabled');
  const announcementTextSetting = settingsList.find(s => s.key === 'announcement_bar_text');

  const [prevSettings, setPrevSettings] = useState(allSettingsData);
  if (allSettingsData !== prevSettings) {
    setPrevSettings(allSettingsData);
    if (enabledSetting) {
      setAutoplayEnabled(enabledSetting.value === 'true');
    }
    if (intervalSetting) {
      setAutoplayInterval(parseInt(intervalSetting.value, 10) || 5);
    }
    if (mobileAnnouncementSetting) {
      setMobileAnnouncementEnabled(mobileAnnouncementSetting.value === 'true');
    }
    if (announcementTextSetting) {
      setAnnouncementBarText(announcementTextSetting.value || 'Festive Sale is Live! Get up to 30% OFF');
    }
  }

  const handleSaveAutoplaySettings = async () => {
    setIsSavingSettings(true);
    try {
      if (enabledSetting) {
        await updateSettingMut.mutateAsync({ id: enabledSetting.id, dto: { value: String(autoplayEnabled) } });
      } else {
        await createSettingMut.mutateAsync({ key: 'banner_autoplay_enabled', value: String(autoplayEnabled) });
      }

      if (intervalSetting) {
        await updateSettingMut.mutateAsync({ id: intervalSetting.id, dto: { value: String(autoplayInterval) } });
      } else {
        await createSettingMut.mutateAsync({ key: 'banner_autoplay_interval', value: String(autoplayInterval) });
      }

      if (mobileAnnouncementSetting) {
        await updateSettingMut.mutateAsync({ id: mobileAnnouncementSetting.id, dto: { value: String(mobileAnnouncementEnabled) } });
      } else {
        await createSettingMut.mutateAsync({ key: 'announcement_bar_mobile_enabled', value: String(mobileAnnouncementEnabled) });
      }

      if (announcementTextSetting) {
        await updateSettingMut.mutateAsync({ id: announcementTextSetting.id, dto: { value: announcementBarText } });
      } else {
        await createSettingMut.mutateAsync({ key: 'announcement_bar_text', value: announcementBarText });
      }

      await refetchSettings();
      alert('Settings saved successfully!');
    } catch {
      alert('Failed to save settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const { data: listData, isLoading, isError, refetch } = useBanners({ page: pageParam, limit: 10, placement: placement || undefined });
  const deleteMut = useDeleteBanner();

  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/admin/banners?${params}`);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} banners?`)) return;
    await Promise.all(Array.from(selectedIds).map((id) => deleteMut.mutateAsync(id)));
    setSelectedIds(new Set()); refetch();
  };

  const isEditor = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));
  const isSuperAdmin = user?.roles?.includes('super_admin');

  const columns: Column<BannerResponse>[] = [
    { key: 'image', label: 'Media', render: (b) => b.imageUrl ? <RemoteImage src={b.imageUrl} alt={b.title} width={64} height={40} className="w-16 h-10 object-cover rounded border border-neutral-200" /> : <div className="w-16 h-10 bg-neutral-100 flex items-center justify-center rounded border"><ImageIcon className="w-4 h-4 text-neutral-400" /></div> },
    { key: 'title', label: 'Title', render: (b) => <div><div className="font-bold text-neutral-900">{b.title}</div><div className="text-[10px] text-neutral-400 max-w-[200px] truncate">{b.description || ''}</div>{b.linkUrl && <div className="text-[9px] text-neutral-500 font-mono underline">{b.linkUrl}</div>}</div> },
    { key: 'placement', label: 'Placement', render: (b) => <span className="uppercase text-2xs font-semibold text-neutral-600">{b.placement}</span> },
    { key: 'displayOrder', label: 'Order', render: (b) => <span className="font-semibold text-center block">{b.displayOrder}</span> },
    { key: 'schedule', label: 'Schedule', render: (b) => b.startDate ? <div className="text-neutral-500"><div className="font-medium">Start: {formatDate(b.startDate)}</div>{b.endDate && <div className="text-[10px] text-neutral-400">End: {formatDate(b.endDate)}</div>}</div> : <span className="text-neutral-350 italic">Always Active</span> },
    { key: 'isActive', label: 'Status', render: (b) => <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${b.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-neutral-100 text-neutral-500'}`}>{b.isActive ? 'Active' : 'Inactive'}</span> },
    { key: 'actions', label: 'Actions', render: (b) => (
      <div className="flex justify-end gap-2">
        {isEditor && <button onClick={() => { setActiveBanner(b); setIsDialogOpen(true); }} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600"><Edit3 className="w-4 h-4" /></button>}
        {isSuperAdmin && <button onClick={() => { if (confirm(`Delete "${b.title}"?`)) deleteMut.mutateAsync(b.id).then(() => refetch()); }} className="p-1.5 hover:bg-red-50 rounded text-red-650"><Trash2 className="w-4 h-4" /></button>}
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight font-sans">Banner Advertisements</h1>
          <p className="text-xs text-neutral-400 mt-1">Configure layout banners, carousels, or flash sale promotions across the catalog.</p>
        </div>
        {isEditor && <button onClick={() => { setActiveBanner(null); setIsDialogOpen(true); }} className="w-full sm:w-auto justify-center bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-sm min-h-[38px]"><Plus className="w-4 h-4" /> Create Banner</button>}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 font-sans">Storefront Hero Carousel & Mobile Announcement Settings</h2>
          <p className="text-xs text-neutral-400 mt-1">Control autoplay behavior, top announcement bar display on mobile, and announcement text.</p>
        </div>
        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-neutral-100">
          <label className="flex items-center gap-2.5 text-xs font-semibold text-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={autoplayEnabled}
              onChange={(e) => setAutoplayEnabled(e.target.checked)}
              className="h-4.5 w-4.5 rounded-md border-neutral-350 text-neutral-900 focus:ring-neutral-900 focus:ring-offset-2 transition-all cursor-pointer"
            />
            <span>Enable Hero Autoplay</span>
          </label>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-700">Autoplay Interval:</span>
            <input
              type="number"
              min={1}
              max={60}
              value={autoplayInterval}
              onChange={(e) => setAutoplayInterval(parseInt(e.target.value, 10) || 5)}
              disabled={!autoplayEnabled}
              className="w-16 bg-neutral-50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs font-bold disabled:opacity-50 text-center focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
            <span className="text-xs text-neutral-400">seconds</span>
          </div>

          <label className="flex items-center gap-2.5 text-xs font-semibold text-neutral-700 cursor-pointer border-t sm:border-t-0 sm:border-l border-neutral-200 pt-3 sm:pt-0 sm:pl-6 w-full sm:w-auto">
            <input
              type="checkbox"
              checked={mobileAnnouncementEnabled}
              onChange={(e) => setMobileAnnouncementEnabled(e.target.checked)}
              className="h-4.5 w-4.5 rounded-md border-neutral-350 text-[#0284c7] focus:ring-[#0284c7] focus:ring-offset-2 transition-all cursor-pointer"
            />
            <span className="font-bold text-[#0284c7]">Show Top Announcement Bar on Mobile View</span>
          </label>
          <div className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 pt-2">
            <span className="text-xs font-semibold text-neutral-700 shrink-0">Announcement Text:</span>
            <input
              type="text"
              value={announcementBarText}
              onChange={(e) => setAnnouncementBarText(e.target.value)}
              placeholder="e.g. Festive Sale is Live! Get up to 30% OFF"
              className="w-full sm:flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 min-h-[38px]"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveAutoplaySettings}
            disabled={isSavingSettings}
            className="w-full sm:w-auto sm:ml-auto justify-center bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-5 rounded-xl text-xs disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm min-h-[38px]"
          >
            {isSavingSettings ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <span className="text-xs font-semibold text-neutral-500">Filters:</span>
        <select value={placement} onChange={(e) => updateQuery('placement', e.target.value)} className="w-full sm:w-auto bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-medium min-h-[38px]">
          <option value="">All Placements</option>
          <option value="HOMEPAGE_HERO">HOMEPAGE HERO</option>
          <option value="PROMO_BANNER">PROMO BANNER</option>
          <option value="CATALOG_TOP">CATALOG TOP</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={listData?.data ?? []}
        total={listData?.meta?.total ?? 0}
        page={pageParam}
        pageSize={10}
        loading={isLoading}
        error={isError}
        onRetry={refetch}
        onPageChange={(p) => { const params = new URLSearchParams(searchParams.toString()); params.set('page', String(p)); router.push(`/admin/banners?${params}`); }}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        rowKey={(b) => b.id}
        emptyMessage="No banner assets defined."
        bulkActions={selectedIds.size > 0 ? (
          <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 border border-red-200">Delete Selected</button>
        ) : undefined}
      />

      {isDialogOpen && <BannerDialog banner={activeBanner} onClose={() => { setIsDialogOpen(false); setActiveBanner(null); }} onSuccess={() => refetch()} />}
    </div>
  );
}

function BannerDialog({ banner, onClose, onSuccess }: { banner: BannerResponse | null; onClose: () => void; onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'desktop' | 'mobile' | null>(null);
  const createMut = useCreateBanner();
  const updateMut = useUpdateBanner();

  const { register, handleSubmit, setValue, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: banner?.title || '', description: banner?.description || '', imageUrl: banner?.imageUrl || '',
      mobileImageUrl: banner?.mobileImageUrl || '',
      linkUrl: banner?.linkUrl || '', placement: banner?.placement || 'HOMEPAGE_HERO',
      displayOrder: banner?.displayOrder || 0, isActive: banner?.isActive ?? true,
      ctaEnabled: banner?.ctaEnabled ?? true, ctaStyle: banner?.ctaStyle || 'solid',
      startDate: banner?.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : '',
      endDate: banner?.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : '',
    },
  });

  const watchedImageUrl = useWatch({ control, name: 'imageUrl' });
  const watchedMobileImageUrl = useWatch({ control, name: 'mobileImageUrl' });
  const watchedPlacement = useWatch({ control, name: 'placement' });
  const watchedCtaEnabled = useWatch({ control, name: 'ctaEnabled' });

  const getDesktopRecommendation = () => {
    switch (watchedPlacement) {
      case 'HOMEPAGE_HERO':
        return 'Recommended: 1920x800px (Widescreen 2.4:1)';
      case 'PROMO_BANNER':
        return 'Recommended: 1200x400px (Banner 3:1)';
      case 'CATALOG_TOP':
        return 'Recommended: 1200x300px (Banner 4:1)';
      default:
        return 'Recommended: 1920x800px';
    }
  };

  const getMobileRecommendation = () => {
    return '⭐ Perfect Size: 800x500px (Mobile 16:10) or 800x800px (Square 1:1)';
  };

  const openPicker = (target: 'desktop' | 'mobile') => {
    setPickerTarget(target);
    setShowMediaPicker(true);
  };

  const handleMediaSelected = (media: LibraryMedia | LibraryMedia[]) => {
    const m = Array.isArray(media) ? media[0] : media;
    if (m) {
      if (pickerTarget === 'mobile') {
        setValue('mobileImageUrl', m.publicUrl, { shouldValidate: true });
      } else {
        setValue('imageUrl', m.publicUrl, { shouldValidate: true });
      }
    }
    setShowMediaPicker(false);
    setPickerTarget(null);
  };

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const payload = {
        ...values,
        linkUrl: values.linkUrl || undefined,
        mobileImageUrl: values.mobileImageUrl || undefined,
        startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
        endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
      };
      if (banner) await updateMut.mutateAsync({ id: banner.id, dto: payload });
      else await createMut.mutateAsync(payload);
      onSuccess(); onClose();
    } catch (err: unknown) { console.error(categorizeApiError(err)); setError(getApiErrorMessage(err, 'Failed to save banner')); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-3 sm:p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-4 sm:p-6 shadow-xl border border-neutral-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">{banner ? 'Edit Banner' : 'Create Banner'}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"><X className="h-5 w-5" /></button>
        </div>
        {error && <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-2.5 text-2xs text-red-650 font-semibold">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 text-xs">
          <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Title</label><input type="text" {...register('title')} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5" />{errors.title && <p className="text-[9px] text-red-650 mt-1">{errors.title.message}</p>}</div>
          <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Description</label><input type="text" {...register('description')} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5" /></div>

          {/* 1. Desktop View Banner Image */}
          <div className="space-y-1.5 border border-neutral-200/80 rounded-xl p-3 bg-neutral-50/50">
            <label className="block text-[10px] font-bold text-neutral-700 uppercase flex items-center justify-between">
              <span>🖥️ Desktop Banner Image</span>
              <span className="text-[9px] text-neutral-400 font-normal">Required</span>
            </label>
            {watchedImageUrl ? (
              <div className="relative border border-neutral-200 rounded-xl overflow-hidden bg-white p-2 flex items-center gap-3">
                <RemoteImage src={watchedImageUrl} alt="" width={64} height={40} className="w-16 h-10 object-cover rounded" />
                <span className="text-[10px] text-neutral-400 truncate flex-1 font-mono">{watchedImageUrl}</span>
                <button type="button" onClick={() => setValue('imageUrl', '', { shouldValidate: true })} className="text-red-500 hover:text-red-700 p-1"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-neutral-200 bg-white rounded-xl p-4 text-center cursor-pointer hover:border-neutral-400" onClick={() => openPicker('desktop')}>
                <ImageIcon className="w-6 h-6 text-neutral-300 mx-auto mb-1" />
                <p className="text-xs text-neutral-600 font-medium">Select Desktop Banner</p>
                <p className="text-[9px] text-neutral-400 mt-0.5 font-medium">{getDesktopRecommendation()}</p>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1">
              <button type="button" onClick={() => openPicker('desktop')} className="bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 font-bold py-1 px-2.5 rounded-lg text-2xs"><ImageIcon className="w-3.5 h-3.5 inline mr-1" />{watchedImageUrl ? 'Replace Desktop Image' : 'Choose Desktop Image'}</button>
            </div>
            <input type="hidden" {...register('imageUrl')} />
            {errors.imageUrl && <p className="text-[9px] text-red-650 mt-1">{errors.imageUrl.message}</p>}
          </div>

          {/* 2. Mobile View Banner Image */}
          <div className="space-y-1.5 border border-neutral-200/80 rounded-xl p-3 bg-neutral-50/50">
            <label className="block text-[10px] font-bold text-neutral-700 uppercase flex items-center justify-between">
              <span>📱 Mobile Banner Image</span>
              <span className="text-[9px] text-neutral-400 font-normal">Optional</span>
            </label>
            {watchedMobileImageUrl ? (
              <div className="relative border border-neutral-200 rounded-xl overflow-hidden bg-white p-2 flex items-center gap-3">
                <RemoteImage src={watchedMobileImageUrl} alt="" width={40} height={40} className="w-10 h-10 object-cover rounded" />
                <span className="text-[10px] text-neutral-400 truncate flex-1 font-mono">{watchedMobileImageUrl}</span>
                <button type="button" onClick={() => setValue('mobileImageUrl', '')} className="text-red-500 hover:text-red-700 p-1"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-neutral-200 bg-white rounded-xl p-4 text-center cursor-pointer hover:border-neutral-400" onClick={() => openPicker('mobile')}>
                <ImageIcon className="w-6 h-6 text-neutral-300 mx-auto mb-1" />
                <p className="text-xs text-neutral-600 font-medium">Select Mobile Banner</p>
                <p className="text-[9px] text-neutral-400 mt-0.5 font-medium">{getMobileRecommendation()}</p>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1">
              <button type="button" onClick={() => openPicker('mobile')} className="bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 font-bold py-1 px-2.5 rounded-lg text-2xs"><ImageIcon className="w-3.5 h-3.5 inline mr-1" />{watchedMobileImageUrl ? 'Replace Mobile Image' : 'Choose Mobile Image'}</button>
            </div>
            <input type="hidden" {...register('mobileImageUrl')} />
          </div>

          <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Link URL</label><input type="text" {...register('linkUrl')} placeholder="https://store.com/collections/dresses" className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 font-mono" />{errors.linkUrl && <p className="text-[9px] text-red-650 mt-1">{errors.linkUrl.message}</p>}</div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Placement</label><select {...register('placement')} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5"><option value="HOMEPAGE_HERO">HOMEPAGE HERO</option><option value="PROMO_BANNER">PROMO BANNER</option><option value="CATALOG_TOP">CATALOG TOP</option></select></div>
            <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Display Order</label><input type="number" {...register('displayOrder', { valueAsNumber: true })} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
            <div><label className="block text-[9px] font-bold text-neutral-500 uppercase">Start Date</label><input type="date" {...register('startDate')} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1" /></div>
            <div><label className="block text-[9px] font-bold text-neutral-500 uppercase">End Date</label><input type="date" {...register('endDate')} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1" /></div>
          </div>
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('ctaEnabled')} className="h-4 w-4 rounded border-neutral-300 text-neutral-900" />
              <span className="text-2xs font-bold text-neutral-500 uppercase">Show &quot;Shop Now&quot; Button</span>
            </label>
            <div className={`flex items-center gap-3 ${!watchedCtaEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <label className="text-[10px] font-bold text-neutral-500 uppercase shrink-0">Button Style</label>
              <select {...register('ctaStyle')} disabled={!watchedCtaEnabled} className="flex-1 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5">
                <option value="solid">Solid</option>
                <option value="transparent">Transparent</option>
              </select>
            </div>
          </div>
          <div className="flex items-center pt-2 border-t border-neutral-100"><input type="checkbox" {...register('isActive')} className="h-4 w-4 rounded border-neutral-300 text-neutral-900" /><label className="ml-2 text-2xs font-bold text-neutral-500 uppercase">Active</label></div>
          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs disabled:opacity-55 flex items-center">{isSubmitting && <ButtonLoader />} {banner ? 'Save Changes' : 'Create Banner'}</button>
          </div>
        </form>
      </div>
      <MediaPickerModal open={showMediaPicker} onClose={() => { setShowMediaPicker(false); setPickerTarget(null); }} onSelect={handleMediaSelected} mimeFilter="image/" />
    </div>
  );
}
