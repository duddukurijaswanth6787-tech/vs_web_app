'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOffers, useCreateOffer, useUpdateOffer } from '@/features/offers/offer.hooks';
import { OfferType, OfferResponse } from '@/features/offers/offer.types';
import { useProducts } from '@/features/catalog/products/product.hooks';
import { useCategories } from '@/features/catalog/categories/category.hooks';
import { useBrands } from '@/features/catalog/brands/brand.hooks';
import { ButtonLoader } from '@/components/feedback/FeedbackStates';
import { Search, Plus, Edit3, X, Sparkles } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDate } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/utils/api-error';
import DataTable from '@/components/tables/DataTable';
import type { Column } from '@/components/tables/DataTable';

const offerSchema = z.object({
  name: z.string().min(3, 'Name is too short').max(50),
  description: z.string().max(200).optional(),
  type: z.enum([OfferType.PRODUCT, OfferType.CATEGORY, OfferType.BRAND, OfferType.FESTIVAL, OfferType.FLASH_SALE]),
  value: z.number().min(0, 'Discount value cannot be negative'),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional(),
  applicableTo: z.string().optional(),
  applicableIds: z.array(z.string().uuid('Invalid entity identifier')).optional(),
  priority: z.number().int().min(0),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isActive: z.boolean(),
}).refine(data => { return new Date(data.endDate).getTime() >= new Date(data.startDate).getTime(); }, { message: 'End date must be after or equal to start date', path: ['endDate'] });

type FormValues = z.infer<typeof offerSchema>;

export default function OffersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const pageParam = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const typeFilter = searchParams.get('type') || '';

  const [localSearch, setLocalSearch] = useState(search);
  const [activeOffer, setActiveOffer] = useState<OfferResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: listData, isLoading, isError, refetch } = useOffers({ page: pageParam, limit: 10, search: search || undefined, type: (typeFilter as OfferType) || undefined });

  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) { params.set(key, value); } else { params.delete(key); }
    params.set('page', '1');
    router.push(`/admin/offers?${params}`);
  };

  const isEditor = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));

  const columns: Column<OfferResponse>[] = [
    { key: 'name', label: 'Offer', render: (o) => <div><div className="font-bold text-neutral-900 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-500" />{o.name}</div><div className="text-[10px] text-neutral-400 max-w-[200px] truncate">{o.description || ''}</div></div> },
    { key: 'type', label: 'Target', render: (o) => <span className="uppercase text-2xs font-semibold text-neutral-600">{o.type}</span> },
    { key: 'value', label: 'Discount', render: (o) => <span className="font-mono font-bold text-neutral-900 block text-right">₹{o.value}</span> },
    { key: 'priority', label: 'Priority', render: (o) => <span className="font-semibold text-center block">{o.priority}</span> },
    { key: 'dates', label: 'Schedule', render: (o) => <div className="text-neutral-500"><div>Start: {formatDate(o.startDate)}</div><div className="text-[10px] text-neutral-400">End: {formatDate(o.endDate)}</div></div> },
    { key: 'isActive', label: 'Status', render: (o) => <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${o.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-neutral-100 text-neutral-500'}`}>{o.isActive ? 'Active' : 'Inactive'}</span> },
    { key: 'actions', label: 'Actions', render: (o) => isEditor ? (
      <div className="flex justify-end">
        <button onClick={() => { setActiveOffer(o); setIsDialogOpen(true); }} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600"><Edit3 className="w-4 h-4" /></button>
      </div>
    ) : <span /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Campaign Offers</h1>
          <p className="text-xs text-neutral-400 mt-1">Configure auto-applied catalog discounts, set up product targets, and schedule flash sales.</p>
        </div>
        {isEditor && <button onClick={() => { setActiveOffer(null); setIsDialogOpen(true); }} className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-sm"><Plus className="w-4 h-4" /> Create Offer</button>}
      </div>

      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={(e) => { e.preventDefault(); updateQuery('search', localSearch); }} className="relative w-full md:w-80">
          <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search by offer name..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-neutral-900" />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </form>
        <select value={typeFilter} onChange={(e) => updateQuery('type', e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs">
          <option value="">All Types</option>
          <option value="PRODUCT">PRODUCT</option>
          <option value="CATEGORY">CATEGORY</option>
          <option value="BRAND">BRAND</option>
          <option value="FESTIVAL">FESTIVAL</option>
          <option value="FLASH_SALE">FLASH SALE</option>
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
        onPageChange={(p) => { const params = new URLSearchParams(searchParams.toString()); params.set('page', String(p)); router.push(`/admin/offers?${params}`); }}
        rowKey={(o) => o.id}
        emptyMessage="No campaign offers created yet."
      />

      {isDialogOpen && <OfferDialog offer={activeOffer} onClose={() => { setIsDialogOpen(false); setActiveOffer(null); }} onSuccess={() => refetch()} />}
    </div>
  );
}

function OfferDialog({ offer, onClose, onSuccess }: { offer: OfferResponse | null; onClose: () => void; onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const createMut = useCreateOffer();
  const updateMut = useUpdateOffer();
  const { data: products } = useProducts({ limit: 1000 });
  const { data: categories } = useCategories({ limit: 100 });
  const { data: brands } = useBrands({ limit: 100 });

  const { register, handleSubmit, setValue, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      name: offer?.name || '', description: offer?.description || '',
      type: (offer?.type || OfferType.PRODUCT) as OfferType, value: offer?.value || 0,
      minOrderAmount: offer?.minOrderAmount || 0, maxDiscountAmount: offer?.maxDiscountAmount || 0,
      applicableTo: offer?.applicableTo || '', applicableIds: offer?.applicableIds || [],
      priority: offer?.priority || 0, startDate: offer?.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : '',
      endDate: offer?.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : '', isActive: offer?.isActive ?? true,
    },
  });

  const selectedType = useWatch({ control, name: 'type' });
  const selectedApplicableIds = useWatch({ control, name: 'applicableIds' });

  const applicableOptions = selectedType === 'PRODUCT' ? products?.data?.map(p => ({ id: p.id, name: p.name }))
    : selectedType === 'CATEGORY' ? categories?.data?.map(c => ({ id: c.id, name: c.name }))
    : selectedType === 'BRAND' ? brands?.data?.map(b => ({ id: b.id, name: b.name }))
    : [];

  const toggleId = (id: string) => {
    const current = selectedApplicableIds || [];
    const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
    setValue('applicableIds', next);
  };

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const payload = { ...values, description: values.description || undefined, minOrderAmount: values.minOrderAmount || undefined, maxDiscountAmount: values.maxDiscountAmount || undefined, applicableTo: values.applicableTo || undefined, startDate: new Date(values.startDate).toISOString(), endDate: new Date(values.endDate).toISOString() };
      if (offer) await updateMut.mutateAsync({ id: offer.id, dto: payload });
      else await createMut.mutateAsync(payload);
      onSuccess(); onClose();
    } catch (err: unknown) { console.error(err); setError(getApiErrorMessage(err, 'Failed to save offer')); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">{offer ? 'Edit Offer' : 'Create Offer'}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"><X className="h-5 w-5" /></button>
        </div>
        {error && <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-2.5 text-2xs text-red-650 font-semibold">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Offer Name</label><input type="text" {...register('name')} placeholder="e.g. Diwali Festive Sale" className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5" />{errors.name && <p className="text-[9px] text-red-650 mt-1">{errors.name.message}</p>}</div>
            <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Discount Type</label><select {...register('type')} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5"><option value="PRODUCT">PRODUCT</option><option value="CATEGORY">CATEGORY</option><option value="BRAND">BRAND</option><option value="FESTIVAL">FESTIVAL</option><option value="FLASH_SALE">FLASH SALE</option></select></div>
          </div>
          <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Description</label><input type="text" {...register('description')} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Discount Value</label><input type="number" {...register('value', { valueAsNumber: true })} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5" />{errors.value && <p className="text-[9px] text-red-650 mt-1">{errors.value.message}</p>}</div>
            <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Priority</label><input type="number" {...register('priority', { valueAsNumber: true })} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5" /></div>
            <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Min Order</label><input type="number" {...register('minOrderAmount', { valueAsNumber: true })} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
            <div><label className="block text-[9px] font-bold text-neutral-500 uppercase">Start Date</label><input type="date" {...register('startDate')} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1" /></div>
            <div><label className="block text-[9px] font-bold text-neutral-500 uppercase">End Date</label><input type="date" {...register('endDate')} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1" />{errors.endDate && <p className="text-[9px] text-red-650 mt-1">{errors.endDate.message}</p>}</div>
          </div>
          <div className="flex items-center"><input type="checkbox" {...register('isActive')} className="h-4 w-4 rounded border-neutral-300 text-neutral-900" /><label className="ml-2 text-2xs font-bold text-neutral-500 uppercase">Active</label></div>
          <div className="pt-2 border-t border-neutral-100">
            <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Applicable Items</label>
            {selectedType === 'FESTIVAL' || selectedType === 'FLASH_SALE' ? (
              <p className="text-neutral-400 text-2xs">Applies to all products — use coupon or checkout rules for fine control.</p>
            ) : (
              <div className="max-h-32 overflow-y-auto border border-neutral-200 rounded-lg p-2 space-y-1">
                {applicableOptions?.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-neutral-50 p-1 rounded">
                    <input type="checkbox" checked={selectedApplicableIds?.includes(opt.id)} onChange={() => toggleId(opt.id)} className="rounded border-neutral-300" />
                    {opt.name}
                  </label>
                )) || <p className="text-neutral-400 text-2xs">No items found</p>}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs disabled:opacity-55 flex items-center">{isSubmitting && <ButtonLoader />} {offer ? 'Save Changes' : 'Create Offer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
