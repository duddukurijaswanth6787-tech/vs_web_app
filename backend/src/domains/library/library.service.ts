import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { StorageService } from '@infrastructure/storage/storage.service';
import * as crypto from 'crypto';
import { LibraryRepository } from './library.repository';

@Injectable()
export class LibraryService {
  constructor(
    private readonly libraryRepository: LibraryRepository,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
  ) {}

  async getUploadUrl(filename: string, mimeType: string) {
    const ext = filename.split('.').pop() || 'bin';
    const uuid = crypto.randomUUID();
    const folder = mimeType.startsWith('image/') ? 'images' : 'documents';
    const filePath = `library/${folder}/${uuid}.${ext}`;

    const signedUrl = await this.storageService.getSignedUploadUrl(
      filePath,
      mimeType,
    );
    return {
      uploadUrl: signedUrl,
      storageKey: filePath,
      publicUrl: this.storageService.getPublicUrl(filePath),
    };
  }

  async listMedia(query: {
    folderId?: string;
    mimeType?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
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

  async getMedia(id: string) {
    const media = await this.libraryRepository.findMediaById(id);
    if (!media || media.isDeleted)
      throw new BusinessException('Media not found', 'LIB_001');
    return media;
  }

  async createMedia(dto: {
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
  }) {
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
      publicUrl: dto.publicUrl,
      thumbnailUrl: dto.thumbnailUrl,
      mediumUrl: dto.mediumUrl,
      largeUrl: dto.largeUrl,
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

  async updateMedia(
    id: string,
    dto: { altText?: string; caption?: string; folderId?: string },
    userId: string,
  ) {
    const media = await this.libraryRepository.findMediaById(id);
    if (!media || media.isDeleted)
      throw new BusinessException('Media not found', 'LIB_001');

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

  async renameMedia(id: string, newFilename: string, userId: string) {
    const media = await this.libraryRepository.findMediaById(id);
    if (!media || media.isDeleted)
      throw new BusinessException('Media not found', 'LIB_001');

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

  async replaceMedia(
    id: string,
    dto: {
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
    },
    userId: string,
  ) {
    const media = await this.libraryRepository.findMediaById(id);
    if (!media || media.isDeleted)
      throw new BusinessException('Media not found', 'LIB_001');

    await this.libraryRepository.updateMedia(id, {
      filename: dto.filename,
      originalFilename: dto.originalFilename,
      mimeType: dto.mimeType,
      extension: dto.filename.split('.').pop() || '',
      size: dto.size,
      width: dto.width,
      height: dto.height,
      storageKey: dto.storageKey,
      publicUrl: dto.publicUrl,
      thumbnailUrl: dto.thumbnailUrl,
      mediumUrl: dto.mediumUrl,
      largeUrl: dto.largeUrl,
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

  async deleteMedia(id: string, userId: string) {
    const media = await this.libraryRepository.findMediaById(id);
    if (!media || media.isDeleted)
      throw new BusinessException('Media not found', 'LIB_001');

    await this.libraryRepository.softDeleteMedia(id);
    await this.auditService.log({
      action: 'LIBRARY_MEDIA_DELETED',
      module: 'library',
      resource: 'media',
      resourceId: id,
      userId,
    });
  }

  async bulkDeleteMedia(ids: string[], userId: string) {
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

  async bulkMoveMedia(ids: string[], folderId: string | null, userId: string) {
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

  async restoreMedia(id: string, userId: string) {
    const media = await this.libraryRepository.findMediaById(id);
    if (!media) throw new BusinessException('Media not found', 'LIB_001');

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

  async findDuplicates(checksum: string) {
    return this.libraryRepository.findMediaByChecksum(checksum);
  }

  async listFolders(parentId?: string) {
    return this.libraryRepository.findFolders(parentId);
  }

  async getFolder(id: string) {
    const folder = await this.libraryRepository.findFolderById(id);
    if (!folder) throw new BusinessException('Folder not found', 'LIB_002');
    return folder;
  }

  async createFolder(dto: {
    name: string;
    parentId?: string;
    description?: string;
    createdBy?: string;
  }) {
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

  async updateFolder(
    id: string,
    dto: { name?: string; parentId?: string | null; description?: string },
    userId: string,
  ) {
    const folder = await this.libraryRepository.findFolderById(id);
    if (!folder) throw new BusinessException('Folder not found', 'LIB_002');

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

  async deleteFolder(id: string, userId: string) {
    const folder = await this.libraryRepository.findFolderById(id);
    if (!folder) throw new BusinessException('Folder not found', 'LIB_002');

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
}
