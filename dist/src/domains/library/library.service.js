"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibraryService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const storage_service_1 = require("../../infrastructure/storage/storage.service");
const crypto = __importStar(require("crypto"));
const library_repository_1 = require("./library.repository");
let LibraryService = class LibraryService {
    libraryRepository;
    auditService;
    storageService;
    constructor(libraryRepository, auditService, storageService) {
        this.libraryRepository = libraryRepository;
        this.auditService = auditService;
        this.storageService = storageService;
    }
    async getUploadUrl(filename, mimeType) {
        const ext = filename.split('.').pop() || 'bin';
        const uuid = crypto.randomUUID();
        const folder = mimeType.startsWith('image/') ? 'images' : 'documents';
        const filePath = `library/${folder}/${uuid}.${ext}`;
        const signedUrl = await this.storageService.getSignedUploadUrl(filePath, mimeType);
        return {
            uploadUrl: signedUrl,
            storageKey: filePath,
            publicUrl: this.storageService.getPublicUrl(filePath),
        };
    }
    async listMedia(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 48, 200);
        return this.libraryRepository.findMedia({
            folderId: query.folderId,
            mimeType: query.mimeType,
            search: query.search,
            page,
            limit,
            sortBy: query.sortBy ?? 'createdAt',
            sortOrder: query.sortOrder ?? 'desc',
        });
    }
    async getMedia(id) {
        const media = await this.libraryRepository.findMediaById(id);
        if (!media || media.isDeleted)
            throw new exceptions_1.BusinessException('Media not found', 'LIB_001');
        return media;
    }
    async createMedia(dto) {
        const media = await this.libraryRepository.createMedia({
            filename: dto.filename,
            originalFilename: dto.originalFilename,
            mimeType: dto.mimeType,
            extension: dto.filename.split('.').pop() || '',
            size: dto.size,
            width: dto.width,
            height: dto.height,
            folder: dto.folderId ? { connect: { id: dto.folderId } } : undefined,
            storageKey: dto.storageKey,
            publicUrl: this.storageService.sanitizeUrl(dto.publicUrl),
            thumbnailUrl: this.storageService.sanitizeUrl(dto.thumbnailUrl),
            mediumUrl: this.storageService.sanitizeUrl(dto.mediumUrl),
            largeUrl: this.storageService.sanitizeUrl(dto.largeUrl),
            checksum: dto.checksum,
            uploadedBy: dto.uploadedBy,
        });
        await this.auditService.log({
            action: 'LIBRARY_MEDIA_CREATED',
            module: 'library',
            resource: 'media',
            resourceId: media.id,
            userId: dto.uploadedBy,
            newValue: { filename: dto.originalFilename, mimeType: dto.mimeType },
        });
        return media;
    }
    async updateMedia(id, dto, userId) {
        const media = await this.libraryRepository.findMediaById(id);
        if (!media || media.isDeleted)
            throw new exceptions_1.BusinessException('Media not found', 'LIB_001');
        await this.libraryRepository.updateMedia(id, {
            altText: dto.altText,
            caption: dto.caption,
            folder: dto.folderId
                ? { connect: { id: dto.folderId } }
                : dto.folderId === null
                    ? { disconnect: true }
                    : undefined,
            updatedAt: new Date(),
        });
        await this.auditService.log({
            action: 'LIBRARY_MEDIA_UPDATED',
            module: 'library',
            resource: 'media',
            resourceId: id,
            userId,
            newValue: dto,
        });
        return this.getMedia(id);
    }
    async renameMedia(id, newFilename, userId) {
        const media = await this.libraryRepository.findMediaById(id);
        if (!media || media.isDeleted)
            throw new exceptions_1.BusinessException('Media not found', 'LIB_001');
        await this.libraryRepository.updateMedia(id, {
            originalFilename: newFilename,
            updatedAt: new Date(),
        });
        await this.auditService.log({
            action: 'LIBRARY_MEDIA_RENAMED',
            module: 'library',
            resource: 'media',
            resourceId: id,
            userId,
            newValue: { originalFilename: newFilename },
        });
        return this.getMedia(id);
    }
    async replaceMedia(id, dto, userId) {
        const media = await this.libraryRepository.findMediaById(id);
        if (!media || media.isDeleted)
            throw new exceptions_1.BusinessException('Media not found', 'LIB_001');
        await this.libraryRepository.updateMedia(id, {
            filename: dto.filename,
            originalFilename: dto.originalFilename,
            mimeType: dto.mimeType,
            extension: dto.filename.split('.').pop() || '',
            size: dto.size,
            width: dto.width,
            height: dto.height,
            storageKey: dto.storageKey,
            publicUrl: this.storageService.sanitizeUrl(dto.publicUrl),
            thumbnailUrl: this.storageService.sanitizeUrl(dto.thumbnailUrl),
            mediumUrl: this.storageService.sanitizeUrl(dto.mediumUrl),
            largeUrl: this.storageService.sanitizeUrl(dto.largeUrl),
            checksum: dto.checksum,
            updatedAt: new Date(),
        });
        await this.auditService.log({
            action: 'LIBRARY_MEDIA_REPLACED',
            module: 'library',
            resource: 'media',
            resourceId: id,
            userId,
            newValue: { originalFilename: dto.originalFilename, size: dto.size },
        });
        return this.getMedia(id);
    }
    async deleteMedia(id, userId) {
        const media = await this.libraryRepository.findMediaById(id);
        if (!media || media.isDeleted)
            throw new exceptions_1.BusinessException('Media not found', 'LIB_001');
        await this.libraryRepository.softDeleteMedia(id);
        await this.auditService.log({
            action: 'LIBRARY_MEDIA_DELETED',
            module: 'library',
            resource: 'media',
            resourceId: id,
            userId,
        });
    }
    async bulkDeleteMedia(ids, userId) {
        const result = await this.libraryRepository.bulkSoftDelete(ids);
        await this.auditService.log({
            action: 'LIBRARY_MEDIA_BULK_DELETED',
            module: 'library',
            resource: 'media',
            resourceId: ids.join(','),
            userId,
            newValue: { count: result.count, ids },
        });
        return { deletedCount: result.count };
    }
    async bulkMoveMedia(ids, folderId, userId) {
        await this.libraryRepository.bulkUpdateFolder(ids, folderId);
        await this.auditService.log({
            action: 'LIBRARY_MEDIA_BULK_MOVED',
            module: 'library',
            resource: 'media',
            resourceId: ids.join(','),
            userId,
            newValue: { count: ids.length, folderId },
        });
    }
    async restoreMedia(id, userId) {
        const media = await this.libraryRepository.findMediaById(id);
        if (!media)
            throw new exceptions_1.BusinessException('Media not found', 'LIB_001');
        await this.libraryRepository.restoreMedia(id);
        await this.auditService.log({
            action: 'LIBRARY_MEDIA_RESTORED',
            module: 'library',
            resource: 'media',
            resourceId: id,
            userId,
        });
        return this.getMedia(id);
    }
    async findDuplicates(checksum) {
        return this.libraryRepository.findMediaByChecksum(checksum);
    }
    async listFolders(parentId) {
        return this.libraryRepository.findFolders(parentId);
    }
    async getFolder(id) {
        const folder = await this.libraryRepository.findFolderById(id);
        if (!folder)
            throw new exceptions_1.BusinessException('Folder not found', 'LIB_002');
        return folder;
    }
    async createFolder(dto) {
        const folder = await this.libraryRepository.createFolder({
            name: dto.name,
            parent: dto.parentId ? { connect: { id: dto.parentId } } : undefined,
            description: dto.description,
            createdBy: dto.createdBy,
        });
        await this.auditService.log({
            action: 'LIBRARY_FOLDER_CREATED',
            module: 'library',
            resource: 'folder',
            resourceId: folder.id,
            userId: dto.createdBy ?? '',
            newValue: { name: dto.name },
        });
        return folder;
    }
    async updateFolder(id, dto, userId) {
        const folder = await this.libraryRepository.findFolderById(id);
        if (!folder)
            throw new exceptions_1.BusinessException('Folder not found', 'LIB_002');
        await this.libraryRepository.updateFolder(id, {
            name: dto.name,
            parent: dto.parentId
                ? { connect: { id: dto.parentId } }
                : dto.parentId === null
                    ? { disconnect: true }
                    : undefined,
            description: dto.description,
        });
        await this.auditService.log({
            action: 'LIBRARY_FOLDER_UPDATED',
            module: 'library',
            resource: 'folder',
            resourceId: id,
            userId,
            newValue: dto,
        });
        return this.getFolder(id);
    }
    async deleteFolder(id, userId) {
        const folder = await this.libraryRepository.findFolderById(id);
        if (!folder)
            throw new exceptions_1.BusinessException('Folder not found', 'LIB_002');
        await this.libraryRepository.deleteFolder(id);
        await this.auditService.log({
            action: 'LIBRARY_FOLDER_DELETED',
            module: 'library',
            resource: 'folder',
            resourceId: id,
            userId,
        });
    }
    async getRecentMedia(limit = 20) {
        return this.libraryRepository.findMedia({
            page: 1,
            limit,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        });
    }
};
exports.LibraryService = LibraryService;
exports.LibraryService = LibraryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [library_repository_1.LibraryRepository,
        audit_service_1.AuditService,
        storage_service_1.StorageService])
], LibraryService);
//# sourceMappingURL=library.service.js.map