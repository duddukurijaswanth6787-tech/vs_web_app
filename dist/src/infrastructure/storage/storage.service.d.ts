import { ConfigService } from '@nestjs/config';
import { LoggerService } from "../../common/logger/logger.service";
import type { StorageProvider, FileMetadata, ImageVariants } from './storage.types';
export declare class StorageService {
    private readonly provider;
    private readonly configService;
    private readonly loggerService;
    constructor(provider: StorageProvider, configService: ConfigService, loggerService: LoggerService);
    upload(data: Buffer, options: {
        originalName: string;
        mimeType: string;
        folder?: string;
        entityId?: string;
    }): Promise<FileMetadata>;
    uploadImage(data: Buffer, options: {
        originalName: string;
        mimeType: string;
        folder?: string;
        entityId?: string;
    }): Promise<ImageVariants>;
    delete(storagePath: string): Promise<void>;
    deleteImageVariants(baseKey: string): Promise<void>;
    get(storagePath: string): Promise<Buffer>;
    exists(storagePath: string): Promise<boolean>;
    getOrGenerateVariant(key: string, variant: 'thumb' | 'medium' | 'large'): Promise<{
        buffer: Buffer;
        contentType: string;
    }>;
    copy(sourceKey: string, destKey: string): Promise<void>;
    move(sourceKey: string, destKey: string): Promise<void>;
    getPublicUrl(filePath: string): string;
    sanitizeUrl<T extends string | undefined>(url: T): T;
    getSignedUploadUrl(filePath: string, contentType?: string): Promise<string>;
    getSignedDownloadUrl(filePath: string): Promise<string>;
    healthCheck(): Promise<{
        writable: boolean;
        provider: string;
        root: string;
    }>;
    private validate;
    private isImage;
    private toWebp;
}
