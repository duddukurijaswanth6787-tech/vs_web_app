import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  mkdir,
  writeFile,
  readFile,
  unlink,
  access,
  copyFile,
} from 'fs/promises';
import { resolve, join } from 'path';
import type { StorageProvider, FileMetadata } from './storage.types';
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
