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
exports.TestimonialsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let TestimonialsService = class TestimonialsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findFeatured() {
        try {
            return await this.prisma.testimonial.findMany({
                where: {
                    isFeatured: true,
                    status: 'ACTIVE',
                    deletedAt: null,
                },
                orderBy: [
                    { displayOrder: 'asc' },
                    { createdAt: 'desc' },
                ],
            });
        }
        catch {
            return [];
        }
    }
    async findAll() {
        try {
            return await this.prisma.testimonial.findMany({
                where: {
                    deletedAt: null,
                },
                orderBy: [
                    { displayOrder: 'asc' },
                    { createdAt: 'desc' },
                ],
            });
        }
        catch {
            return [];
        }
    }
    async findById(id) {
        const item = await this.prisma.testimonial.findFirst({
            where: { id, deletedAt: null },
        });
        if (!item) {
            throw new common_1.NotFoundException(`Testimonial with ID "${id}" not found`);
        }
        return item;
    }
    async create(dto, userId) {
        return this.prisma.testimonial.create({
            data: {
                ...dto,
                createdBy: userId,
            },
        });
    }
    async update(id, dto, userId) {
        await this.findById(id);
        return this.prisma.testimonial.update({
            where: { id },
            data: {
                ...dto,
                updatedBy: userId,
            },
        });
    }
    async delete(id, userId) {
        await this.findById(id);
        return this.prisma.testimonial.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                status: 'ARCHIVED',
                updatedBy: userId,
            },
        });
    }
};
exports.TestimonialsService = TestimonialsService;
exports.TestimonialsService = TestimonialsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TestimonialsService);
//# sourceMappingURL=testimonials.service.js.map