'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCoupons, useCreateCoupon, useUpdateCoupon } from '@/features/coupons/coupon.hooks';
import { CouponType, CouponResponse } from '@/features/coupons/coupon.types';
import { ButtonLoader } from '@/components/feedback/FeedbackStates';
import { Search, Plus, Edit3, X, Gift } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDate } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/utils/api-error';
import DataTable from '@/components/tables/DataTable';
import type { Column } from '@/components/tables/DataTable';

const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').max(20).regex(/^[A-Z0-9_-]+$/, 'Uppercase alphanumeric characters only'),
  name: z.string().min(3, 'Name must be at least 3 characters').max(50),
  description: z.string().max(200).optional(),
  type: z.enum([CouponType.FLAT, CouponType.PERCENTAGE, CouponType.FREE_SHIPPING]),
  value: z.number().min(0, 'Value cannot be negative'),
  minOrderAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().min(0).optional(),
  usageLimit: z.number().int().min(0).optional(),
  perCustomerLimit: z.number().int().min(1, 'Customer limit must be at least 1'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isActive: z.boolean(),
}).refine(data => { if (data.type === CouponType.PERCENTAGE && data.value > 100) return false; return true; }, { message: 'Percentage value cannot exceed 100%', path: ['value'] })
 .refine(data => { return new Date(data.endDate).getTime() >= new Date(data.startDate).getTime(); }, { message: 'End date must be after or equal to start date', path: ['endDate'] });

type FormValues = z.infer<typeof couponSchema>;

export default function CouponsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const pageParam = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const typeFilter = searchParams.get('type') || '';

  const [localSearch, setLocalSearch] = useState(search);
  const [activeCoupon, setActiveCoupon] = useState<CouponResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: listData, isLoading, isError, refetch } = useCoupons({ page: pageParam, limit: 10, search: search || undefined, type: (typeFilter as CouponType) || undefined });

  const updateQuery = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    value ? params.set(key, value) : params.delete(key);
    params.set('page', '1');
    router.push(`/admin/promotions/coupons?${params}`);
  };

  const isEditor = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));

  const columns: Column<CouponResponse>[] = [
    { key: 'code', label: 'Code', render: (c) => <span className="font-mono font-bold text-neutral-900 text-[10px] flex items-center gap-1.5"><Gift className="w-3.5 h-3.5 text-neutral-400" />{c.code}</span> },
    { key: 'details', label: 'Details', render: (c) => <div><div className="font-bold text-neutral-800">{c.name}</div><div className="text-[10px] font-semibold text-neutral-600">{c.type === 'PERCENTAGE' ? `${c.value}% Off` : c.type === 'FLAT' ? `₹${c.value} Off` : 'Free Shipping'}</div></div> },
    { key: 'minOrderAmount', label: 'Min Order', render: (c) => <span className="font-mono text-neutral-600 block text-right">{c.minOrderAmount ? `₹${c.minOrderAmount}` : '-'}</span> },
    { key: 'usage', label: 'Usage', render: (c) => <span className="text-center block"><span className="font-bold">{c.usedCount}</span>{c.usageLimit ? <span className="text-neutral-400 text-[10px]"> / {c.usageLimit}</span> : null}</span> },
    { key: 'dates', label: 'Validity', render: (c) => <div className="text-neutral-500"><div>Start: {formatDate(c.startDate)}</div><div className="text-[10px] text-neutral-400">End: {formatDate(c.endDate)}</div></div> },
    { key: 'isActive', label: 'Status', render: (c) => <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${c.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-neutral-100 text-neutral-500'}`}>{c.isActive ? 'Active' : 'Inactive'}</span> },
    { key: 'actions', label: 'Actions', render: (c) => isEditor ? (
      <div className="flex justify-end">
        <button onClick={() => { setActiveCoupon(c); setIsDialogOpen(true); }} className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600 hover:text-neutral-900"><Edit3 className="w-4 h-4" /></button>
      </div>
    ) : <span /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Coupons & Promo Codes</h1>
          <p className="text-xs text-neutral-400 mt-1">Configure checkout discount coupons, set usage thresholds, and inspect active usage metrics.</p>
        </div>
        {isEditor && <button onClick={() => { setActiveCoupon(null); setIsDialogOpen(true); }} className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition shadow-sm"><Plus className="w-4 h-4" /> Create Coupon</button>}
      </div>

      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={(e) => { e.preventDefault(); updateQuery('search', localSearch); }} className="relative w-full md:w-80">
          <input value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} placeholder="Search by code or coupon name..."
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-neutral-900" />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </form>
        <select value={typeFilter} onChange={(e) => updateQuery('type', e.target.value)} className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs">
          <option value="">All Types</option>
          <option value="FLAT">FLAT</option>
          <option value="PERCENTAGE">PERCENTAGE</option>
          <option value="FREE_SHIPPING">FREE SHIPPING</option>
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
        onPageChange={(p) => { const params = new URLSearchParams(searchParams.toString()); params.set('page', String(p)); router.push(`/admin/promotions/coupons?${params}`); }}
        rowKey={(c) => c.id}
        emptyMessage="No discount coupons created yet."
      />

      {isDialogOpen && <CouponDialog coupon={activeCoupon} onClose={() => { setIsDialogOpen(false); setActiveCoupon(null); }} onSuccess={() => refetch()} />}
    </div>
  );
}

function CouponDialog({ coupon, onClose, onSuccess }: { coupon: CouponResponse | null; onClose: () => void; onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const createMut = useCreateCoupon();
  const updateMut = useUpdateCoupon();

  const { register, handleSubmit, control, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: coupon?.code || '', name: coupon?.name || '', description: coupon?.description || '',
      type: (coupon?.type || CouponType.PERCENTAGE) as CouponType, value: coupon?.value || 0,
      minOrderAmount: coupon?.minOrderAmount || 0, maxDiscountAmount: coupon?.maxDiscountAmount || 0,
      usageLimit: coupon?.usageLimit || 0, perCustomerLimit: coupon?.perCustomerLimit || 1,
      startDate: coupon?.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
      endDate: coupon?.endDate ? new Date(coupon.endDate).toISOString().split('T')[0] : '',
      isActive: coupon?.isActive ?? true,
    },
  });

  const selectedType = useWatch({ control, name: 'type' });

  React.useEffect(() => { if (selectedType === CouponType.FREE_SHIPPING) setValue('value', 0); }, [selectedType, setValue]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const payload = { ...values, minOrderAmount: values.minOrderAmount || undefined, maxDiscountAmount: values.maxDiscountAmount || undefined, usageLimit: values.usageLimit || undefined, startDate: new Date(values.startDate).toISOString(), endDate: new Date(values.endDate).toISOString() };
      if (coupon) await updateMut.mutateAsync({ id: coupon.id, dto: payload });
      else await createMut.mutateAsync(payload);
      onSuccess(); onClose();
    } catch (err: unknown) { console.error(err); setError(getApiErrorMessage(err, 'Failed to save coupon')); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">{coupon ? 'Edit Coupon Code' : 'Create Coupon Code'}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"><X className="h-5 w-5" /></button>
        </div>
        {error && <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-2.5 text-2xs text-red-650 font-semibold">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Promo Code</label><input type="text" {...register('code')} placeholder="e.g. FASHION50" className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 font-mono" />{errors.code && <p className="text-[9px] text-red-650 mt-1">{errors.code.message}</p>}</div>
            <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Offer Name</label><input type="text" {...register('name')} placeholder="e.g. Festival Season sale" className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5" />{errors.name && <p className="text-[9px] text-red-650 mt-1">{errors.name.message}</p>}</div>
          </div>
          <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Description</label><input type="text" {...register('description')} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5" /></div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
            <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Discount Type</label><select {...register('type')} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5"><option value={CouponType.PERCENTAGE}>PERCENTAGE OFF</option><option value={CouponType.FLAT}>FLAT DISCOUNT</option><option value={CouponType.FREE_SHIPPING}>FREE SHIPPING</option></select></div>
            <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">{selectedType === CouponType.PERCENTAGE ? 'Rate (%)' : selectedType === CouponType.FLAT ? 'Amount (₹)' : 'Value'}</label><input type="number" disabled={selectedType === CouponType.FREE_SHIPPING} {...register('value', { valueAsNumber: true })} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 disabled:opacity-50" />{errors.value && <p className="text-[9px] text-red-650 mt-1">{errors.value.message}</p>}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Min Order (₹)</label><input type="number" {...register('minOrderAmount', { valueAsNumber: true })} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5" /></div>
            <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Max Cap (₹)</label><input type="number" disabled={selectedType !== CouponType.PERCENTAGE} {...register('maxDiscountAmount', { valueAsNumber: true })} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 disabled:opacity-50" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
            <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Total Usage Limit</label><input type="number" {...register('usageLimit', { valueAsNumber: true })} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5" /></div>
            <div><label className="block text-[10px] font-bold text-neutral-500 uppercase">Per Customer Limit</label><input type="number" {...register('perCustomerLimit', { valueAsNumber: true })} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5" />{errors.perCustomerLimit && <p className="text-[9px] text-red-650 mt-1">{errors.perCustomerLimit.message}</p>}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
            <div><label className="block text-[9px] font-bold text-neutral-500 uppercase">Start Date</label><input type="date" {...register('startDate')} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1" /></div>
            <div><label className="block text-[9px] font-bold text-neutral-500 uppercase">End Date</label><input type="date" {...register('endDate')} className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1" />{errors.endDate && <p className="text-[9px] text-red-650 mt-1">{errors.endDate.message}</p>}</div>
          </div>
          <div className="flex items-center pt-2 border-t border-neutral-100"><input type="checkbox" {...register('isActive')} className="h-4 w-4 rounded border-neutral-300 text-neutral-900" /><label className="ml-2 text-2xs font-bold text-neutral-500 uppercase">Active</label></div>
          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs disabled:opacity-55 flex items-center">{isSubmitting && <ButtonLoader />} {coupon ? 'Save Changes' : 'Create Coupon'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
