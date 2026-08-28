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
exports.TaxRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let TaxRepository = class TaxRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { type, isActive, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (type)
            where.type = type;
        if (isActive !== undefined)
            where.isActive = isActive;
        const [data, total] = await Promise.all([
            this.prisma.taxRule.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
            }),
            this.prisma.taxRule.count({ where }),
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
        return this.prisma.taxRule.findUnique({ where: { id } });
    }
    async findActiveRules() {
        return this.prisma.taxRule.findMany({
            where: { isActive: true },
            orderBy: { priority: 'desc' },
        });
    }
    async create(data) {
        return this.prisma.taxRule.create({ data });
    }
    async update(id, data) {
        return this.prisma.taxRule.update({ where: { id }, data });
    }
};
exports.TaxRepository = TaxRepository;
exports.TaxRepository = TaxRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TaxRepository);
//# sourceMappingURL=tax.repository.js.map