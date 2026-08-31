/**
 * Front-end mirror of the backend's shared validators.
 *
 * A single source of truth for what a valid Indian phone / PIN / HSN / GSTIN
 * / rupee amount looks like, so the form on the page rejects the same values
 * the server would. Every rule matches its counterpart in
 * `backend/src/common/validation/decorators.validation.ts` -- keep the two
 * files in step when either changes.
 *
 * Each function returns an error string on failure and `null` on success, so
 * form code reads like `error = validatePhone(input)`.
 */

/** 10-digit Indian mobile, starting 6-9. +91 or 91 prefix, spaces or hyphens allowed. */
export function validatePhone(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return 'Enter a phone number.';
  const digits = value.replace(/[\s-]/g, '').replace(/^\+?91/, '');
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return 'Phone must be 10 digits and start with 6, 7, 8 or 9.';
  }
  return null;
}

/** Normalises phone input to just the 10 digits stored on the server. */
export function normalizePhone(value: string): string {
  return value.replace(/[\s-]/g, '').replace(/^\+?91/, '');
}

/** 6-digit Indian PIN code; never starts with 0. */
export function validatePincode(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return 'Enter a PIN code.';
  return /^[1-9]\d{5}$/.test(value)
    ? null
    : 'PIN code must be 6 digits and cannot start with 0.';
}

/** HSN code — 4 to 8 digits. */
export function validateHsn(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return 'Enter an HSN code.';
  return /^\d{4,8}$/.test(value) ? null : 'HSN code must be 4 to 8 digits.';
}

/** 15-character Indian GSTIN. */
export function validateGstin(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return 'Enter a GSTIN.';
  return /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/.test(value)
    ? null
    : 'GSTIN must be 15 characters (e.g. 36ABCDE1234F1Z5).';
}

/** Non-negative rupee amount with at most two decimals. */
export function validateMoney(value: unknown): string | null {
  const num = Number(value);
  if (!Number.isFinite(num)) return 'Enter an amount.';
  if (num < 0) return 'Amount cannot be negative.';
  if (!/^\d+(?:\.\d{1,2})?$/.test(String(value).replace(/^-/, ''))) {
    return 'Amount can have at most two decimals.';
  }
  return null;
}

/** A positive whole number (>= 1) — for quantities and print copies. */
export function validatePositiveInt(value: unknown): string | null {
  const num = Number(value);
  if (!Number.isFinite(num)) return 'Enter a whole number.';
  if (!Number.isInteger(num)) return 'Must be a whole number, no decimals.';
  if (num < 1) return 'Must be at least 1.';
  return null;
}

/** Rejects empty strings and whitespace-only ones that IsString would allow. */
export function validateRequired(value: unknown, label = 'This field'): string | null {
  if (typeof value !== 'string' || !value.trim()) return `${label} is required.`;
  return null;
}

/** Email — the same regex the backend uses. */
export function validateEmail(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return 'Enter an email address.';
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)
    ? null
    : 'Enter a valid email address.';
}

/**
 * Runs several validators, returns the first error string, or null if all
 * passed. Handy for form fields with multiple rules.
 */
export function firstError(
  ...checks: (string | null)[]
): string | null {
  return checks.find((e) => e !== null) ?? null;
}
