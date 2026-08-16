/**
 * Shared Active/Scheduled/Expired/Inactive status for anything with an
 * isActive flag plus a start/end date range (coupons, offers). An isActive
 * record whose date range hasn't started yet, or has already ended, should
 * never read as "Active" in the admin UI.
 */
export type PromoStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'INACTIVE';

export function getPromoStatus(
  isActive: boolean,
  startDate?: string | Date,
  endDate?: string | Date,
): PromoStatus {
  if (!isActive) return 'INACTIVE';
  const now = Date.now();
  if (startDate && new Date(startDate).getTime() > now) return 'SCHEDULED';
  if (endDate && new Date(endDate).getTime() < now) return 'EXPIRED';
  return 'ACTIVE';
}

export const PROMO_STATUS_STYLES: Record<PromoStatus, string> = {
  ACTIVE: 'bg-green-50 text-green-700 border border-green-100',
  SCHEDULED: 'bg-amber-50 text-amber-700 border border-amber-100',
  EXPIRED: 'bg-red-50 text-red-650 border border-red-100',
  INACTIVE: 'bg-neutral-100 text-neutral-500',
};

export const PROMO_STATUS_LABELS: Record<PromoStatus, string> = {
  ACTIVE: 'Active',
  SCHEDULED: 'Scheduled',
  EXPIRED: 'Expired',
  INACTIVE: 'Inactive',
};
