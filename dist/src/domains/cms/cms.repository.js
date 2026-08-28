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
exports.CmsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let CmsRepository = class CmsRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findBanners(params) {
        const { placement, isActive, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (placement)
            where.placement = placement;
        if (isActive !== undefined)
            where.isActive = isActive;
        const [data, total] = await Promise.all([
            this.prisma.banner.findMany({
                where,
                skip,
                take: limit,
                orderBy: { displayOrder: 'asc' },
            }),
            this.prisma.banner.count({ where }),
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
    async findBannerById(id) {
        return this.prisma.banner.findUnique({ where: { id } });
    }
    async createBanner(data) {
        return this.prisma.banner.create({ data });
    }
    async updateBanner(id, data) {
        return this.prisma.banner.update({ where: { id }, data });
    }
    async findPages(params) {
        const { search, status, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status)
            where.status = status;
        const [data, total] = await Promise.all([
            this.prisma.cmsPage.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.cmsPage.count({ where }),
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
    async findPageById(id) {
        return this.prisma.cmsPage.findUnique({ where: { id } });
    }
    async findPageBySlug(slug) {
        return this.prisma.cmsPage.findUnique({ where: { slug } });
    }
    async createPage(data) {
        return this.prisma.cmsPage.create({ data });
    }
    async updatePage(id, data) {
        return this.prisma.cmsPage.update({ where: { id }, data });
    }
    async findSections() {
        return this.prisma.cmsSection.findMany({
            orderBy: { displayOrder: 'asc' },
        });
    }
    async createSection(data) {
        return this.prisma.cmsSection.create({ data });
    }
};
exports.CmsRepository = CmsRepository;
exports.CmsRepository = CmsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CmsRepository);
//# sourceMappingURL=cms.repository.js.map