/**
 * Normalize media URLs for display.
 * Old local-storage records used relative `/storage/...` paths which resolve
 * against the Next.js origin (404). Map those to the backend storage proxy.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';

  // 1. Convert any backend :4000 origin (localhost, 127.0.0.1, LAN IP) to relative path
  if (/^https?:\/\/[^\/]+:4000/i.test(url)) {
    url = url.replace(/^https?:\/\/[^\/]+:4000/i, '');
  }

  // 2. Ensure /storage/ paths point to /api/v1/storage/ proxy
  if (url.startsWith('/storage/')) {
    url = `/api/v1${url}`;
  }

  if (/^https?:\/\//i.test(url) || url.startsWith('blob:') || url.startsWith('data:')) {
    // Rewrite legacy direct S3 host URLs through the API proxy if configured
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

  const proxyBase = (process.env.NEXT_PUBLIC_S3_PUBLIC_URL || '').replace(/\/$/, '');
  if (proxyBase && url.startsWith('/storage/')) {
    return `${proxyBase}/${url.replace(/^\/storage\//, '')}`;
  }
  if (proxyBase && !url.startsWith('/')) {
    return `${proxyBase}/${url}`;
  }

  return url;
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
