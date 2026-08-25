import { isFeatureOn } from './hooks';
import type { FeatureToggle } from '@/features/storefront/storefront.types';

const row = (key: string, enabled: boolean): FeatureToggle => ({
  key,
  name: key,
  category: 'CUSTOMER',
  enabled,
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('isFeatureOn', () => {
  it('is false while the features query is still loading', () => {
    // The unsafe default: returning true here shows customers a feature the
    // store has switched off, for as long as the fetch takes.
    expect(isFeatureOn(undefined, 'returns')).toBe(false);
  });

  it('is false when the toggle row does not exist', () => {
    expect(isFeatureOn([row('wishlist', true)], 'returns')).toBe(false);
  });

  it('mirrors the row when present', () => {
    expect(isFeatureOn([row('returns', true)], 'returns')).toBe(true);
    expect(isFeatureOn([row('returns', false)], 'returns')).toBe(false);
  });

  it('matches on key, not position', () => {
    const list = [row('wishlist', true), row('returns', false), row('reviews', true)];
    expect(isFeatureOn(list, 'returns')).toBe(false);
    expect(isFeatureOn(list, 'reviews')).toBe(true);
  });
});
