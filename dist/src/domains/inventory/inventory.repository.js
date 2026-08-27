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
exports.InventoryRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let InventoryRepository = class InventoryRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { variantId, stockStatus, lowStock, outOfStock, page, limit, sortBy, sortOrder, } = params;
        const where = {};
        if (variantId)
            where.variantId = variantId;
        if (stockStatus)
            where.stockStatus = stockStatus;
        if (lowStock)
            where.stockStatus = 'LOW_STOCK';
        if (outOfStock)
            where.stockStatus = 'OUT_OF_STOCK';
        const include = {
            variant: {
                select: { id: true, sku: true, title: true, productId: true },
            },
        };
        const [data, total] = await Promise.all([
            this.prisma.inventory.findMany({
                where,
                include,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.inventory.count({ where }),
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
        return this.prisma.inventory.findUnique({
            where: { id },
            include: {
                variant: {
                    select: { id: true, sku: true, title: true, productId: true },
                },
            },
        });
    }
    async findByVariantId(variantId) {
        return this.prisma.inventory.findUnique({ where: { variantId } });
    }
    async create(data) {
        return this.prisma.inventory.create({ data });
    }
    async update(id, data) {
        return this.prisma.inventory.update({ where: { id }, data });
    }
    async updateStock(id, data) {
        return this.prisma.inventory.update({ where: { id }, data });
    }
    async createMovement(data) {
        return this.prisma.inventoryMovement.create({ data });
    }
    async findMovementByReference(inventoryId, referenceType, referenceId) {
        return this.prisma.inventoryMovement.findFirst({
            where: { inventoryId, referenceType, referenceId },
        });
    }
    async findMovements(params) {
        const { inventoryId, variantId, movementType, page, limit, sortBy, sortOrder, } = params;
        const where = {};
        if (inventoryId)
            where.inventoryId = inventoryId;
        if (variantId)
            where.variantId = variantId;
        if (movementType)
            where.movementType = movementType;
        const [data, total] = await Promise.all([
            this.prisma.inventoryMovement.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.inventoryMovement.count({ where }),
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
    async getStockSummary() {
        const inventories = await this.prisma.inventory.findMany({
            select: {
                stockStatus: true,
                availableQuantity: true,
                reservedQuantity: true,
            },
        });
        return {
            totalItems: inventories.length,
            inStock: inventories.filter((i) => i.stockStatus === 'IN_STOCK').length,
            lowStock: inventories.filter((i) => i.stockStatus === 'LOW_STOCK').length,
            outOfStock: inventories.filter((i) => i.stockStatus === 'OUT_OF_STOCK')
                .length,
            totalAvailable: inventories.reduce((sum, i) => sum + i.availableQuantity, 0),
            totalReserved: inventories.reduce((sum, i) => sum + i.reservedQuantity, 0),
        };
    }
};
exports.InventoryRepository = InventoryRepository;
exports.InventoryRepository = InventoryRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryRepository);
//# sourceMappingURL=inventory.repository.js.map