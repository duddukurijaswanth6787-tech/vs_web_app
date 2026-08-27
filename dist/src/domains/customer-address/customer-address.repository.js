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
exports.CustomerAddressRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let CustomerAddressRepository = class CustomerAddressRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { customerId, search, status, page, limit, sortBy, sortOrder } = params;
        const skip = (page - 1) * limit;
        const where = { customerId };
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { addressLine1: { contains: search, mode: 'insensitive' } },
                { addressLine2: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
                { landmark: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.customerAddress.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.customerAddress.count({ where }),
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
        return this.prisma.customerAddress.findUnique({ where: { id } });
    }
    async create(data) {
        return this.prisma.customerAddress.create({ data });
    }
    async update(id, data) {
        return this.prisma.customerAddress.update({ where: { id }, data });
    }
    async delete(id) {
        return this.prisma.customerAddress.update({
            where: { id },
            data: { status: 'INACTIVE' },
        });
    }
    async clearDefaultBilling(customerId) {
        return this.prisma.customerAddress.updateMany({
            where: { customerId, isDefaultBilling: true },
            data: { isDefaultBilling: false },
        });
    }
    async clearDefaultShipping(customerId) {
        return this.prisma.customerAddress.updateMany({
            where: { customerId, isDefaultShipping: true },
            data: { isDefaultShipping: false },
        });
    }
    async findCustomerByUserId(userId) {
        return this.prisma.customerProfile.findUnique({ where: { userId } });
    }
};
exports.CustomerAddressRepository = CustomerAddressRepository;
exports.CustomerAddressRepository = CustomerAddressRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomerAddressRepository);
//# sourceMappingURL=customer-address.repository.js.map