import { getApiBaseUrl } from '@/lib/api/client';

/**
 * Storefront colours, fetched on the server so the page paints with the
 * shop's own palette on the very first frame. Fetching this in the browser
 * would render the defaults first and repaint -- a visible colour flash on
 * every page load.
 */

/**
 * Matches the server's validation. The values are interpolated into a <style>
 * block, so a string that is not a colour could close the rule and open
 * another one. The API rejects those on save and again on read; this is the
 * last line, and cheap.
 */
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** CSS variable names are ours, but they are still built into a stylesheet. */
const TOKEN_NAME = /^[a-z0-9-]+$/;

export function buildThemeCss(colors: Record<string, string>): string {
  const declarations = Object.entries(colors)
    .filter(([token, value]) => TOKEN_NAME.test(token) && HEX_COLOR.test(value))
    .map(([token, value]) => `--${token}:${value};`)
    .join('');

  return declarations ? `:root{${declarations}}` : '';
}

export async function fetchThemeCss(): Promise<string> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/storefront/theme`, {
      // Colours change rarely and every page needs them; a short revalidate
      // keeps this off the critical path without going stale for long.
      next: { revalidate: 60 },
    });
    if (!res.ok) return '';
    const body = await res.json();
    const colors = body?.data?.colors;
    if (!colors || typeof colors !== 'object') return '';
    return buildThemeCss(colors as Record<string, string>);
  } catch {
    // The storefront must render even when the API is unreachable. Without
    // an override the defaults in globals.css apply, which is the palette
    // the site shipped with.
    return '';
  }
}
