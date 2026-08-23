/**
 * Normalize media URLs for display.
 * Old local-storage records used relative `/storage/...` paths which resolve
 * against the Next.js origin (404). Map those to the backend storage proxy.
 */
function getBackendOrigin(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envUrl) {
    if (envUrl.includes('api.vasanthisignature.in') || envUrl.includes('api.vasanthis-signature.in')) {
      return 'https://vsss-production.up.railway.app';
    }
    return envUrl.replace(/\/api\/v1\/?$/, '');
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return 'https://vsss-production.up.railway.app';
    }
    return 'http://localhost:4000';
  }
  return 'https://vsss-production.up.railway.app';
}

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';

  // 1. Data URIs and blob URLs pass through untouched
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  const backendOrigin = getBackendOrigin();

  // 2. Convert any dev/local backend origin (localhost:4000, 127.0.0.1:4000, 192.168.x.x:4000) to current environment's backend origin
  if (/^https?:\/\/[^\/]+:4000/i.test(url)) {
    return url.replace(/^https?:\/\/[^\/]+:4000/i, backendOrigin);
  }

  // 3. Absolute HTTP/HTTPS URLs (e.g. S3, Unsplash, external CDNs, Railway absolute URLs)
  if (/^https?:\/\//i.test(url)) {
    const s3Host = 'vasanthi-designers-dev-bucket.s3.ap-south-2.amazonaws.com';
    const proxyBase = (process.env.NEXT_PUBLIC_S3_PUBLIC_URL || '').replace(/\/$/, '');
    if (proxyBase && url.includes(s3Host)) {
      try {
        const u = new URL(url);
        return `${proxyBase}${u.pathname}`;
      } catch {
        return url;
      }
    }
    return url;
  }

  // 4. Relative paths (/storage/... or /api/v1/storage/...) -> map to backendOrigin
  if (url.startsWith('/storage/')) {
    return `${backendOrigin}/api/v1${url}`;
  }
  if (url.startsWith('/api/v1/')) {
    return `${backendOrigin}${url}`;
  }
  if (url.startsWith('/')) {
    return `${backendOrigin}/api/v1/storage${url}`;
  }

  return `${backendOrigin}/api/v1/storage/${url}`;
}

export function isLocalOrPlaceholder(url?: string | null): boolean {
  if (!url) return false;
  return url.startsWith('/') || url.startsWith('data:') || url.includes('localhost') || url.includes('127.0.0.1') || url.includes('placehold.co') || url.includes('unsplash.com');
}

export const VARIANT_SIZES = { thumb: 150, medium: 600, large: 1200 } as const;
export type ImageVariant = keyof typeof VARIANT_SIZES;

/**
 * Append a variant query to a storage proxy URL so the backend serves
 * the pre-generated WebP variant instead of the full-size PNG.
 */
export function withVariant(url: string, variant: ImageVariant): string {
  if (!url || url.includes('placehold.co') || url.includes('data:') || url.includes('unsplash.com')) return url;
  const resolved = resolveMediaUrl(url);
  const separator = resolved.includes('?') ? '&' : '?';
  return `${resolved}${separator}variant=${variant}`;
}
