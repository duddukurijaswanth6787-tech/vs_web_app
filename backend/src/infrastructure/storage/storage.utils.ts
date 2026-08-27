import crypto from 'crypto';
import { extname } from 'path';

// Storage key extensions must come from the validated MIME type, never the
// client-supplied filename -- otherwise an upload declared as an allowed
// type (e.g. application/pdf) but named "x.svg" would be stored and later
// served back with a browser-executable Content-Type (image/svg+xml) that
// was never actually validated.
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'application/pdf': '.pdf',
  'video/mp4': '.mp4',
  'text/csv': '.csv',
};

export class StorageUtils {
  static generateFilename(originalName: string): string {
    const ext = extname(originalName) || '';
    return `${crypto.randomUUID()}${ext}`;
  }

  static generateKey(
    folder?: string,
    entityId?: string,
    mimeType?: string,
  ): string {
    const uuid = crypto.randomUUID();
    const ext = mimeType ? (MIME_EXTENSIONS[mimeType] ?? '') : '';
    const parts = [folder, entityId, `${uuid}${ext}`].filter(Boolean);
    return parts.join('/');
  }

  static assertSafePath(filePath: string): void {
    if (
      filePath.includes('..') ||
      filePath.startsWith('/') ||
      filePath.startsWith('\\')
    ) {
      throw new Error('INVALID_STORAGE_PATH');
    }
  }
}
