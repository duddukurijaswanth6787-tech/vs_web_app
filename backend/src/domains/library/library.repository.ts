import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LibraryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMedia(params: {
    folderId?: string;
    mimeType?: string;
    search?: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const { folderId, mimeType, search, page, limit, sortBy, sortOrder } =
      params;
    const where: Prisma.MediaWhereInput = { isDeleted: false };
    if (folderId) where.folderId = folderId;
    if (mimeType) where.mimeType = { startsWith: mimeType };
    if (search)
      where.originalFilename = { contains: search, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { folder: { select: { id: true, name: true } } },
      }),
      this.prisma.media.count({ where }),
    ]);
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async findMediaById(id: string) {
    return this.prisma.media.findUnique({
      where: { id },
      include: { folder: true },
    });
  }

  async createMedia(data: Prisma.MediaCreateInput) {
    return this.prisma.media.create({ data });
  }

  async updateMedia(id: string, data: Prisma.MediaUpdateInput) {
    return this.prisma.media.update({ where: { id }, data });
  }

  async softDeleteMedia(id: string) {
    return this.prisma.media.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async bulkSoftDelete(ids: string[]) {
    return this.prisma.media.updateMany({
      where: { id: { in: ids }, isDeleted: false },
      data: { isDeleted: true },
    });
  }

  async bulkUpdateFolder(ids: string[], folderId: string | null) {
    return this.prisma.media.updateMany({
      where: { id: { in: ids }, isDeleted: false },
      data: { folderId, updatedAt: new Date() },
    });
  }

  async restoreMedia(id: string) {
    return this.prisma.media.update({
      where: { id },
      data: { isDeleted: false },
    });
  }

  async findMediaByChecksum(checksum: string, excludeId?: string) {
    const where: Prisma.MediaWhereInput = { checksum, isDeleted: false };
    if (excludeId) where.id = { not: excludeId };
    return this.prisma.media.findMany({ where, take: 20 });
  }

  async findFolders(parentId?: string) {
    const where: Prisma.MediaFolderWhereInput = {};
    if (parentId !== undefined) where.parentId = parentId;
    else where.parentId = null;
    return this.prisma.mediaFolder.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { _count: { select: { media: true, children: true } } },
    });
  }

  async findFolderById(id: string) {
    return this.prisma.mediaFolder.findUnique({ where: { id } });
  }

  async createFolder(data: Prisma.MediaFolderCreateInput) {
    return this.prisma.mediaFolder.create({ data });
  }

  async updateFolder(id: string, data: Prisma.MediaFolderUpdateInput) {
    return this.prisma.mediaFolder.update({ where: { id }, data });
  }

  async deleteFolder(id: string) {
    return this.prisma.mediaFolder.delete({ where: { id } });
  }

  async syncProductMedia() {
    let productFolder = await this.prisma.mediaFolder.findFirst({
      where: { name: 'Product Catalog' },
    });
    if (!productFolder) {
      productFolder = await this.prisma.mediaFolder.create({
        data: {
          name: 'Product Catalog',
          description: 'Auto-synced photos from product catalog listings',
        },
      });
    }

    const productMedias = await this.prisma.productMedia.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
      include: { product: { select: { name: true } } },
    });

    const existingMedias = await this.prisma.media.findMany({
      where: { isDeleted: false },
      select: { publicUrl: true, storageKey: true },
    });
    const existingUrls = new Set([
      ...existingMedias.map((m) => m.publicUrl),
      ...existingMedias.map((m) => m.storageKey),
    ]);

    let createdCount = 0;
    for (const pm of productMedias) {
      if (!pm.url || existingUrls.has(pm.url)) continue;

      const urlParts = pm.url.split('/');
      const rawFileName = urlParts[urlParts.length - 1] || 'product-image.jpg';
      const ext = rawFileName.includes('.')
        ? rawFileName.split('.').pop() || 'jpg'
        : 'jpg';
      const cleanTitle =
        pm.title || pm.product?.name || `Product Image ${pm.id.slice(0, 6)}`;

      await this.prisma.media.create({
        data: {
          filename: rawFileName,
          originalFilename: `${cleanTitle}.${ext}`,
          mimeType:
            ext === 'png'
              ? 'image/png'
              : ext === 'webp'
                ? 'image/webp'
                : 'image/jpeg',
          extension: ext,
          size: 102400,
          folderId: productFolder.id,
          storageProvider: 's3',
          storageKey: pm.url,
          publicUrl: pm.url,
          thumbnailUrl: pm.thumbnailUrl || pm.url,
          mediumUrl: pm.url,
          largeUrl: pm.url,
          altText: pm.altText || cleanTitle,
          caption: pm.product?.name,
          uploadedBy: pm.createdBy || 'system',
        },
      });

      existingUrls.add(pm.url);
      createdCount++;
    }

    return {
      totalFound: productMedias.length,
      syncedCount: createdCount,
      folderId: productFolder.id,
    };
  }
}
