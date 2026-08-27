import { LibraryService } from './library.service';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class LibraryController {
    private readonly libraryService;
    constructor(libraryService: LibraryService);
    listMedia(folderId?: string, mimeType?: string, search?: string, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    getMedia(id: string): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    createMedia(body: {
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
    }, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    updateMedia(id: string, body: {
        altText?: string;
        caption?: string;
        folderId?: string;
    }, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    renameMedia(id: string, body: {
        originalFilename: string;
    }, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    replaceMedia(id: string, body: {
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
    }, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    bulkDeleteMedia(body: {
        ids: string[];
    }, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        deletedCount: number;
    }>>;
    bulkMoveMedia(body: {
        ids: string[];
        folderId: string | null;
    }, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
    restoreMedia(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    deleteMedia(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
    getUploadUrl(body: {
        filename: string;
        mimeType: string;
    }): Promise<import("@common/responses/response.builder").ResponsePayload<{
        uploadUrl: string;
        storageKey: string;
        publicUrl: string;
    }>>;
    findDuplicates(checksum: string): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }[]>>;
    listFolders(parentId?: string): Promise<import("@common/responses/response.builder").ResponsePayload<({
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
    })[]>>;
    getFolder(id: string): Promise<import("@common/responses/response.builder").ResponsePayload<{
        id: string;
        name: string;
        description: string | null;
        parentId: string | null;
        createdBy: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>>;
    createFolder(body: {
        name: string;
        parentId?: string;
        description?: string;
    }, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        id: string;
        name: string;
        description: string | null;
        parentId: string | null;
        createdBy: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>>;
    updateFolder(id: string, body: {
        name?: string;
        parentId?: string | null;
        description?: string;
    }, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        id: string;
        name: string;
        description: string | null;
        parentId: string | null;
        createdBy: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>>;
    deleteFolder(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
}
