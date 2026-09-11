import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  mkdir,
  writeFile,
  readFile,
  unlink,
  access,
  copyFile,
  stat,
} from 'fs/promises';
import { createReadStream } from 'fs';
import { resolve, join } from 'path';
import type { StorageProvider, FileMetadata, StreamResult } from './storage.types';
import { StorageUtils } from './storage.utils';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly storageRoot: string;
  private readonly publicUrlBase: string;

  constructor(private readonly configService: ConfigService) {
    this.storageRoot = resolve(
      this.configService.get<string>('app.storage.root', './storage'),
    );
    this.publicUrlBase = this.configService.get<string>(
      'app.storage.publicUrl',
      '/storage',
    );
  }

  async write(
    filePath: string,
    data: Buffer,
    contentType?: string,
  ): Promise<FileMetadata> {
    StorageUtils.assertSafePath(filePath);
    const fullPath = join(this.storageRoot, filePath);
    await mkdir(join(fullPath, '..'), { recursive: true });
    await writeFile(fullPath, data);
    return {
      url: this.getPublicUrl(filePath),
      key: filePath,
      bucket: 'local',
      mimeType: contentType ?? 'application/octet-stream',
      size: data.length,
      uploadedAt: new Date(),
    };
  }

  async read(filePath: string): Promise<Buffer> {
    StorageUtils.assertSafePath(filePath);
    return readFile(join(this.storageRoot, filePath));
  }

  async getStream(filePath: string, range?: string): Promise<StreamResult> {
    StorageUtils.assertSafePath(filePath);
    const fullPath = join(this.storageRoot, filePath);
    const fileStat = await stat(fullPath);
    const totalLength = fileStat.size;
    const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      pdf: 'application/pdf',
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
    };
    const contentType = mimeTypes[ext] ?? 'application/octet-stream';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10) || 0;
      const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;
      const chunkSize = end - start + 1;
      const stream = createReadStream(fullPath, { start, end });
      return {
        stream,
        contentType,
        contentLength: chunkSize,
        contentRange: `bytes ${start}-${end}/${totalLength}`,
        statusCode: 206,
      };
    }

    return {
      stream: createReadStream(fullPath),
      contentType,
      contentLength: totalLength,
      statusCode: 200,
    };
  }

  async delete(filePath: string): Promise<void> {
    StorageUtils.assertSafePath(filePath);
    await unlink(join(this.storageRoot, filePath));
  }

  async exists(filePath: string): Promise<boolean> {
    StorageUtils.assertSafePath(filePath);
    try {
      await access(join(this.storageRoot, filePath));
      return true;
    } catch {
      return false;
    }
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    StorageUtils.assertSafePath(sourceKey);
    StorageUtils.assertSafePath(destKey);
    const destDir = join(this.storageRoot, destKey, '..');
    await mkdir(destDir, { recursive: true });
    await copyFile(
      join(this.storageRoot, sourceKey),
      join(this.storageRoot, destKey),
    );
  }

  async move(sourceKey: string, destKey: string): Promise<void> {
    await this.copy(sourceKey, destKey);
    await this.delete(sourceKey);
  }

  getPublicUrl(filePath: string): string {
    StorageUtils.assertSafePath(filePath);
    return `${this.publicUrlBase}/${filePath.replace(/\\/g, '/')}`;
  }

  async getSignedUploadUrl(filePath: string): Promise<string> {
    // Browser direct uploads require real S3 pre-signed URLs.
    // Returning a relative /storage path makes the frontend PUT to Next.js and 404.
    throw new Error(
      `Local storage cannot generate signed upload URLs (key: ${filePath}). Set STORAGE_PROVIDER=s3.`,
    );
  }

  async getSignedDownloadUrl(filePath: string): Promise<string> {
    return this.getPublicUrl(filePath);
  }

  async healthCheck(): Promise<{
    writable: boolean;
    provider: string;
    root: string;
  }> {
    try {
      await mkdir(this.storageRoot, { recursive: true });
      return { writable: true, provider: 'local', root: this.storageRoot };
    } catch {
      return { writable: false, provider: 'local', root: this.storageRoot };
    }
  }
}
