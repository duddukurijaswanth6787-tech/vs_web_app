import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { StorageProvider, FileMetadata } from './storage.types';

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private readonly signedUrlExpiry: number;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>(
      'app.storage.s3.region',
      'ap-south-1',
    );
    const endpoint = this.configService.get<string>('app.storage.s3.endpoint');
    const forcePathStyle = this.configService.get<boolean>(
      'app.storage.s3.forcePathStyle',
      false,
    );

    this.client = new S3Client({
      region,
      ...(endpoint && { endpoint }),
      forcePathStyle,
      credentials: {
        accessKeyId: this.configService.get<string>(
          'app.storage.s3.accessKeyId',
          '',
        ),
        secretAccessKey: this.configService.get<string>(
          'app.storage.s3.secretAccessKey',
          '',
        ),
      },
    });

    this.bucket = this.configService.get<string>('app.storage.s3.bucket', '');
    this.publicUrl = this.configService.get<string>(
      'app.storage.s3.publicUrl',
      '',
    );
    this.signedUrlExpiry = this.configService.get<number>(
      'app.storage.s3.signedUrlExpiry',
      3600,
    );
  }

  async write(
    filePath: string,
    data: Buffer,
    contentType?: string,
  ): Promise<FileMetadata> {
    const ct = contentType ?? this.getContentType(filePath);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
        Body: data,
        ContentType: ct,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    return {
      url: this.getPublicUrl(filePath),
      key: filePath,
      bucket: this.bucket,
      mimeType: ct,
      size: data.length,
      uploadedAt: new Date(),
    };
  }

  async read(filePath: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: filePath }),
    );
    const chunks: Uint8Array[] = [];
    const stream = response.Body as AsyncIterable<Uint8Array>;
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async delete(filePath: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: filePath }),
    );
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: filePath }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destKey,
      }),
    );
  }

  async move(sourceKey: string, destKey: string): Promise<void> {
    await this.copy(sourceKey, destKey);
    await this.delete(sourceKey);
  }

  getPublicUrl(filePath: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${filePath}`;
    }
    return `https://${this.bucket}.s3.amazonaws.com/${filePath}`;
  }

  async getSignedUploadUrl(
    filePath: string,
    contentType?: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
      ...(contentType && { ContentType: contentType }),
    });
    return getSignedUrl(this.client, command, {
      expiresIn: this.signedUrlExpiry,
    });
  }

  async getSignedDownloadUrl(filePath: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
    });
    return getSignedUrl(this.client, command, {
      expiresIn: this.signedUrlExpiry,
    });
  }

  async healthCheck(): Promise<{
    writable: boolean;
    provider: string;
    root: string;
  }> {
    try {
      const testKey = `.health-check/${Date.now()}`;
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: testKey,
          Body: 'health-check',
        }),
      );
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: testKey }),
      );
      return { writable: true, provider: 's3', root: this.bucket };
    } catch {
      return { writable: false, provider: 's3', root: this.bucket };
    }
  }

  private getContentType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      avif: 'image/avif',
      gif: 'image/gif',
      pdf: 'application/pdf',
      mp4: 'video/mp4',
    };
    return mimeTypes[ext ?? ''] ?? 'application/octet-stream';
  }
}
