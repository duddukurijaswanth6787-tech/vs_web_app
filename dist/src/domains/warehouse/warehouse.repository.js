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
exports.WarehouseRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let WarehouseRepository = class WarehouseRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { search, status, isDefault, page, limit, sortBy, sortOrder } = params;
        const where = { deletedAt: null };
        if (search)
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
            ];
        if (status)
            where.status = status;
        if (isDefault !== undefined)
            where.isDefault = isDefault;
        const [data, total] = await Promise.all([
            this.prisma.warehouse.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.warehouse.count({ where }),
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
        return this.prisma.warehouse.findUnique({
            where: { id },
            include: {
                locations: true,
                inventories: {
                    include: {
                        variant: { select: { id: true, sku: true, title: true } },
                    },
                },
            },
        });
    }
    async findByCode(code) {
        return this.prisma.warehouse.findUnique({ where: { code } });
    }
    async create(data) {
        return this.prisma.warehouse.create({ data });
    }
    async update(id, data) {
        return this.prisma.warehouse.update({ where: { id }, data });
    }
    async softDelete(id) {
        return this.prisma.warehouse.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'ARCHIVED' },
        });
    }
    async restore(id) {
        return this.prisma.warehouse.update({
            where: { id },
            data: { deletedAt: null, status: 'ACTIVE' },
        });
    }
    async clearDefault() {
        await this.prisma.warehouse.updateMany({
            where: { isDefault: true },
            data: { isDefault: false },
        });
    }
    async createLocation(data) {
        return this.prisma.warehouseLocation.create({ data });
    }
    async findLocations(warehouseId) {
        return this.prisma.warehouseLocation.findMany({
            where: { warehouseId, status: 'ACTIVE' },
        });
    }
    async findWarehouseInventory(warehouseId, variantId) {
        return this.prisma.variantWarehouseInventory.findUnique({
            where: { warehouseId_variantId: { warehouseId, variantId } },
        });
    }
    async createWarehouseInventory(data) {
        return this.prisma.variantWarehouseInventory.create({ data });
    }
    async updateWarehouseInventory(id, data) {
        return this.prisma.variantWarehouseInventory.update({
            where: { id },
            data,
        });
    }
    async findWarehouseInventories(warehouseId) {
        return this.prisma.variantWarehouseInventory.findMany({
            where: { warehouseId },
            include: { variant: { select: { id: true, sku: true, title: true } } },
        });
    }
};
exports.WarehouseRepository = WarehouseRepository;
exports.WarehouseRepository = WarehouseRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WarehouseRepository);
//# sourceMappingURL=warehouse.repository.js.map