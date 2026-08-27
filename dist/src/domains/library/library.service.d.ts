import { AuditService } from "../audit/audit.service";
import { StorageService } from "../../infrastructure/storage/storage.service";
import { LibraryRepository } from './library.repository';
export declare class LibraryService {
    private readonly libraryRepository;
    private readonly auditService;
    private readonly storageService;
    constructor(libraryRepository: LibraryRepository, auditService: AuditService, storageService: StorageService);
    getUploadUrl(filename: string, mimeType: string): Promise<{
        uploadUrl: string;
        storageKey: string;
        publicUrl: string;
    }>;
    listMedia(query: {
        folderId?: string;
        mimeType?: string;
        search?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        data: ({
            folder: {
                id: string;
                name: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            width: number | null;
            height: number | null;
            altText: string | null;
            thumbnailUrl: string | null;
            size: number;
            mimeType: string;
            folderId: string | null;
            filename: string;
            originalFilename: string;
            extension: string;
            duration: import("@prisma/client-runtime-utils").Decimal | null;
            caption: string | null;
            checksum: string | null;
            storageProvider: string;
            storageKey: string;
            publicUrl: string;
            mediumUrl: string | null;
            largeUrl: string | null;
            uploadedBy: string | null;
            isDeleted: boolean;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    getMedia(id: string): Promise<{
        folder: {
            id: string;
            name: string;
            description: string | null;
            parentId: string | null;
            createdBy: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        width: number | null;
        height: number | null;
        altText: string | null;
        thumbnailUrl: string | null;
        size: number;
        mimeType: string;
        folderId: string | null;
        filename: string;
        originalFilename: string;
        extension: string;
        duration: import("@prisma/client-runtime-utils").Decimal | null;
        caption: string | null;
        checksum: string | null;
        storageProvider: string;
        storageKey: string;
        publicUrl: string;
        mediumUrl: string | null;
        largeUrl: string | null;
        uploadedBy: string | null;
        isDeleted: boolean;
    }>;
    createMedia(dto: {
        filename: string;
        originalFilename: string;
        mimeType: string;
        size: number;
        width?: number;
        height?: number;
        folderId?: string;
        storageKey: string;
        publicUrl: string;
        thumbnailUrl?: string;
        mediumUrl?: string;
        largeUrl?: string;
        checksum?: string;
        uploadedBy: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        width: number | null;
        height: number | null;
        altText: string | null;
        thumbnailUrl: string | null;
        size: number;
        mimeType: string;
        folderId: string | null;
        filename: string;
        originalFilename: string;
        extension: string;
        duration: import("@prisma/client-runtime-utils").Decimal | null;
        caption: string | null;
        checksum: string | null;
        storageProvider: string;
        storageKey: string;
        publicUrl: string;
        mediumUrl: string | null;
        largeUrl: string | null;
        uploadedBy: string | null;
        isDeleted: boolean;
    }>;
    updateMedia(id: string, dto: {
        altText?: string;
        caption?: string;
        folderId?: string;
    }, userId: string): Promise<{
        folder: {
            id: string;
            name: string;
            description: string | null;
            parentId: string | null;
            createdBy: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        width: number | null;
        height: number | null;
        altText: string | null;
        thumbnailUrl: string | null;
        size: number;
        mimeType: string;
        folderId: string | null;
        filename: string;
        originalFilename: string;
        extension: string;
        duration: import("@prisma/client-runtime-utils").Decimal | null;
        caption: string | null;
        checksum: string | null;
        storageProvider: string;
        storageKey: string;
        publicUrl: string;
        mediumUrl: string | null;
        largeUrl: string | null;
        uploadedBy: string | null;
        isDeleted: boolean;
    }>;
    renameMedia(id: string, newFilename: string, userId: string): Promise<{
        folder: {
            id: string;
            name: string;
            description: string | null;
            parentId: string | null;
            createdBy: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        width: number | null;
        height: number | null;
        altText: string | null;
        thumbnailUrl: string | null;
        size: number;
        mimeType: string;
        folderId: string | null;
        filename: string;
        originalFilename: string;
        extension: string;
        duration: import("@prisma/client-runtime-utils").Decimal | null;
        caption: string | null;
        checksum: string | null;
        storageProvider: string;
        storageKey: string;
        publicUrl: string;
        mediumUrl: string | null;
        largeUrl: string | null;
        uploadedBy: string | null;
        isDeleted: boolean;
    }>;
    replaceMedia(id: string, dto: {
        filename: string;
        originalFilename: string;
        mimeType: string;
        size: number;
        width?: number;
        height?: number;
        storageKey: string;
        publicUrl: string;
        thumbnailUrl?: string;
        mediumUrl?: string;
        largeUrl?: string;
        checksum?: string;
    }, userId: string): Promise<{
        folder: {
            id: string;
            name: string;
            description: string | null;
            parentId: string | null;
            createdBy: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        width: number | null;
        height: number | null;
        altText: string | null;
        thumbnailUrl: string | null;
        size: number;
        mimeType: string;
        folderId: string | null;
        filename: string;
        originalFilename: string;
        extension: string;
        duration: import("@prisma/client-runtime-utils").Decimal | null;
        caption: string | null;
        checksum: string | null;
        storageProvider: string;
        storageKey: string;
        publicUrl: string;
        mediumUrl: string | null;
        largeUrl: string | null;
        uploadedBy: string | null;
        isDeleted: boolean;
    }>;
    deleteMedia(id: string, userId: string): Promise<void>;
    bulkDeleteMedia(ids: string[], userId: string): Promise<{
        deletedCount: number;
    }>;
    bulkMoveMedia(ids: string[], folderId: string | null, userId: string): Promise<void>;
    restoreMedia(id: string, userId: string): Promise<{
        folder: {
            id: string;
            name: string;
            description: string | null;
            parentId: string | null;
            createdBy: string | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        width: number | null;
        height: number | null;
        altText: string | null;
        thumbnailUrl: string | null;
        size: number;
        mimeType: string;
        folderId: string | null;
        filename: string;
        originalFilename: string;
        extension: string;
        duration: import("@prisma/client-runtime-utils").Decimal | null;
        caption: string | null;
        checksum: string | null;
        storageProvider: string;
        storageKey: string;
        publicUrl: string;
        mediumUrl: string | null;
        largeUrl: string | null;
        uploadedBy: string | null;
        isDeleted: boolean;
    }>;
    findDuplicates(checksum: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        width: number | null;
        height: number | null;
        altText: string | null;
        thumbnailUrl: string | null;
        size: number;
        mimeType: string;
        folderId: string | null;
        filename: string;
        originalFilename: string;
        extension: string;
        duration: import("@prisma/client-runtime-utils").Decimal | null;
        caption: string | null;
        checksum: string | null;
        storageProvider: string;
        storageKey: string;
        publicUrl: string;
        mediumUrl: string | null;
        largeUrl: string | null;
        uploadedBy: string | null;
        isDeleted: boolean;
    }[]>;
    listFolders(parentId?: string): Promise<({
        _count: {
            children: number;
            media: number;
        };
    } & {
        id: string;
        name: string;
        description: string | null;
        parentId: string | null;
        createdBy: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getFolder(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        parentId: string | null;
        createdBy: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createFolder(dto: {
        name: string;
        parentId?: string;
        description?: string;
        createdBy?: string;
    }): Promise<{
        id: string;
        name: string;
        description: string | null;
        parentId: string | null;
        createdBy: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateFolder(id: string, dto: {
        name?: string;
        parentId?: string | null;
        description?: string;
    }, userId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        parentId: string | null;
        createdBy: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteFolder(id: string, userId: string): Promise<void>;
    getRecentMedia(limit?: number): Promise<{
        data: ({
            folder: {
                id: string;
                name: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            width: number | null;
            height: number | null;
            altText: string | null;
            thumbnailUrl: string | null;
            size: number;
            mimeType: string;
            folderId: string | null;
            filename: string;
            originalFilename: string;
            extension: string;
            duration: import("@prisma/client-runtime-utils").Decimal | null;
            caption: string | null;
            checksum: string | null;
            storageProvider: string;
            storageKey: string;
            publicUrl: string;
            mediumUrl: string | null;
            largeUrl: string | null;
            uploadedBy: string | null;
            isDeleted: boolean;
        })[];
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
