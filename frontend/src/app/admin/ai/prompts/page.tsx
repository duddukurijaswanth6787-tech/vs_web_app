'use client';

import { useMemo, useState } from 'react';
import { Save, RotateCcw, Plus, History } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  usePromptHistory,
  usePromptTemplates,
  useResetPromptTemplate,
  useUpdatePromptTemplate,
} from '@/features/ai-prompts/ai-prompt.hooks';
import type { PromptTemplate, PromptType } from '@/features/ai-prompts/ai-prompt.service';
import { collectFields, renderPrompt } from '@/features/ai-prompts/prompt-builder';
import { PageLoader, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/api-error';

/** Stand-in product used for the preview, so the admin sees a real prompt. */
const SAMPLE = [
  { label: 'Product Name', key: 'product_name', value: 'Floral Printed Anarkali Dress' },
  { label: 'Category', key: 'category', value: 'Anarkali Dresses' },
  { label: 'Fabric', key: 'fabric', value: '' },
  { label: 'Colour', key: 'color', value: '' },
  { label: 'Pattern', key: 'pattern', value: 'Floral' },
  { label: 'Occasion', key: 'occasion', value: '' },
];

export default function AiPromptTemplatesPage() {
  const { user } = useAuth();
  const isSuperAdmin = !!user?.roles?.includes('super_admin');

  const { data, isLoading } = usePromptTemplates(isSuperAdmin);
  const updateMut = useUpdatePromptTemplate();
  const resetMut = useResetPromptTemplate();

  const [selected, setSelected] = useState<PromptType | null>(null);
  const [draft, setDraft] = useState<Partial<PromptTemplate>>({});
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const { data: history } = usePromptHistory(showHistory ? selected : null);

  const templates = data?.templates ?? [];
  const active = templates.find((t) => t.type === selected) ?? null;
  const merged: PromptTemplate | null = active ? { ...active, ...draft } : null;

  const unsupported = useMemo(() => {
    if (!merged) return [];
    const known = new Set(data?.variables ?? []);
    return [...new Set([...merged.template.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/gi)].map((m) => m[1].toLowerCase()))]
      .filter((v) => !known.has(v));
  }, [merged, data]);

  const preview = useMemo(() => {
    if (!merged) return '';
    return renderPrompt({
      template: merged.template,
      rules: merged.rules,
      fields: collectFields(SAMPLE),
      accuracyRule: data?.accuracyRule ?? '',
    });
  }, [merged, data]);

  const select = (type: PromptType) => {
    setSelected(type);
    setDraft({});
    setError('');
    setShowHistory(false);
  };

  const save = async () => {
    if (!merged) return;
    setError('');
    try {
      await updateMut.mutateAsync({ type: merged.type, body: draft });
      setDraft({});
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save the template.'));
    }
  };

  const insertVariable = (variable: string) => {
    if (!merged) return;
    setDraft((d) => ({ ...d, template: `${d.template ?? merged.template}{{${variable}}}` }));
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-sm text-neutral-600">
        AI prompt templates are managed by the super admin only.
      </div>
    );
  }
  if (isLoading || !data) return <PageLoader />;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-6xl">
      <header>
        <h1 className="text-xl font-bold text-neutral-900">AI Prompt Templates</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          These shape the prompts the Add Product page builds. Editing here changes
          every future prompt; editing a prompt on a product changes only that product.
        </p>
      </header>

      <div className="grid lg:grid-cols-[260px_1fr] gap-5">
        <nav className="space-y-1.5">
          {templates.map((t) => (
            <button
              key={t.type}
              onClick={() => select(t.type)}
              className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm ${
                selected === t.type
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 font-semibold'
                  : 'border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <span className="block truncate">{t.name}</span>
              <span className="text-[11px] text-neutral-500">
                v{t.version} · {t.status === 'ACTIVE' ? 'Active' : 'Inactive'}
              </span>
            </button>
          ))}
        </nav>

        {!merged ? (
          <p className="text-sm text-neutral-500">Select a template to edit.</p>
        ) : (
          <section className="space-y-4">
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-neutral-700">Template Name</span>
                  <input
                    value={merged.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm"
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-semibold text-neutral-700">Status</span>
                  <select
                    value={merged.status}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, status: e.target.value as 'ACTIVE' | 'INACTIVE' }))
                    }
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm bg-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </label>
              </div>

              <div className="space-y-1">
                <span className="text-sm font-semibold text-neutral-700">Prompt Template</span>
                <textarea
                  value={merged.template}
                  onChange={(e) => setDraft((d) => ({ ...d, template: e.target.value }))}
                  spellCheck={false}
                  className="w-full min-h-50 rounded-xl border border-neutral-300 p-3 text-xs font-mono"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {data.variables.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="text-[11px] font-mono px-2 py-1 rounded-lg border border-neutral-200 hover:bg-neutral-50 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <label className="space-y-1 block">
                <span className="text-sm font-semibold text-neutral-700">Rules</span>
                <textarea
                  value={merged.rules}
                  onChange={(e) => setDraft((d) => ({ ...d, rules: e.target.value }))}
                  spellCheck={false}
                  className="w-full min-h-37 rounded-xl border border-neutral-300 p-3 text-xs font-mono"
                />
              </label>

              {unsupported.length > 0 && (
                <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  Unsupported variable: {unsupported.map((v) => `{{${v}}}`).join(', ')} — this
                  template cannot be activated until it is removed.
                </p>
              )}
              {error && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={save}
                  disabled={Object.keys(draft).length === 0 || updateMut.isPending}
                  className="px-5 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  {updateMut.isPending ? <ButtonLoader /> : <Save className="w-4 h-4" />}
                  Save as v{merged.version + 1}
                </button>
                <button
                  onClick={() => resetMut.mutate(merged.type)}
                  disabled={resetMut.isPending}
                  className="px-4 py-2 rounded-xl border border-neutral-300 text-sm font-semibold flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Reset to default
                </button>
                <button
                  onClick={() => setShowHistory((v) => !v)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 text-sm font-semibold flex items-center gap-2"
                >
                  <History className="w-4 h-4" /> Versions
                </button>
              </div>

              {showHistory && (
                <div className="text-xs text-neutral-600 space-y-1 border-t border-neutral-100 pt-3">
                  <p className="font-semibold text-neutral-800">
                    v{merged.version} — active
                  </p>
                  {(history ?? []).map((h) => (
                    <p key={`${h.version}-${h.updatedAt}`}>
                      v{h.version} — {h.updatedAt ? new Date(h.updatedAt).toLocaleString() : 'built-in default'}
                    </p>
                  ))}
                  {(history ?? []).length === 0 && <p>No earlier versions yet.</p>}
                </div>
              )}
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl p-5">
              <h2 className="font-bold text-neutral-900 text-sm mb-2">
                Preview — sample product with fabric, colour and occasion left empty
              </h2>
              <pre className="text-xs font-mono whitespace-pre-wrap text-neutral-700 bg-neutral-50 rounded-xl p-3 overflow-x-auto">
                {preview}
              </pre>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
