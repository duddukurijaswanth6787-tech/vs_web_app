export declare enum KnowledgeSourceType {
    TEXT = "TEXT",
    DOCUMENT = "DOCUMENT",
    URL = "URL",
    FAQ = "FAQ",
    CMS = "CMS"
}
export declare enum KnowledgeSourceStatus {
    DRAFT = "DRAFT",
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    INDEXED = "INDEXED",
    FAILED = "FAILED",
    ARCHIVED = "ARCHIVED"
}
export declare class CreateKnowledgeSourceDto {
    name: string;
    sourceType: KnowledgeSourceType;
    sourceUrl?: string;
    rawText?: string;
}
export declare class UpdateKnowledgeSourceDto {
    name?: string;
    sourceUrl?: string;
    rawText?: string;
}
export declare class UploadUrlRequestDto {
    fileName: string;
    mimeType: string;
    size: number;
}
