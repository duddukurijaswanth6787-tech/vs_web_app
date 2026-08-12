import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { LoggerService } from '@common/logger/logger.service';
import { FileUploadException } from '@common/exceptions';
import { FILE_LIMITS } from '@common/constants';
import { STORAGE_PROVIDER } from './storage.constants';
import type {
  StorageProvider,
  FileMetadata,
  ImageVariants,
} from './storage.types';
import { StorageUtils } from './storage.utils';

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly provider: StorageProvider,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {}

  async upload(
    data: Buffer,
    options: {
      originalName: string;
      mimeType: string;
      folder?: string;
      entityId?: string;
    },
  ): Promise<FileMetadata> {
    this.validate(data, options.mimeType);
    const key = StorageUtils.generateKey(
      options.folder,
      options.entityId,
      options.originalName,
    );
    const result = await this.provider.write(key, data, options.mimeType);
    this.loggerService.log(
      `File uploaded: ${key} (${data.length} bytes)`,
      'StorageService',
    );
    return result;
  }

  async uploadImage(
    data: Buffer,
    options: {
      originalName: string;
      mimeType: string;
      folder?: string;
      entityId?: string;
    },
  ): Promise<ImageVariants> {
    this.validate(data, options.mimeType);
    if (!this.isImage(options.mimeType)) {
      throw new FileUploadException(
        'File is not an image',
        'INVALID_FILE_TYPE',
      );
    }

    const key = StorageUtils.generateKey(
      options.folder,
      options.entityId,
      options.originalName,
    );
    const baseKey = key.replace(/\.[^.]+$/, '');

    const [original, thumbnail, medium, large] = await Promise.all([
      this.provider.write(
        `${baseKey}.webp`,
        await this.toWebp(data),
        'image/webp',
      ),
      this.provider.write(
        `${baseKey}_thumb.webp`,
        await this.toWebp(data, 150),
        'image/webp',
      ),
      this.provider.write(
        `${baseKey}_medium.webp`,
        await this.toWebp(data, 600),
        'image/webp',
      ),
      this.provider.write(
        `${baseKey}_large.webp`,
        await this.toWebp(data, 1200),
        'image/webp',
      ),
    ]);

    this.loggerService.log(
      `Image uploaded with variants: ${baseKey}`,
      'StorageService',
    );
    return { original, thumbnail, medium, large };
  }

  async delete(storagePath: string): Promise<void> {
    await this.provider.delete(storagePath);
    this.loggerService.log(`File deleted: ${storagePath}`, 'StorageService');
  }

  async deleteImageVariants(baseKey: string): Promise<void> {
    const keys = [
      `${baseKey}.webp`,
      `${baseKey}_thumb.webp`,
      `${baseKey}_medium.webp`,
      `${baseKey}_large.webp`,
    ];
    await Promise.all(keys.map((k) => this.provider.delete(k).catch(() => {})));
  }

  async get(storagePath: string): Promise<Buffer> {
    return this.provider.read(storagePath);
  }

  async exists(storagePath: string): Promise<boolean> {
    return this.provider.exists(storagePath);
  }

  // ponytail: on-the-fly WebP variant generation + S3 cache. First request is
  // slow (sharp resize), subsequent requests hit the cached S3 object.
  async getOrGenerateVariant(
    key: string,
    variant: 'thumb' | 'medium' | 'large',
  ): Promise<{ buffer: Buffer; contentType: string }> {
    const widths: Record<string, number> = {
      thumb: 150,
      medium: 600,
      large: 1200,
    };
    const baseKey = key.replace(/\.[^.]+$/, '');
    const variantKey = `${baseKey}_${variant}.webp`;

    try {
      if (await this.provider.exists(variantKey)) {
        return {
          buffer: await this.provider.read(variantKey),
          contentType: 'image/webp',
        };
      }
    } catch {
      // fall through to generate
    }

    const original = await this.provider.read(key);
    const webp = await this.toWebp(original, widths[variant]);

    try {
      await this.provider.write(variantKey, webp, 'image/webp');
      this.loggerService.log(
        `Generated variant: ${variantKey} (${webp.length} bytes)`,
        'StorageService',
      );
    } catch (err) {
      this.loggerService.warn(
        `Failed to cache variant ${variantKey}: ${String(err)}`,
        'StorageService',
      );
    }

    return { buffer: webp, contentType: 'image/webp' };
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    return this.provider.copy(sourceKey, destKey);
  }

  async move(sourceKey: string, destKey: string): Promise<void> {
    return this.provider.move(sourceKey, destKey);
  }

  getPublicUrl(filePath: string): string {
    return this.provider.getPublicUrl(filePath);
  }

  async getSignedUploadUrl(
    filePath: string,
    contentType?: string,
  ): Promise<string> {
    return this.provider.getSignedUploadUrl(filePath, contentType);
  }

  async getSignedDownloadUrl(filePath: string): Promise<string> {
    return this.provider.getSignedDownloadUrl(filePath);
  }

  async healthCheck(): Promise<{
    writable: boolean;
    provider: string;
    root: string;
  }> {
    return this.provider.healthCheck();
  }

  private validate(data: Buffer, mimeType: string): void {
    const maxSize =
      this.configService.get<number>('app.storage.maxFileSize') ??
      FILE_LIMITS.MAX_FILE_SIZE;
    const allowedMimeTypes: string[] = [
      ...(this.configService
        .get<string>('app.storage.allowedMimeTypes')
        ?.split(',') ?? [...FILE_LIMITS.ALLOWED_MIME_TYPES]),
      'text/csv',
    ];

    if (!allowedMimeTypes.includes(mimeType)) {
      throw new FileUploadException(
        `File type ${mimeType} is not allowed`,
        'INVALID_FILE_TYPE',
        { allowedMimeTypes, mimeType },
      );
    }
    if (data.length > maxSize) {
      throw new FileUploadException(
        `File size ${data.length} exceeds maximum ${maxSize}`,
        'FILE_TOO_LARGE',
        { maxSize, fileSize: data.length },
      );
    }
  }

  private isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  private async toWebp(data: Buffer, maxWidth?: number): Promise<Buffer> {
    let pipeline = sharp(data).webp({ quality: 80 });
    if (maxWidth) {
      pipeline = pipeline.resize(maxWidth, null, { withoutEnlargement: true });
    }
    return pipeline.toBuffer();
  }
}
