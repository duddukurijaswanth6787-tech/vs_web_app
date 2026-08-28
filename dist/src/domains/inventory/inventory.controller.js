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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const inventory_service_1 = require("./inventory.service");
const inventory_types_1 = require("./inventory.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let InventoryController = class InventoryController {
    inventoryService;
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    async findAll(query) {
        return response_builder_1.ResponseBuilder.success(await this.inventoryService.findAll(query));
    }
    async getStockSummary() {
        return response_builder_1.ResponseBuilder.success(await this.inventoryService.getStockSummary());
    }
    async findMovements(query) {
        return response_builder_1.ResponseBuilder.success(await this.inventoryService.findMovements(query));
    }
    async findById(id) {
        return response_builder_1.ResponseBuilder.success(await this.inventoryService.findById(id));
    }
    async findByVariantId(variantId) {
        return response_builder_1.ResponseBuilder.success(await this.inventoryService.findByVariantId(variantId));
    }
    async create(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.inventoryService.create(dto, user.sub), 'Inventory created');
    }
    async update(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.inventoryService.update(id, dto, user.sub), 'Inventory updated');
    }
    async increaseStock(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.inventoryService.increaseStock(id, dto, user.sub), 'Stock increased');
    }
    async decreaseStock(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.inventoryService.decreaseStock(id, dto, user.sub), 'Stock decreased');
    }
    async adjustStock(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.inventoryService.adjustStock(id, dto, user.sub), 'Stock adjusted');
    }
    async reserveStock(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.inventoryService.reserveStock(id, dto, user.sub), 'Stock reserved');
    }
    async releaseStock(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.inventoryService.releaseStock(id, dto, user.sub), 'Stock released');
    }
    async returnStock(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.inventoryService.returnStock(id, dto, user.sub), 'Stock returned');
    }
    async damageStock(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.inventoryService.damageStock(id, dto, user.sub), 'Stock damaged');
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('inventory:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List inventory with filtering, pagination, sorting',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_types_1.InventoryQueryDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('inventory:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get stock summary statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getStockSummary", null);
__decorate([
    (0, common_1.Get)('movements'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('inventory:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List inventory movements with filtering' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_types_1.MovementQueryDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findMovements", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('inventory:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get inventory by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)('variant/:variantId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('inventory:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get inventory by variant ID' }),
    __param(0, (0, common_1.Param)('variantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findByVariantId", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('inventory:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create inventory for a variant' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_types_1.CreateInventoryDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('inventory:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update inventory settings' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_types_1.UpdateInventoryDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/increase'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('inventory:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Increase stock' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_types_1.StockMovementDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "increaseStock", null);
__decorate([
    (0, common_1.Post)(':id/decrease'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('inventory:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Decrease stock' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_types_1.StockMovementDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "decreaseStock", null);
__decorate([
    (0, common_1.Post)(':id/adjust'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('inventory:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Adjust stock (positive or negative)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_types_1.AdjustStockDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "adjustStock", null);
__decorate([
    (0, common_1.Post)(':id/reserve'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('inventory:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Reserve stock for order' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_types_1.StockMovementDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "reserveStock", null);
__decorate([
    (0, common_1.Post)(':id/release'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('inventory:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Release reserved stock' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_types_1.StockMovementDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "releaseStock", null);
__decorate([
    (0, common_1.Post)(':id/return'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('inventory:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Process return stock' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_types_1.StockMovementDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "returnStock", null);
__decorate([
    (0, common_1.Post)(':id/damage'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('inventory:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Report damaged stock' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_types_1.StockMovementDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "damageStock", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('Inventory'),
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map