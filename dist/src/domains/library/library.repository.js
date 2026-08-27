"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibraryRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let LibraryRepository = class LibraryRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findMedia(params) {
        const { folderId, mimeType, search, page, limit, sortBy, sortOrder } = params;
        const where = { isDeleted: false };
        if (folderId)
            where.folderId = folderId;
        if (mimeType)
            where.mimeType = { startsWith: mimeType };
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
    async findMediaById(id) {
        return this.prisma.media.findUnique({
            where: { id },
            include: { folder: true },
        });
    }
    async createMedia(data) {
        return this.prisma.media.create({ data });
    }
    async updateMedia(id, data) {
        return this.prisma.media.update({ where: { id }, data });
    }
    async softDeleteMedia(id) {
        return this.prisma.media.update({
            where: { id },
            data: { isDeleted: true },
        });
    }
    async bulkSoftDelete(ids) {
        return this.prisma.media.updateMany({
            where: { id: { in: ids }, isDeleted: false },
            data: { isDeleted: true },
        });
    }
    async bulkUpdateFolder(ids, folderId) {
        return this.prisma.media.updateMany({
            where: { id: { in: ids }, isDeleted: false },
            data: { folderId, updatedAt: new Date() },
        });
    }
    async restoreMedia(id) {
        return this.prisma.media.update({
            where: { id },
            data: { isDeleted: false },
        });
    }
    async findMediaByChecksum(checksum, excludeId) {
        const where = { checksum, isDeleted: false };
        if (excludeId)
            where.id = { not: excludeId };
        return this.prisma.media.findMany({ where, take: 20 });
    }
    async findFolders(parentId) {
        const where = {};
        if (parentId !== undefined)
            where.parentId = parentId;
        else
            where.parentId = null;
        return this.prisma.mediaFolder.findMany({
            where,
            orderBy: { name: 'asc' },
            include: { _count: { select: { media: true, children: true } } },
        });
    }
    async findFolderById(id) {
        return this.prisma.mediaFolder.findUnique({ where: { id } });
    }
    async createFolder(data) {
        return this.prisma.mediaFolder.create({ data });
    }
    async updateFolder(id, data) {
        return this.prisma.mediaFolder.update({ where: { id }, data });
    }
    async deleteFolder(id) {
        return this.prisma.mediaFolder.delete({ where: { id } });
    }
};
exports.LibraryRepository = LibraryRepository;
exports.LibraryRepository = LibraryRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LibraryRepository);
//# sourceMappingURL=library.repository.js.map