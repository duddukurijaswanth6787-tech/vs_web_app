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
exports.OrderController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const order_service_1 = require("./order.service");
const order_types_1 = require("./order.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const response_builder_1 = require("../../common/responses/response.builder");
const prisma_service_1 = require("../../database/prisma.service");
let OrderController = class OrderController {
    orderService;
    prisma;
    constructor(orderService, prisma) {
        this.orderService = orderService;
        this.prisma = prisma;
    }
    async resolveCustomerId(userId) {
        const profile = await this.prisma.customerProfile.findUnique({
            where: { userId },
        });
        return profile?.id ?? null;
    }
    async findAll(query, user) {
        const isAdmin = user.roles?.some((r) => ['super_admin', 'admin'].includes(r));
        const q = isAdmin ? query : { ...query, customerId: user.sub };
        return response_builder_1.ResponseBuilder.success(await this.orderService.findAll(q, isAdmin));
    }
    async findByOrderNumber(orderNumber, user) {
        const isAdmin = user.roles?.some((r) => ['super_admin', 'admin'].includes(r));
        const order = await this.orderService.findByOrderNumber(orderNumber);
        if (!isAdmin && order.customerId !== (await this.resolveCustomerId(user.sub))) {
            return response_builder_1.ResponseBuilder.success(null, 'Order not found');
        }
        return response_builder_1.ResponseBuilder.success(order);
    }
    async findById(id, user) {
        const isAdmin = user.roles?.some((r) => ['super_admin', 'admin'].includes(r));
        const order = await this.orderService.findById(id, isAdmin);
        if (!isAdmin && order.customerId !== (await this.resolveCustomerId(user.sub))) {
            return response_builder_1.ResponseBuilder.success(null, 'Order not found');
        }
        return response_builder_1.ResponseBuilder.success(order);
    }
    async updateStatus(id, body, user) {
        return response_builder_1.ResponseBuilder.success(await this.orderService.updateStatus(id, body.status, user.sub, body.message), 'Order status updated');
    }
};
exports.OrderController = OrderController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List orders with filtering and pagination' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [order_types_1.OrderQueryDto, Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('number/:orderNumber'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get order by order number' }),
    __param(0, (0, common_1.Param)('orderNumber')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "findByOrderNumber", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get order by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "findById", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('orders:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update order status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], OrderController.prototype, "updateStatus", null);
exports.OrderController = OrderController = __decorate([
    (0, swagger_1.ApiTags)('Orders'),
    (0, common_1.Controller)('orders'),
    __metadata("design:paramtypes", [order_service_1.OrderService,
        prisma_service_1.PrismaService])
], OrderController);
//# sourceMappingURL=order.controller.js.map