'use client';

import { useMemo, useState } from 'react';
import { Save, RotateCcw, Undo2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  useStorefrontTheme,
  useUpdateStorefrontTheme,
  useResetStorefrontTheme,
} from '@/features/storefront/storefront.hooks';
import { PageLoader, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/api-error';

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Relative luminance, per WCAG. Used only to warn -- the shop owner keeps the
 * final say, but light-on-light is invisible and a customer cannot report
 * what they cannot read.
 */
function luminance(hex: string): number {
  const full =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;
  const channels = [1, 3, 5].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Background/text pairs worth checking, by token name. */
const CONTRAST_PAIRS: [string, string, string][] = [
  ['announcement-bg', 'announcement-text', 'Announcement bar'],
  ['header-bg', 'header-text', 'Header'],
  ['hero-bg', 'hero-text', 'Hero banner'],
  ['category-bg', 'category-text', 'Category circles'],
  ['product-card-bg', 'product-card-text', 'Product cards'],
  ['benefits-bg', 'benefits-text', 'Benefits strip'],
  ['testimonials-bg', 'testimonials-text', 'Testimonials'],
  ['newsletter-bg', 'newsletter-text', 'Newsletter'],
  ['footer-bg', 'footer-text', 'Footer'],
  ['brand-primary', 'brand-on-primary', 'Buttons'],
];

export default function StorefrontThemePage() {
  const { user } = useAuth();
  const isSuperAdmin = !!user?.roles?.includes('super_admin');

  const { data: theme, isLoading } = useStorefrontTheme();
  const updateMut = useUpdateStorefrontTheme();
  const resetMut = useResetStorefrontTheme();

  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  // Saved values with the unsaved edits laid over them -- this is what both
  // the swatches and the preview read, so the preview is never out of step.
  const live = useMemo(
    () => ({ ...(theme?.colors ?? {}), ...draft }),
    [theme, draft],
  );

  const warnings = useMemo(() => {
    const out: string[] = [];
    for (const [bgToken, fgToken, label] of CONTRAST_PAIRS) {
      const bg = live[bgToken];
      const fg = live[fgToken];
      if (!HEX.test(bg ?? '') || !HEX.test(fg ?? '')) continue;
      const ratio = contrastRatio(bg, fg);
      if (ratio < 4.5) {
        out.push(`${label}: text is hard to read on this background (${ratio.toFixed(1)}:1, aim for 4.5:1)`);
      }
    }
    return out;
  }, [live]);

  const dirty = Object.keys(draft).length > 0;

  const setColor = (token: string, value: string) =>
    setDraft((prev) => ({ ...prev, [token]: value }));

  const revertOne = (token: string) =>
    setDraft((prev) => {
      const next = { ...prev };
      delete next[token];
      return next;
    });

  const handleSave = async () => {
    setError('');
    const invalid = Object.entries(draft).find(([, v]) => !HEX.test(v));
    if (invalid) {
      setError(`${invalid[0]} is not a valid colour. Use a hex value like #0284c7.`);
      return;
    }
    try {
      await updateMut.mutateAsync(draft);
      setDraft({});
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save the theme.'));
    }
  };

  const handleResetAll = async () => {
    setError('');
    try {
      await resetMut.mutateAsync();
      setDraft({});
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not reset the theme.'));
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-sm text-neutral-600">
        Storefront colours are managed by the super admin only.
      </div>
    );
  }

  if (isLoading || !theme) return <PageLoader />;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Storefront Colours</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Each section of the customer site, set separately. Changes go live
            for everyone as soon as you save.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetAll}
            disabled={resetMut.isPending}
            className="px-4 py-2 rounded-xl border border-neutral-300 text-sm font-semibold hover:bg-neutral-50 flex items-center gap-2 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            {resetMut.isPending ? 'Resetting…' : 'Reset all'}
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || updateMut.isPending}
            className="px-5 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {updateMut.isPending ? <ButtonLoader /> : <Save className="w-4 h-4" />}
            {dirty ? `Save ${Object.keys(draft).length} change(s)` : 'Saved'}
          </button>
        </div>
      </header>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {warnings.length > 0 && (
        <div className="text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 space-y-1">
          <p className="font-bold">Readability check</p>
          {warnings.map((w) => (
            <p key={w}>• {w}</p>
          ))}
          <p className="text-xs opacity-80 pt-1">
            You can still save — this is a warning, not a block.
          </p>
        </div>
      )}

      {/* Preview reads the same values as the inputs, so what you see here is
          what the storefront will use. */}
      <section
        className="rounded-2xl border border-neutral-200 overflow-hidden"
        style={{ background: live['page-bg'] }}
      >
        <div
          className="px-4 py-1.5 text-xs text-center"
          style={{ background: live['announcement-bg'], color: live['announcement-text'] }}
        >
          Free shipping on orders over ₹2,000
        </div>
        <div
          className="px-4 py-3 flex items-center justify-between border-b"
          style={{
            background: live['header-bg'],
            color: live['header-text'],
            borderColor: live['header-border'],
          }}
        >
          <span className="font-bold">Vasanthi&apos;s Signature</span>
          <span className="text-xs">Shop · Collections · Offers</span>
        </div>
        <div className="p-5" style={{ background: live['hero-bg'], color: live['hero-text'] }}>
          <p className="font-bold">New season</p>
          <button
            className="mt-2 px-4 py-2 rounded-lg text-sm font-bold"
            style={{ background: live['brand-primary'], color: live['brand-on-primary'] }}
          >
            Shop now
          </button>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          <div
            className="rounded-xl p-3 border border-black/5"
            style={{ background: live['product-card-bg'], color: live['product-card-text'] }}
          >
            <p className="text-sm font-semibold">Silk Kurti</p>
            <p className="text-sm font-bold" style={{ color: live['product-price'] }}>
              ₹2,499
            </p>
          </div>
          <div
            className="rounded-xl p-3 text-sm"
            style={{ background: live['benefits-bg'], color: live['benefits-text'] }}
          >
            Easy returns · Secure payments
          </div>
        </div>
        <div
          className="px-4 py-4 text-xs"
          style={{ background: live['footer-bg'], color: live['footer-text'] }}
        >
          <p className="font-bold" style={{ color: live['footer-heading'] }}>
            Customer Care
          </p>
          <p className="mt-1">Contact · Track Order · FAQs</p>
        </div>
      </section>

      {theme.sections.map((section) => (
        <section
          key={section.key}
          className="bg-white border border-neutral-200 rounded-2xl p-5"
        >
          <h2 className="font-bold text-neutral-900 mb-3">{section.label}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {section.tokens.map(({ token, label }) => {
              const value = live[token] ?? '';
              const changed = token in draft;
              const isDefault = value === theme.defaults[token];
              return (
                <div
                  key={token}
                  className="flex items-center gap-3 border border-neutral-200 rounded-xl px-3 py-2"
                >
                  <input
                    type="color"
                    value={HEX.test(value) ? value : '#000000'}
                    onChange={(e) => setColor(token, e.target.value)}
                    className="w-9 h-9 rounded-lg border border-neutral-200 bg-white cursor-pointer shrink-0"
                    aria-label={label}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-800 truncate">{label}</p>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setColor(token, e.target.value)}
                      spellCheck={false}
                      className="w-full text-xs font-mono text-neutral-500 outline-none bg-transparent"
                    />
                  </div>
                  {changed && (
                    <button
                      onClick={() => revertOne(token)}
                      title="Undo this change"
                      className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 shrink-0"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {!changed && !isDefault && (
                    <button
                      onClick={() => setColor(token, theme.defaults[token])}
                      title="Back to the default colour"
                      className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
