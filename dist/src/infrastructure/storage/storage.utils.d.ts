export declare class StorageUtils {
    static generateFilename(originalName: string): string;
    static generateKey(folder?: string, entityId?: string, mimeType?: string): string;
    static assertSafePath(filePath: string): void;
}
