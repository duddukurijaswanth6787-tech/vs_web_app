export interface FileMetadata {
  url: string;
  key: string;
  bucket: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  etag?: string;
  thumbnailUrl?: string;
  originalName?: string;
  uploadedAt: Date;
}

export interface ImageVariants {
  original: FileMetadata;
  thumbnail?: FileMetadata;
  medium?: FileMetadata;
  large?: FileMetadata;
}

export interface StreamResult {
  stream: NodeJS.ReadableStream;
  contentType?: string;
  contentLength?: number;
  contentRange?: string;
  statusCode: number;
}

export interface StorageProvider {
  write(
    filePath: string,
    data: Buffer,
    contentType?: string,
  ): Promise<FileMetadata>;
  read(filePath: string): Promise<Buffer>;
  getStream?(filePath: string, range?: string): Promise<StreamResult>;
  delete(filePath: string): Promise<void>;
  exists(filePath: string): Promise<boolean>;
  copy(sourceKey: string, destKey: string): Promise<void>;
  move(sourceKey: string, destKey: string): Promise<void>;
  getPublicUrl(filePath: string): string;
  getSignedUploadUrl(filePath: string, contentType?: string): Promise<string>;
  getSignedDownloadUrl(filePath: string): Promise<string>;
  healthCheck(): Promise<{ writable: boolean; provider: string; root: string }>;
}
