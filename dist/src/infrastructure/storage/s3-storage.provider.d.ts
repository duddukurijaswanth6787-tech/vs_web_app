import { ConfigService } from '@nestjs/config';
import type { StorageProvider, FileMetadata } from './storage.types';
export declare class S3StorageProvider implements StorageProvider {
    private readonly configService;
    private readonly logger;
    private readonly client;
    private readonly bucket;
    private readonly publicUrl;
    private readonly signedUrlExpiry;
    private readonly region;
    private readonly endpoint?;
    private readonly forcePathStyle;
    constructor(configService: ConfigService);
    write(filePath: string, data: Buffer, contentType?: string): Promise<FileMetadata>;
    read(filePath: string): Promise<Buffer>;
    delete(filePath: string): Promise<void>;
    exists(filePath: string): Promise<boolean>;
    copy(sourceKey: string, destKey: string): Promise<void>;
    move(sourceKey: string, destKey: string): Promise<void>;
    getPublicUrl(filePath: string): string;
    getSignedUploadUrl(filePath: string, contentType?: string): Promise<string>;
    getSignedDownloadUrl(filePath: string): Promise<string>;
    healthCheck(): Promise<{
        writable: boolean;
        provider: string;
        root: string;
    }>;
    private getContentType;
}
