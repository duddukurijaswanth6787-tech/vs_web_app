'use client';

import React, { useMemo, useState } from 'react';
import { Sparkles, Copy, Check, X, RefreshCw, ChevronDown } from 'lucide-react';
import { usePromptTemplates } from './ai-prompt.hooks';
import type { PromptTemplate } from './ai-prompt.service';
import {
  collectFields,
  missingRecommended,
  REFERENCE_IMAGE_INSTRUCTION,
  renderPrompt,
} from './prompt-builder';
import { getApiErrorMessage } from '@/utils/api-error';

export interface AiFieldCandidate {
  label: string;
  key: string;
  value: unknown;
}

interface Props {
  /** Everything the form currently holds, in the order it should read. */
  candidates: AiFieldCandidate[];
  /** Fields worth nudging the admin about when absent. */
  recommended?: string[];
  /** Reference image URLs already attached to the product, if any. */
  referenceImages?: string[];
}

/**
 * Builds copyable prompts from whatever the Add Product form currently holds.
 *
 * Rendering happens here rather than on the server: the form data is already
 * in the browser, so posting a half-finished product somewhere just to get a
 * string back would be a round trip for nothing -- and it keeps the section
 * from being able to break product creation.
 */
export function AiContentAssistant({
  candidates,
  recommended = ['fabric', 'color', 'pattern', 'occasion'],
  referenceImages = [],
}: Props) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, error } = usePromptTemplates(open);

  const [useReferenceImages, setUseReferenceImages] = useState(true);
  const [preview, setPreview] = useState<{ title: string; text: string } | null>(null);
  const [generated, setGenerated] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [copyError, setCopyError] = useState('');

  const fields = useMemo(() => collectFields(candidates), [candidates]);
  const missing = useMemo(
    () => missingRecommended(candidates, recommended),
    [candidates, recommended],
  );

  const activeTemplates = (data?.templates ?? []).filter((t) => t.status === 'ACTIVE');

  const buildPrompt = (template: PromptTemplate): string =>
    renderPrompt({
      template: template.template,
      rules: template.rules,
      fields,
      accuracyRule: data?.accuracyRule ?? '',
      extraInstructions:
        template.type === 'IMAGE_GENERATION' &&
        useReferenceImages &&
        referenceImages.length > 0
          ? [REFERENCE_IMAGE_INSTRUCTION]
          : [],
    });

  const generate = (template: PromptTemplate) => {
    const text = buildPrompt(template);
    setGenerated((prev) => ({ ...prev, [template.type]: text }));
    setPreview({ title: template.name, text });
  };

  const generateAll = () => {
    const next: Record<string, string> = {};
    for (const t of activeTemplates) next[t.type] = buildPrompt(t);
    setGenerated(next);
    setPreview(null);
  };

  const copy = async (type: string, text: string) => {
    setCopyError('');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard is blocked without a secure context or user gesture in some
      // browsers. Say so rather than looking like nothing happened.
      setCopyError('Could not copy automatically. Select the text and copy it manually.');
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 sm:px-6 py-4 flex items-center gap-2 text-left"
      >
        <Sparkles className="w-4 h-4 text-[var(--brand-primary)]" />
        <h3 className="text-base font-bold text-neutral-900 flex-1">AI Content Assistant</h3>
        <span className="text-xs text-neutral-500 hidden sm:inline">
          {fields.length} product detail{fields.length === 1 ? '' : 's'} available
        </span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-4 sm:px-6 pb-6 space-y-4 border-t border-neutral-100 pt-4">
          <p className="text-xs text-neutral-500">
            Builds a prompt from the details you have entered, ready to paste into
            ChatGPT. Nothing is sent anywhere and nothing on this form is overwritten.
          </p>

          <div className="rounded-xl bg-neutral-50 border border-neutral-200 px-4 py-3 text-xs">
            <p className="font-semibold text-neutral-800">
              {fields.length} product detail{fields.length === 1 ? '' : 's'} available
            </p>
            {missing.length > 0 && (
              <p className="text-neutral-500 mt-0.5">
                For better results, consider adding: {missing.join(' • ')}
              </p>
            )}
          </div>

          {referenceImages.length > 0 && (
            <div className="rounded-xl border border-neutral-200 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-neutral-800">Reference Images</p>
                <label className="flex items-center gap-2 text-xs text-neutral-600">
                  <input
                    type="checkbox"
                    checked={useReferenceImages}
                    onChange={(e) => setUseReferenceImages(e.target.checked)}
                    className="rounded border-neutral-300"
                  />
                  Use in image prompt
                </label>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {referenceImages.slice(0, 6).map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover border border-neutral-200 shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {isLoading && <p className="text-xs text-neutral-500">Loading prompt templates…</p>}

          {isError && (
            <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              {getApiErrorMessage(error, 'Could not load prompt templates.')} You can still
              save the product normally.
            </p>
          )}

          {!isLoading && !isError && activeTemplates.length === 0 && (
            <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              No active prompt templates. A super admin can enable them in Admin → AI
              Content → Prompt Templates. Product creation is unaffected.
            </p>
          )}

          {activeTemplates.length > 0 && (
            <>
              <button
                type="button"
                onClick={generateAll}
                className="px-4 py-2 rounded-xl bg-[var(--brand-primary)] text-white text-xs font-bold"
              >
                Generate All Prompts
              </button>

              <div className="grid sm:grid-cols-2 gap-2">
                {activeTemplates.map((t) => (
                  <div
                    key={t.type}
                    className="flex items-center gap-2 border border-neutral-200 rounded-xl px-3 py-2"
                  >
                    <span className="text-xs font-medium text-neutral-800 flex-1 truncate">
                      {generated[t.type] && <Check className="w-3 h-3 inline mr-1 text-emerald-600" />}
                      {t.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => generate(t)}
                      className="text-xs font-semibold text-[var(--brand-primary)] px-2 py-1 rounded-lg hover:bg-neutral-100"
                    >
                      {generated[t.type] ? 'Preview' : 'Generate'}
                    </button>
                    {generated[t.type] && (
                      <button
                        type="button"
                        onClick={() => copy(t.type, generated[t.type])}
                        className="text-xs font-semibold text-neutral-600 px-2 py-1 rounded-lg hover:bg-neutral-100"
                      >
                        {copied === t.type ? '✓ Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {copyError && <p className="text-xs text-red-700">{copyError}</p>}
        </div>
      )}

      {preview && (
        <PromptPreview
          title={preview.title}
          text={preview.text}
          copied={copied === 'preview'}
          copyError={copyError}
          onCopy={(text) => copy('preview', text)}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

/**
 * Editable on purpose: an admin often wants one extra sentence for a single
 * product. The edit lives here and dies with the modal -- the saved template
 * is only changed from Admin → AI Content.
 */
function PromptPreview({
  title,
  text,
  copied,
  copyError,
  onCopy,
  onClose,
}: {
  title: string;
  text: string;
  copied: boolean;
  copyError: string;
  onCopy: (text: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(text);
  const edited = draft !== text;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-2xl sm:rounded-2xl max-h-[90dvh] flex flex-col">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-neutral-200">
          <h4 className="font-bold text-neutral-900 flex-1 text-sm">{title} Prompt</h4>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
          className="flex-1 min-h-75 m-5 p-3 text-xs font-mono border border-neutral-200 rounded-xl outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30 resize-none"
        />

        <div className="px-5 pb-5 space-y-2">
          {copyError && <p className="text-xs text-red-700">{copyError}</p>}
          {edited && (
            <p className="text-xs text-neutral-500">
              Edited for this product only — the saved template is unchanged.
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCopy(draft)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white text-sm font-bold flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Prompt copied' : 'Copy Prompt'}
            </button>
            {edited && (
              <button
                type="button"
                onClick={() => setDraft(text)}
                title="Discard my edits"
                className="px-3 py-2.5 rounded-xl border border-neutral-300 text-neutral-600"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
