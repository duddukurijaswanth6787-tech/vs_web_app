import { ConfigService } from '@nestjs/config';
import type { StorageProvider, FileMetadata } from './storage.types';
export declare class LocalStorageProvider implements StorageProvider {
    private readonly configService;
    private readonly storageRoot;
    private readonly publicUrlBase;
    constructor(configService: ConfigService);
    write(filePath: string, data: Buffer, contentType?: string): Promise<FileMetadata>;
    read(filePath: string): Promise<Buffer>;
    delete(filePath: string): Promise<void>;
    exists(filePath: string): Promise<boolean>;
    copy(sourceKey: string, destKey: string): Promise<void>;
    move(sourceKey: string, destKey: string): Promise<void>;
    getPublicUrl(filePath: string): string;
    getSignedUploadUrl(filePath: string): Promise<string>;
    getSignedDownloadUrl(filePath: string): Promise<string>;
    healthCheck(): Promise<{
        writable: boolean;
        provider: string;
        root: string;
    }>;
}
