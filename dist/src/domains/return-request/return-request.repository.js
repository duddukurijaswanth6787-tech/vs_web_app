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
exports.ReturnRequestRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let ReturnRequestRepository = class ReturnRequestRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { status, orderId, customerId, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (orderId)
            where.orderId = orderId;
        if (customerId)
            where.order = { customerId };
        const [data, total] = await Promise.all([
            this.prisma.returnRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: { include: { images: { orderBy: { displayOrder: 'asc' } } } },
                },
            }),
            this.prisma.returnRequest.count({ where }),
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
        return this.prisma.returnRequest.findUnique({
            where: { id },
            include: {
                items: { include: { images: { orderBy: { displayOrder: 'asc' } } } },
            },
        });
    }
    async create(data) {
        return this.prisma.returnRequest.create({ data, include: { items: true } });
    }
    async update(id, data) {
        return this.prisma.returnRequest.update({
            where: { id },
            data,
            include: { items: true },
        });
    }
    async generateReturnNumber() {
        const count = await this.prisma.returnRequest.count();
        return `RET-${String(count + 1).padStart(6, '0')}`;
    }
};
exports.ReturnRequestRepository = ReturnRequestRepository;
exports.ReturnRequestRepository = ReturnRequestRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReturnRequestRepository);
//# sourceMappingURL=return-request.repository.js.map