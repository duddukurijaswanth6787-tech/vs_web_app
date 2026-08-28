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
exports.FaqRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let FaqRepository = class FaqRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { search, category, isActive, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { question: { contains: search, mode: 'insensitive' } },
                { answer: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (category)
            where.category = category;
        if (isActive !== undefined)
            where.isActive = isActive;
        const [data, total] = await Promise.all([
            this.prisma.faq.findMany({
                where,
                skip,
                take: limit,
                orderBy: { displayOrder: 'asc' },
            }),
            this.prisma.faq.count({ where }),
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
    async findById(id) {
        return this.prisma.faq.findUnique({ where: { id } });
    }
    async create(data) {
        return this.prisma.faq.create({ data });
    }
    async update(id, data) {
        return this.prisma.faq.update({ where: { id }, data });
    }
    async incrementHelpful(id) {
        return this.prisma.faq.update({
            where: { id },
            data: { helpfulCount: { increment: 1 } },
        });
    }
    async findBySlug(slug) {
        return this.prisma.faq.findUnique({ where: { slug } });
    }
    async getCategories() {
        const categories = await this.prisma.faq.groupBy({
            by: ['category'],
            where: { isActive: true, category: { not: null } },
            _count: { id: true },
            orderBy: { category: 'asc' },
        });
        return categories.map((c) => ({
            name: c.category,
            slug: c
                .category.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, ''),
            faqCount: c._count.id,
        }));
    }
};
exports.FaqRepository = FaqRepository;
exports.FaqRepository = FaqRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FaqRepository);
//# sourceMappingURL=faq.repository.js.map