import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class RagKnowledgeRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        page: number;
        limit: number;
    }): Promise<{
        data: {
            id: string;
            name: string;
            status: string;
            createdBy: string;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            metadata: Prisma.JsonValue;
            mimeType: string | null;
            checksum: string | null;
            sourceType: string;
            sourceUrl: string | null;
            s3Key: string | null;
            originalFileName: string | null;
            rawText: string | null;
            indexingError: string | null;
            lastIndexedAt: Date | null;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<{
        id: string;
        name: string;
        status: string;
        createdBy: string;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        metadata: Prisma.JsonValue;
        mimeType: string | null;
        checksum: string | null;
        sourceType: string;
        sourceUrl: string | null;
        s3Key: string | null;
        originalFileName: string | null;
        rawText: string | null;
        indexingError: string | null;
        lastIndexedAt: Date | null;
    } | null>;
    create(data: Prisma.RagKnowledgeSourceCreateInput): Promise<{
        id: string;
        name: string;
        status: string;
        createdBy: string;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        metadata: Prisma.JsonValue;
        mimeType: string | null;
        checksum: string | null;
        sourceType: string;
        sourceUrl: string | null;
        s3Key: string | null;
        originalFileName: string | null;
        rawText: string | null;
        indexingError: string | null;
        lastIndexedAt: Date | null;
    }>;
    update(id: string, data: Prisma.RagKnowledgeSourceUpdateInput): Promise<{
        id: string;
        name: string;
        status: string;
        createdBy: string;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        metadata: Prisma.JsonValue;
        mimeType: string | null;
        checksum: string | null;
        sourceType: string;
        sourceUrl: string | null;
        s3Key: string | null;
        originalFileName: string | null;
        rawText: string | null;
        indexingError: string | null;
        lastIndexedAt: Date | null;
    }>;
    softDelete(id: string): Promise<{
        id: string;
        name: string;
        status: string;
        createdBy: string;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        metadata: Prisma.JsonValue;
        mimeType: string | null;
        checksum: string | null;
        sourceType: string;
        sourceUrl: string | null;
        s3Key: string | null;
        originalFileName: string | null;
        rawText: string | null;
        indexingError: string | null;
        lastIndexedAt: Date | null;
    }>;
    restore(id: string): Promise<{
        id: string;
        name: string;
        status: string;
        createdBy: string;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        metadata: Prisma.JsonValue;
        mimeType: string | null;
        checksum: string | null;
        sourceType: string;
        sourceUrl: string | null;
        s3Key: string | null;
        originalFileName: string | null;
        rawText: string | null;
        indexingError: string | null;
        lastIndexedAt: Date | null;
    }>;
    deleteChunksBySourceId(knowledgeSourceId: string): Promise<void>;
    saveDocumentAndChunks(params: {
        knowledgeSourceId: string;
        title: string;
        contentHash: string;
        chunks: Array<{
            chunkIndex: number;
            content: string;
            tokenCount: number;
            embedding: number[];
            metadata: any;
        }>;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        metadata: Prisma.JsonValue;
        knowledgeSourceId: string;
        contentHash: string;
    }>;
    findChunksBySourceId(knowledgeSourceId: string, params: {
        page: number;
        limit: number;
    }): Promise<{
        data: {
            id: string;
            createdAt: Date;
            content: string;
            metadata: Prisma.JsonValue;
            knowledgeSourceId: string;
            documentId: string;
            tokenCount: number;
            chunkIndex: number;
            embedding: number[];
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
}
