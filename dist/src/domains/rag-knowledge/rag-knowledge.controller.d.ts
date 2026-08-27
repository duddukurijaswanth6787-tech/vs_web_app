import type { JwtPayload } from "../auth/services/jwt.service";
import { RagKnowledgeService } from './rag-knowledge.service';
import { CreateKnowledgeSourceDto, UpdateKnowledgeSourceDto, UploadUrlRequestDto } from './rag-knowledge.types';
export declare class RagKnowledgeController {
    private readonly knowledgeService;
    constructor(knowledgeService: RagKnowledgeService);
    findAll(page?: number, limit?: number): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: {
            id: string;
            name: string;
            status: string;
            createdBy: string;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            metadata: import("@prisma/client/runtime/client").JsonValue;
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
    }>>;
    findById(id: string): Promise<import("@common/responses/response.builder").ResponsePayload<{
        id: string;
        name: string;
        status: string;
        createdBy: string;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        metadata: import("@prisma/client/runtime/client").JsonValue;
        mimeType: string | null;
        checksum: string | null;
        sourceType: string;
        sourceUrl: string | null;
        s3Key: string | null;
        originalFileName: string | null;
        rawText: string | null;
        indexingError: string | null;
        lastIndexedAt: Date | null;
    }>>;
    create(dto: CreateKnowledgeSourceDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        id: string;
        name: string;
        status: string;
        createdBy: string;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        metadata: import("@prisma/client/runtime/client").JsonValue;
        mimeType: string | null;
        checksum: string | null;
        sourceType: string;
        sourceUrl: string | null;
        s3Key: string | null;
        originalFileName: string | null;
        rawText: string | null;
        indexingError: string | null;
        lastIndexedAt: Date | null;
    }>>;
    update(id: string, dto: UpdateKnowledgeSourceDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        id: string;
        name: string;
        status: string;
        createdBy: string;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        metadata: import("@prisma/client/runtime/client").JsonValue;
        mimeType: string | null;
        checksum: string | null;
        sourceType: string;
        sourceUrl: string | null;
        s3Key: string | null;
        originalFileName: string | null;
        rawText: string | null;
        indexingError: string | null;
        lastIndexedAt: Date | null;
    }>>;
    delete(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
    restore(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
    getUploadUrl(dto: UploadUrlRequestDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        sourceId: `${string}-${string}-${string}-${string}-${string}`;
        s3Key: string;
        uploadUrl: string;
    }>>;
    confirmUpload(id: string, dto: {
        s3Key: string;
        fileName: string;
        mimeType: string;
        size: number;
    }, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        id: string;
        name: string;
        status: string;
        createdBy: string;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        metadata: import("@prisma/client/runtime/client").JsonValue;
        mimeType: string | null;
        checksum: string | null;
        sourceType: string;
        sourceUrl: string | null;
        s3Key: string | null;
        originalFileName: string | null;
        rawText: string | null;
        indexingError: string | null;
        lastIndexedAt: Date | null;
    }>>;
    reindex(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        success: boolean;
    }>>;
    getStatus(id: string): Promise<import("@common/responses/response.builder").ResponsePayload<{
        id: string;
        status: string;
        lastIndexedAt: Date | null;
        indexingError: string | null;
    }>>;
    findChunks(id: string, page?: number, limit?: number): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: {
            id: string;
            createdAt: Date;
            content: string;
            metadata: import("@prisma/client/runtime/client").JsonValue;
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
    }>>;
}
