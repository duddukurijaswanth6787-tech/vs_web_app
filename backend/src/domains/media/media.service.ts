import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { NotificationService } from '@domains/notification/notification.service';
import { StorageService } from '@infrastructure/storage/storage.service';
import * as crypto from 'crypto';
import { MediaRepository } from './media.repository';
import {
  CreateMediaDto,
  UpdateMediaDto,
  MediaQueryDto,
  MediaResponse,
  ReorderMediaDto,
} from './media.types';

@Injectable()
export class MediaService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly storageService: StorageService,
  ) {}

  async getUploadUrl(productId: string, mediaType: string, extension: string) {
    const uuid = crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(7);
    const folder =
      mediaType === 'VIDEO'
        ? 'videos'
        : mediaType === 'DOCUMENT'
          ? 'documents'
          : 'images';
    const filePath = `products/${productId}/${folder}/${uuid}.${extension}`;

    // Default content type mapping
    let contentType = 'image/jpeg';
    if (mediaType === 'VIDEO') contentType = 'video/mp4';
    else if (mediaType === 'DOCUMENT') contentType = 'application/pdf';
    else if (extension === 'png') contentType = 'image/png';
    else if (extension === 'avif') contentType = 'image/avif';

    const signedUrl = await this.storageService.getSignedUploadUrl(
      filePath,
      contentType,
    );

    return {
      uploadUrl: signedUrl,
      s3Key: filePath,
      url: this.storageService.getPublicUrl(filePath),
    };
  }

  private toResponse(m: any): MediaResponse {
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

  async findAll(query: MediaQueryDto) {
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

  async findById(id: string) {
    const media = await this.mediaRepository.findById(id);
    if (!media || media.deletedAt)
      throw new BusinessException('Media not found', 'MEDIA_001');
    return this.toResponse(media);
  }

  async create(dto: CreateMediaDto, userId: string) {
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
      url: dto.url,
      thumbnailUrl: dto.thumbnailUrl,
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

  async update(id: string, dto: UpdateMediaDto, userId: string) {
    const media = await this.mediaRepository.findById(id);
    if (!media || media.deletedAt)
      throw new BusinessException('Media not found', 'MEDIA_001');

    if (dto.isPrimary && !media.isPrimary) {
      await this.mediaRepository.clearPrimary(
        media.productId,
        media.variantId ?? undefined,
      );
    }

    await this.mediaRepository.update(id, { ...dto, updatedBy: userId });
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

  async delete(id: string, userId: string) {
    const media = await this.mediaRepository.findById(id);
    if (!media || media.deletedAt)
      throw new BusinessException('Media not found', 'MEDIA_001');
    await this.mediaRepository.softDelete(id);
    await this.auditService.log({
      action: 'MEDIA_DELETED',
      module: 'media',
      resource: 'media',
      resourceId: id,
      userId,
    });
  }

  async restore(id: string, userId: string) {
    const media = await this.mediaRepository.findById(id);
    if (!media) throw new BusinessException('Media not found', 'MEDIA_001');
    if (!media.deletedAt)
      throw new BusinessException('Media is not deleted', 'MEDIA_002');
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

  async setPrimary(id: string, userId: string) {
    const media = await this.mediaRepository.findById(id);
    if (!media || media.deletedAt)
      throw new BusinessException('Media not found', 'MEDIA_001');

    await this.mediaRepository.clearPrimary(
      media.productId,
      media.variantId ?? undefined,
    );
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

  async reorder(dto: ReorderMediaDto) {
    await this.mediaRepository.reorder(dto.items);
    return { updated: dto.items.length };
  }
}
