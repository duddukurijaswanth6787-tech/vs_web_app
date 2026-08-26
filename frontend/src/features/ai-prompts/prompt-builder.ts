/**
 * Turns whatever the Add Product form currently holds into a prompt someone
 * can paste into ChatGPT.
 *
 * The rule the whole feature hangs on: a field with no value never appears.
 * An empty `Fabric:` line invites the model to fill it in, and a fabricated
 * fabric on a product page is a return, a complaint, or worse.
 */

export interface PromptField {
  /** Human label as it appears in the prompt: "Product Name". */
  label: string;
  /** Variable name a template can reference: `product_name`. */
  key: string;
  value: string;
}

/**
 * Empty means empty however it arrives: React Hook Form gives '', selects give
 * undefined, the API gives null, and a tag list that has been emptied is [].
 * A field the admin typed spaces into is empty too.
 */
export function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.some(hasValue);
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  if (typeof value === 'object') return Object.values(value).some(hasValue);
  return false;
}

/** Renders a value for the prompt. Arrays become a comma list. */
function format(value: unknown): string {
  if (Array.isArray(value)) {
    return value.filter(hasValue).map(format).join(', ');
  }
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

/**
 * Keeps only the fields that carry information, in the order given.
 * Order is the caller's, so the prompt reads the way a person would describe
 * the garment rather than in whatever order the form stores it.
 */
export function collectFields(
  candidates: { label: string; key: string; value: unknown }[],
): PromptField[] {
  return candidates
    .filter((f) => hasValue(f.value))
    .map((f) => ({ label: f.label, key: f.key, value: format(f.value) }));
}

/** The PRODUCT INFORMATION block: one `Label: value` line per populated field. */
export function renderFieldBlock(fields: PromptField[]): string {
  return fields.map((f) => `${f.label}: ${f.value}`).join('\n');
}

export interface RenderOptions {
  template: string;
  rules: string;
  fields: PromptField[];
  /** Appended verbatim; the server owns this text so a template cannot drop it. */
  accuracyRule: string;
  /** Extra lines appended before the accuracy rule, e.g. reference images. */
  extraInstructions?: string[];
}

/**
 * Substitutes the template's variables and appends the accuracy rule.
 *
 * A variable with no value collapses to nothing rather than leaving
 * `{{fabric}}` in the text someone is about to paste into ChatGPT.
 */
export function renderPrompt({
  template,
  rules,
  fields,
  accuracyRule,
  extraInstructions = [],
}: RenderOptions): string {
  const byKey = new Map(fields.map((f) => [f.key, f.value]));

  const values: Record<string, string> = {
    product_fields: renderFieldBlock(fields),
    rules: rules.trim(),
  };

  const body = template.replace(
    /\{\{\s*([a-z_]+)\s*\}\}/gi,
    (_match, name: string) => {
      const key = name.toLowerCase();
      if (key in values) return values[key];
      return byKey.get(key) ?? '';
    },
  );

  const tail = [...extraInstructions.filter((l) => l.trim()), accuracyRule];

  return [collapseBlankRuns(body), ...tail]
    .map((part) => part.trim())
    .filter(Boolean)
    .join('\n\n');
}

/**
 * A variable that resolved to nothing leaves its line behind. Collapsing runs
 * of blank lines keeps the prompt tidy without the template having to know
 * which fields the product happens to have.
 */
function collapseBlankRuns(text: string): string {
  return text
    .split('\n')
    .filter((line, i, all) => line.trim() !== '' || all[i - 1]?.trim() !== '')
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
}

/** Fields worth prompting the admin to fill in, when they are missing. */
export function missingRecommended(
  candidates: { label: string; key: string; value: unknown }[],
  recommended: string[],
): string[] {
  const present = new Set(collectFields(candidates).map((f) => f.key));
  return recommended
    .filter((key) => !present.has(key))
    .map((key) => candidates.find((c) => c.key === key)?.label ?? key);
}

export const REFERENCE_IMAGE_INSTRUCTION =
  'Use the uploaded reference image as the primary visual reference for the product. Preserve its colour, pattern, silhouette and detailing exactly; do not restyle the garment.';
