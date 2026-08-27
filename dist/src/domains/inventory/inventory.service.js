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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const notification_service_1 = require("../notification/notification.service");
const stock_status_util_1 = require("../../shared/inventory/stock-status.util");
const inventory_repository_1 = require("./inventory.repository");
let InventoryService = class InventoryService {
    inventoryRepository;
    auditService;
    notificationService;
    constructor(inventoryRepository, auditService, notificationService) {
        this.inventoryRepository = inventoryRepository;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }
    toResponse(i) {
        const available = i.availableQuantity - i.reservedQuantity;
        return {
            id: i.id,
            variantId: i.variantId,
            availableQuantity: i.availableQuantity,
            reservedQuantity: i.reservedQuantity,
            damagedQuantity: i.damagedQuantity,
            returnedQuantity: i.returnedQuantity,
            availableStock: available,
            minimumStock: i.minimumStock,
            maximumStock: i.maximumStock,
            reorderLevel: i.reorderLevel,
            stockStatus: i.stockStatus,
            allowBackorder: i.allowBackorder,
            trackInventory: i.trackInventory,
            createdAt: i.createdAt,
            updatedAt: i.updatedAt,
        };
    }
    toMovementResponse(m) {
        return {
            id: m.id,
            inventoryId: m.inventoryId,
            variantId: m.variantId,
            movementType: m.movementType,
            quantity: m.quantity,
            previousQuantity: m.previousQuantity,
            newQuantity: m.newQuantity,
            referenceType: m.referenceType ?? undefined,
            referenceId: m.referenceId ?? undefined,
            reason: m.reason ?? undefined,
            remarks: m.remarks ?? undefined,
            performedBy: m.performedBy ?? undefined,
            createdAt: m.createdAt,
        };
    }
    async updateStockStatus(id, userId) {
        const inv = await this.inventoryRepository.findById(id);
        if (!inv)
            return;
        const status = (0, stock_status_util_1.calculateStockStatus)(inv);
        if (status !== inv.stockStatus) {
            await this.inventoryRepository.update(id, { stockStatus: status });
            if (userId && (status === 'LOW_STOCK' || status === 'OUT_OF_STOCK')) {
                const stockType = status === 'LOW_STOCK' ? 'LOW_STOCK' : 'OUT_OF_STOCK';
                const title = status === 'LOW_STOCK' ? 'Low Stock Alert' : 'Out of Stock';
                await this.notificationService.create({
                    userId,
                    type: stockType,
                    title,
                    message: `Variant ${inv.variantId} is now ${status.toLowerCase()}`,
                    data: {
                        inventoryId: id,
                        variantId: inv.variantId,
                        stockStatus: status,
                    },
                });
            }
        }
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.inventoryRepository.findAll({
            variantId: query.variantId,
            stockStatus: query.stockStatus,
            lowStock: query.lowStock,
            outOfStock: query.outOfStock,
            page,
            limit,
            sortBy: query.sortBy ?? 'createdAt',
            sortOrder: query.sortOrder ?? 'desc',
        });
        return {
            data: result.data.map((i) => this.toResponse(i)),
            meta: result.meta,
        };
    }
    async findById(id) {
        const inv = await this.inventoryRepository.findById(id);
        if (!inv)
            throw new exceptions_1.BusinessException('Inventory not found', 'INVENTORY_001');
        return this.toResponse(inv);
    }
    async findByVariantId(variantId) {
        const inv = await this.inventoryRepository.findByVariantId(variantId);
        if (!inv)
            throw new exceptions_1.BusinessException('Inventory not found for variant', 'INVENTORY_001');
        return this.toResponse(inv);
    }
    async create(dto, userId) {
        const existing = await this.inventoryRepository.findByVariantId(dto.variantId);
        if (existing)
            throw new exceptions_1.BusinessException('Inventory already exists for this variant', 'INVENTORY_002');
        const available = dto.availableQuantity ?? 0;
        const minimumStock = dto.minimumStock ?? 0;
        const reorderLevel = dto.reorderLevel ?? 0;
        const status = (0, stock_status_util_1.calculateStockStatus)({
            availableQuantity: available,
            reservedQuantity: 0,
            minimumStock,
            reorderLevel,
            allowBackorder: dto.allowBackorder ?? false,
        });
        const inv = await this.inventoryRepository.create({
            variant: { connect: { id: dto.variantId } },
            availableQuantity: available,
            minimumStock,
            maximumStock: dto.maximumStock ?? 0,
            reorderLevel,
            stockStatus: status,
            allowBackorder: dto.allowBackorder ?? false,
            trackInventory: dto.trackInventory ?? true,
        });
        if (available > 0) {
            await this.inventoryRepository.createMovement({
                inventory: { connect: { id: inv.id } },
                variantId: dto.variantId,
                movementType: 'MANUAL_ADD',
                quantity: available,
                previousQuantity: 0,
                newQuantity: available,
                reason: dto.reason ?? 'Initial stock',
                remarks: dto.remarks,
                performedBy: userId,
            });
        }
        await this.auditService.log({
            action: 'INVENTORY_CREATED',
            module: 'inventory',
            resource: 'inventory',
            resourceId: inv.id,
            userId,
            newValue: { variantId: dto.variantId, available },
        });
        return this.toResponse(inv);
    }
    async update(id, dto, userId) {
        const inv = await this.inventoryRepository.findById(id);
        if (!inv)
            throw new exceptions_1.BusinessException('Inventory not found', 'INVENTORY_001');
        await this.inventoryRepository.update(id, { ...dto });
        await this.updateStockStatus(id, userId);
        await this.auditService.log({
            action: 'INVENTORY_UPDATED',
            module: 'inventory',
            resource: 'inventory',
            resourceId: id,
            userId,
            newValue: { ...dto },
        });
        return this.findById(id);
    }
    async increaseStock(id, dto, userId) {
        const inv = await this.inventoryRepository.findById(id);
        if (!inv)
            throw new exceptions_1.BusinessException('Inventory not found', 'INVENTORY_001');
        if (dto.referenceType && dto.referenceId) {
            const existing = await this.inventoryRepository.findMovementByReference(id, dto.referenceType, dto.referenceId);
            if (existing)
                return this.findById(id);
        }
        const prev = inv.availableQuantity;
        const next = prev + dto.quantity;
        await this.inventoryRepository.updateStock(id, { availableQuantity: next });
        await this.updateStockStatus(id, userId);
        await this.inventoryRepository.createMovement({
            inventory: { connect: { id } },
            variantId: inv.variantId,
            movementType: 'MANUAL_ADD',
            quantity: dto.quantity,
            previousQuantity: prev,
            newQuantity: next,
            reason: dto.reason,
            remarks: dto.remarks,
            referenceType: dto.referenceType,
            referenceId: dto.referenceId,
            performedBy: userId,
        });
        await this.auditService.log({
            action: 'STOCK_INCREASED',
            module: 'inventory',
            resource: 'inventory',
            resourceId: id,
            userId,
            newValue: { quantity: dto.quantity },
        });
        return this.findById(id);
    }
    async decreaseStock(id, dto, userId) {
        const inv = await this.inventoryRepository.findById(id);
        if (!inv)
            throw new exceptions_1.BusinessException('Inventory not found', 'INVENTORY_001');
        const prev = inv.availableQuantity;
        const next = prev - dto.quantity;
        if (next < 0)
            throw new exceptions_1.ValidationException('Insufficient stock', 'INVENTORY_003');
        await this.inventoryRepository.updateStock(id, { availableQuantity: next });
        await this.updateStockStatus(id, userId);
        await this.inventoryRepository.createMovement({
            inventory: { connect: { id } },
            variantId: inv.variantId,
            movementType: 'MANUAL_REMOVE',
            quantity: dto.quantity,
            previousQuantity: prev,
            newQuantity: next,
            reason: dto.reason,
            remarks: dto.remarks,
            performedBy: userId,
        });
        await this.auditService.log({
            action: 'STOCK_DECREASED',
            module: 'inventory',
            resource: 'inventory',
            resourceId: id,
            userId,
            newValue: { quantity: dto.quantity },
        });
        return this.findById(id);
    }
    async adjustStock(id, dto, userId) {
        const inv = await this.inventoryRepository.findById(id);
        if (!inv)
            throw new exceptions_1.BusinessException('Inventory not found', 'INVENTORY_001');
        const prev = inv.availableQuantity;
        const next = dto.quantity;
        const delta = next - prev;
        await this.inventoryRepository.updateStock(id, { availableQuantity: next });
        await this.updateStockStatus(id, userId);
        await this.inventoryRepository.createMovement({
            inventory: { connect: { id } },
            variantId: inv.variantId,
            movementType: 'ADJUSTMENT',
            quantity: delta,
            previousQuantity: prev,
            newQuantity: next,
            reason: dto.reason,
            remarks: dto.remarks,
            performedBy: userId,
        });
        await this.auditService.log({
            action: 'STOCK_ADJUSTED',
            module: 'inventory',
            resource: 'inventory',
            resourceId: id,
            userId,
            oldValue: { quantity: prev },
            newValue: { quantity: next, reason: dto.reason },
        });
        return this.findById(id);
    }
    async reserveStock(id, dto, userId) {
        const inv = await this.inventoryRepository.findById(id);
        if (!inv)
            throw new exceptions_1.BusinessException('Inventory not found', 'INVENTORY_001');
        const available = inv.availableQuantity - inv.reservedQuantity;
        if (dto.quantity > available)
            throw new exceptions_1.ValidationException('Cannot reserve more than available stock', 'INVENTORY_005');
        const prev = inv.reservedQuantity;
        const next = prev + dto.quantity;
        await this.inventoryRepository.updateStock(id, { reservedQuantity: next });
        await this.updateStockStatus(id, userId);
        await this.inventoryRepository.createMovement({
            inventory: { connect: { id } },
            variantId: inv.variantId,
            movementType: 'RESERVED',
            quantity: dto.quantity,
            previousQuantity: prev,
            newQuantity: next,
            reason: dto.reason,
            referenceType: dto.referenceType,
            referenceId: dto.referenceId,
            performedBy: userId,
        });
        await this.auditService.log({
            action: 'STOCK_RESERVED',
            module: 'inventory',
            resource: 'inventory',
            resourceId: id,
            userId,
            newValue: { quantity: dto.quantity },
        });
        return this.findById(id);
    }
    async releaseStock(id, dto, userId) {
        const inv = await this.inventoryRepository.findById(id);
        if (!inv)
            throw new exceptions_1.BusinessException('Inventory not found', 'INVENTORY_001');
        if (dto.quantity > inv.reservedQuantity)
            throw new exceptions_1.ValidationException('Cannot release more than reserved stock', 'INVENTORY_006');
        const prev = inv.reservedQuantity;
        const next = prev - dto.quantity;
        await this.inventoryRepository.updateStock(id, { reservedQuantity: next });
        await this.updateStockStatus(id, userId);
        await this.inventoryRepository.createMovement({
            inventory: { connect: { id } },
            variantId: inv.variantId,
            movementType: 'UNRESERVED',
            quantity: dto.quantity,
            previousQuantity: prev,
            newQuantity: next,
            reason: dto.reason,
            performedBy: userId,
        });
        await this.auditService.log({
            action: 'STOCK_RELEASED',
            module: 'inventory',
            resource: 'inventory',
            resourceId: id,
            userId,
            newValue: { quantity: dto.quantity },
        });
        return this.findById(id);
    }
    async returnStock(id, dto, userId) {
        const inv = await this.inventoryRepository.findById(id);
        if (!inv)
            throw new exceptions_1.BusinessException('Inventory not found', 'INVENTORY_001');
        const prevAvail = inv.availableQuantity;
        const prevReturned = inv.returnedQuantity;
        await this.inventoryRepository.updateStock(id, {
            availableQuantity: prevAvail + dto.quantity,
            returnedQuantity: prevReturned + dto.quantity,
        });
        await this.updateStockStatus(id, userId);
        await this.inventoryRepository.createMovement({
            inventory: { connect: { id } },
            variantId: inv.variantId,
            movementType: 'RETURN',
            quantity: dto.quantity,
            previousQuantity: prevAvail,
            newQuantity: prevAvail + dto.quantity,
            reason: dto.reason,
            referenceType: dto.referenceType,
            referenceId: dto.referenceId,
            performedBy: userId,
        });
        await this.auditService.log({
            action: 'STOCK_RETURNED',
            module: 'inventory',
            resource: 'inventory',
            resourceId: id,
            userId,
            newValue: { quantity: dto.quantity },
        });
        return this.findById(id);
    }
    async damageStock(id, dto, userId) {
        const inv = await this.inventoryRepository.findById(id);
        if (!inv)
            throw new exceptions_1.BusinessException('Inventory not found', 'INVENTORY_001');
        const available = inv.availableQuantity - inv.reservedQuantity;
        if (dto.quantity > available)
            throw new exceptions_1.ValidationException('Cannot damage more than available stock', 'INVENTORY_007');
        const prevAvail = inv.availableQuantity;
        const prevDamaged = inv.damagedQuantity;
        await this.inventoryRepository.updateStock(id, {
            availableQuantity: prevAvail - dto.quantity,
            damagedQuantity: prevDamaged + dto.quantity,
        });
        await this.updateStockStatus(id, userId);
        await this.inventoryRepository.createMovement({
            inventory: { connect: { id } },
            variantId: inv.variantId,
            movementType: 'DAMAGE',
            quantity: dto.quantity,
            previousQuantity: prevAvail,
            newQuantity: prevAvail - dto.quantity,
            reason: dto.reason,
            remarks: dto.remarks,
            performedBy: userId,
        });
        await this.auditService.log({
            action: 'STOCK_DAMAGED',
            module: 'inventory',
            resource: 'inventory',
            resourceId: id,
            userId,
            newValue: { quantity: dto.quantity },
        });
        return this.findById(id);
    }
    async findMovements(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const result = await this.inventoryRepository.findMovements({
            inventoryId: query.inventoryId,
            variantId: query.variantId,
            movementType: query.movementType,
            page,
            limit,
            sortBy: query.sortBy ?? 'createdAt',
            sortOrder: query.sortOrder ?? 'desc',
        });
        return {
            data: result.data.map((m) => this.toMovementResponse(m)),
            meta: result.meta,
        };
    }
    async getStockSummary() {
        return this.inventoryRepository.getStockSummary();
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [inventory_repository_1.InventoryRepository,
        audit_service_1.AuditService,
        notification_service_1.NotificationService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map