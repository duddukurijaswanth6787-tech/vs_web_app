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
exports.MediaService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const notification_service_1 = require("../notification/notification.service");
const storage_service_1 = require("../../infrastructure/storage/storage.service");
const crypto = __importStar(require("crypto"));
const media_repository_1 = require("./media.repository");
let MediaService = class MediaService {
    mediaRepository;
    auditService;
    notificationService;
    storageService;
    constructor(mediaRepository, auditService, notificationService, storageService) {
        this.mediaRepository = mediaRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
        this.storageService = storageService;
    }
    async getUploadUrl(productId, mediaType, extension) {
        const uuid = crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(7);
        const folder = mediaType === 'VIDEO'
            ? 'videos'
            : mediaType === 'DOCUMENT'
                ? 'documents'
                : 'images';
        const filePath = `products/${productId}/${folder}/${uuid}.${extension}`;
        let contentType = 'image/jpeg';
        if (mediaType === 'VIDEO')
            contentType = 'video/mp4';
        else if (mediaType === 'DOCUMENT')
            contentType = 'application/pdf';
        else if (extension === 'png')
            contentType = 'image/png';
        else if (extension === 'avif')
            contentType = 'image/avif';
        const signedUrl = await this.storageService.getSignedUploadUrl(filePath, contentType);
        return {
            uploadUrl: signedUrl,
            s3Key: filePath,
            url: this.storageService.getPublicUrl(filePath),
        };
    }
    toResponse(m) {
        return {
            id: m.id,
            productId: m.productId,
            variantId: m.variantId ?? undefined,
            mediaType: m.mediaType,
            title: m.title ?? undefined,
            altText: m.altText ?? undefined,
            url: m.url,
            thumbnailUrl: m.thumbnailUrl ?? undefined,
            displayOrder: m.displayOrder,
            isPrimary: m.isPrimary,
            status: m.status,
            color: m.color ?? undefined,
            colorGroupId: m.colorGroupId ?? undefined,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
        };
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.mediaRepository.findAll({
            productId: query.productId,
            variantId: query.variantId,
            mediaType: query.mediaType,
            page,
            limit,
            sortBy: query.sortBy ?? 'displayOrder',
            sortOrder: query.sortOrder ?? 'asc',
        });
        return {
            data: result.data.map((m) => this.toResponse(m)),
            meta: result.meta,
        };
    }
    async findById(id) {
        const media = await this.mediaRepository.findById(id);
        if (!media || media.deletedAt)
            throw new exceptions_1.BusinessException('Media not found', 'MEDIA_001');
        return this.toResponse(media);
    }
    async create(dto, userId) {
        if (dto.isPrimary) {
            await this.mediaRepository.clearPrimary(dto.productId, dto.variantId);
        }
        const media = await this.mediaRepository.create({
            product: { connect: { id: dto.productId } },
            variant: dto.variantId ? { connect: { id: dto.variantId } } : undefined,
            colorGroup: dto.colorGroupId
                ? { connect: { id: dto.colorGroupId } }
                : undefined,
            mediaType: dto.mediaType,
            title: dto.title,
            altText: dto.altText,
            url: this.storageService.sanitizeUrl(dto.url),
            thumbnailUrl: this.storageService.sanitizeUrl(dto.thumbnailUrl),
            displayOrder: dto.displayOrder ?? 0,
            isPrimary: dto.isPrimary ?? false,
            color: dto.color,
            createdBy: userId,
        });
        await this.auditService.log({
            action: 'MEDIA_CREATED',
            module: 'media',
            resource: 'media',
            resourceId: media.id,
            userId,
            newValue: { productId: dto.productId, mediaType: dto.mediaType },
        });
        await this.notificationService.create({
            userId,
            type: 'UPLOAD_COMPLETE',
            title: 'Media Uploaded',
            message: `${dto.mediaType} uploaded for product ${dto.productId}`,
            data: {
                mediaId: media.id,
                productId: dto.productId,
                mediaType: dto.mediaType,
            },
        });
        return this.toResponse(media);
    }
    async update(id, dto, userId) {
        const media = await this.mediaRepository.findById(id);
        if (!media || media.deletedAt)
            throw new exceptions_1.BusinessException('Media not found', 'MEDIA_001');
        if (dto.isPrimary && !media.isPrimary) {
            await this.mediaRepository.clearPrimary(media.productId, media.variantId ?? undefined);
        }
        const updateData = { ...dto, updatedBy: userId };
        if (dto.url)
            updateData.url = this.storageService.sanitizeUrl(dto.url);
        if (dto.thumbnailUrl)
            updateData.thumbnailUrl = this.storageService.sanitizeUrl(dto.thumbnailUrl);
        await this.mediaRepository.update(id, updateData);
        await this.auditService.log({
            action: 'MEDIA_UPDATED',
            module: 'media',
            resource: 'media',
            resourceId: id,
            userId,
            newValue: { ...dto },
        });
        return this.findById(id);
    }
    async delete(id, userId) {
        const media = await this.mediaRepository.findById(id);
        if (!media || media.deletedAt)
            throw new exceptions_1.BusinessException('Media not found', 'MEDIA_001');
        await this.mediaRepository.softDelete(id);
        await this.auditService.log({
            action: 'MEDIA_DELETED',
            module: 'media',
            resource: 'media',
            resourceId: id,
            userId,
        });
    }
    async restore(id, userId) {
        const media = await this.mediaRepository.findById(id);
        if (!media)
            throw new exceptions_1.BusinessException('Media not found', 'MEDIA_001');
        if (!media.deletedAt)
            throw new exceptions_1.BusinessException('Media is not deleted', 'MEDIA_002');
        await this.mediaRepository.restore(id);
        await this.auditService.log({
            action: 'MEDIA_RESTORED',
            module: 'media',
            resource: 'media',
            resourceId: id,
            userId,
        });
        return this.findById(id);
    }
    async setPrimary(id, userId) {
        const media = await this.mediaRepository.findById(id);
        if (!media || media.deletedAt)
            throw new exceptions_1.BusinessException('Media not found', 'MEDIA_001');
        await this.mediaRepository.clearPrimary(media.productId, media.variantId ?? undefined);
        await this.mediaRepository.update(id, {
            isPrimary: true,
            updatedBy: userId,
        });
        await this.auditService.log({
            action: 'PRIMARY_MEDIA_CHANGED',
            module: 'media',
            resource: 'media',
            resourceId: id,
            userId,
        });
        return this.findById(id);
    }
    async reorder(dto) {
        await this.mediaRepository.reorder(dto.items);
        return { updated: dto.items.length };
    }
};
exports.MediaService = MediaService;
exports.MediaService = MediaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [media_repository_1.MediaRepository,
        audit_service_1.AuditService,
        notification_service_1.NotificationService,
        storage_service_1.StorageService])
], MediaService);
//# sourceMappingURL=media.service.js.map