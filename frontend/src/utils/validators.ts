import React from 'react';

/**
 * ============================================================================
 * Centralized Validation Rules & Mandatory Input Sanitizers
 * ============================================================================
 * Single source of truth for all form validations, mandatory constraints,
 * and number input protections across the entire application (Storefront + Super Admin).
 *
 * Enforces:
 * 1. Phone numbers: Exactly 10 digits starting with 6, 7, 8, or 9 (optional +91 handled).
 * 2. PIN codes: Exactly 6 digits (cannot start with 0).
 * 3. Email addresses: Valid format with @ and proper domain TLD.
 * 4. Prices & Amounts: Strictly non-negative (>= 0), max 2 decimal places.
 * 5. Quantities & Print counts: Strictly positive integers (>= 1).
 * 6. Stock & Inventory: Strictly non-negative integers (>= 0).
 * 7. Negative Protection: Blocks typing minus/plus/exponent keys and prevents
 *    accidental mouse-wheel decrementing into negative numbers.
 */

/** Prevents typing minus (-), plus (+), and exponential notation (e/E) into numeric inputs. */
export function preventNegativeKeys(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>): void {
  if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
    e.preventDefault();
  }
}

/** Prevents mouse wheel scrolling over number inputs from accidentally decrementing/changing values. */
export function preventNegativeScroll(e: React.WheelEvent<HTMLInputElement>): void {
  e.currentTarget.blur();
}

/** Sanitizes any input value into a guaranteed non-negative number (>= 0). */
export function sanitizeNonNegativeNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(String(value).replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(num) || num < 0) return fallback;
  return num;
}

/** Sanitizes any input value into a guaranteed positive integer (>= 1). */
export function sanitizePositiveNumber(value: unknown, fallback = 1): number {
  const num = Math.floor(sanitizeNonNegativeNumber(value, fallback));
  return num < 1 ? fallback : num;
}

/** Clamps a numeric value so it is never negative (minimum 0). */
export function clampNonNegative(value: number | string, fallback = 0): number {
  const num = Number(value);
  if (isNaN(num) || !Number.isFinite(num)) return fallback;
  return Math.max(0, num);
}

/** Clamps a numeric value so it is strictly positive (minimum 1). */
export function clampPositive(value: number | string, fallback = 1): number {
  const num = Math.floor(Number(value));
  if (isNaN(num) || !Number.isFinite(num)) return fallback;
  return Math.max(1, num);
}

/** Returns standard input props object to enforce non-negative values and block negative keys / wheel decrements. */
export function nonNegativeInputProps(extraMin = 0) {
  return {
    type: 'number',
    min: String(extraMin),
    onKeyDown: preventNegativeKeys,
    onWheel: preventNegativeScroll,
  };
}

/** Returns standard input props object to enforce positive numbers (min 1) and block negative keys / wheel decrements. */
export function positiveInputProps(extraMin = 1) {
  return {
    type: 'number',
    min: String(extraMin),
    onKeyDown: preventNegativeKeys,
    onWheel: preventNegativeScroll,
  };
}

/** Rejects empty values, null/undefined, and whitespace-only strings for mandatory fields. */
export function validateRequired(value: unknown, label = 'This field'): string | null {
  if (value === null || value === undefined) return `${label} is required.`;
  if (typeof value === 'string' && !value.trim()) return `${label} is required.`;
  if (typeof value === 'number' && Number.isNaN(value)) return `${label} is required.`;
  return null;
}

/** Mandatory 10-digit Indian mobile number starting with 6, 7, 8, or 9. */
export function validatePhone(value: unknown, label = 'Mobile number'): string | null {
  if (typeof value !== 'string' || !value.trim()) return `Enter a valid ${label.toLowerCase()}.`;
  const digits = value.replace(/[\s-]/g, '').replace(/^\+?91/, '');
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return `${label} must be exactly 10 digits and start with 6, 7, 8, or 9.`;
  }
  return null;
}

/** Normalises phone input to clean 10 digits for storage and API payloads. */
export function normalizePhone(value: string): string {
  return value.replace(/[\s-]/g, '').replace(/^\+?91/, '');
}

/** Mandatory 6-digit Indian PIN code; never starts with 0. */
export function validatePincode(value: unknown, label = 'PIN code'): string | null {
  if (typeof value !== 'string' || !value.trim()) return `Enter a valid ${label.toLowerCase()}.`;
  const digits = value.replace(/\D/g, '');
  if (!/^[1-9]\d{5}$/.test(digits)) {
    return `${label} must be exactly 6 digits and cannot start with 0.`;
  }
  return null;
}

/** Mandatory Email format validation. */
export function validateEmail(value: unknown, label = 'Email address'): string | null {
  if (typeof value !== 'string' || !value.trim()) return `Enter an ${label.toLowerCase()}.`;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value.trim())
    ? null
    : `Enter a valid ${label.toLowerCase()} (e.g. name@domain.com).`;
}

/** Validates that a numeric amount, price, or cost is non-negative (>= 0). */
export function validateNonNegativeNumber(value: unknown, label = 'Amount'): string | null {
  if (value === null || value === undefined || String(value).trim() === '') {
    return `${label} is required.`;
  }
  const num = Number(value);
  if (!Number.isFinite(num)) return `Enter a valid ${label.toLowerCase()}.`;
  if (num < 0) return `${label} cannot be negative.`;
  return null;
}

/** Validates that a quantity or count is strictly positive (> 0). */
export function validatePositiveNumber(value: unknown, label = 'Quantity'): string | null {
  const reqError = validateNonNegativeNumber(value, label);
  if (reqError) return reqError;
  const num = Number(value);
  if (num <= 0) return `${label} must be at least 1.`;
  return null;
}

/** Non-negative rupee amount with at most two decimals. */
export function validateMoney(value: unknown, label = 'Amount'): string | null {
  const num = Number(value);
  if (!Number.isFinite(num)) return `Enter a valid ${label.toLowerCase()}.`;
  if (num < 0) return `${label} cannot be negative.`;
  if (!/^\d+(?:\.\d{1,2})?$/.test(String(value).replace(/^-/, ''))) {
    return `${label} can have at most two decimal places.`;
  }
  return null;
}

/** A positive whole number (>= 1) — for quantities and print copies. */
export function validatePositiveInt(value: unknown, label = 'Quantity'): string | null {
  const num = Number(value);
  if (!Number.isFinite(num)) return `Enter a whole number for ${label.toLowerCase()}.`;
  if (!Number.isInteger(num)) return `${label} must be a whole number, no decimals.`;
  if (num < 1) return `${label} must be at least 1.`;
  return null;
}

/** Non-negative integer for stock and available inventory. */
export function validateStockInt(value: unknown, label = 'Stock'): string | null {
  const num = Number(value);
  if (!Number.isFinite(num)) return `Enter a valid ${label.toLowerCase()} number.`;
  if (!Number.isInteger(num)) return `${label} must be a whole number.`;
  if (num < 0) return `${label} cannot be negative.`;
  return null;
}

/** Percentage value between 0% and 100%. */
export function validatePercentage(value: unknown, label = 'Percentage'): string | null {
  const num = Number(value);
  if (!Number.isFinite(num)) return `Enter a valid ${label.toLowerCase()}.`;
  if (num < 0 || num > 100) return `${label} must be between 0% and 100%.`;
  return null;
}

/** 15-character Indian GSTIN. */
export function validateGstin(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return 'Enter a GSTIN.';
  return /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/.test(value.trim())
    ? null
    : 'GSTIN must be 15 characters (e.g. 36ABCDE1234F1Z5).';
}

/** HSN code — 4 to 8 digits. */
export function validateHsn(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return 'Enter an HSN code.';
  const digits = value.replace(/\D/g, '');
  return /^\d{4,8}$/.test(digits) ? null : 'HSN code must be between 4 and 8 digits.';
}

/**
 * Evaluates multiple validation checks sequentially and returns the first error found, or null.
 */
export function firstError(...checks: (string | null)[]): string | null {
  return checks.find((e) => e !== null) ?? null;
}
