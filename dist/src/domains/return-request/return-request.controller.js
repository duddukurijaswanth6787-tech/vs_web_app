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
exports.ReturnRequestController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const return_request_service_1 = require("./return-request.service");
const return_request_types_1 = require("./return-request.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
const prisma_service_1 = require("../../database/prisma.service");
const common_2 = require("@nestjs/common");
let ReturnRequestController = class ReturnRequestController {
    returnService;
    prisma;
    constructor(returnService, prisma) {
        this.returnService = returnService;
        this.prisma = prisma;
    }
    isAdmin(user) {
        return !!user.roles?.some((r) => ['super_admin', 'admin'].includes(r));
    }
    async resolveCustomerId(userId) {
        const profile = await this.prisma.customerProfile.findUnique({
            where: { userId },
        });
        return profile?.id ?? null;
    }
    async findAll(query, user) {
        if (this.isAdmin(user)) {
            return response_builder_1.ResponseBuilder.success(await this.returnService.findAll(query));
        }
        query.orderId = undefined;
        const customerId = await this.resolveCustomerId(user.sub);
        if (!customerId)
            return response_builder_1.ResponseBuilder.success({ data: [], meta: {} });
        return response_builder_1.ResponseBuilder.success(await this.returnService.findAll(query, customerId));
    }
    async findById(id, user) {
        const result = await this.returnService.findById(id);
        if (!this.isAdmin(user)) {
            const customerId = await this.resolveCustomerId(user.sub);
            const order = await this.prisma.order.findUnique({
                where: { id: result.orderId },
                select: { customerId: true },
            });
            if (!order || order.customerId !== customerId) {
                throw new common_2.ForbiddenException('Return request not found');
            }
        }
        return response_builder_1.ResponseBuilder.success(result);
    }
    async create(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.returnService.create(user.sub, dto), 'Return request created');
    }
    async updateStatus(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.returnService.updateStatus(id, dto, user.sub), 'Return status updated');
    }
};
exports.ReturnRequestController = ReturnRequestController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List returns (admin: all, customer: own)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [return_request_types_1.ReturnQueryDto, Object]),
    __metadata("design:returntype", Promise)
], ReturnRequestController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get return by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReturnRequestController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create return request' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [return_request_types_1.CreateReturnDto, Object]),
    __metadata("design:returntype", Promise)
], ReturnRequestController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update return status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, return_request_types_1.UpdateReturnStatusDto, Object]),
    __metadata("design:returntype", Promise)
], ReturnRequestController.prototype, "updateStatus", null);
exports.ReturnRequestController = ReturnRequestController = __decorate([
    (0, swagger_1.ApiTags)('Returns'),
    (0, common_1.Controller)('returns'),
    __metadata("design:paramtypes", [return_request_service_1.ReturnRequestService,
        prisma_service_1.PrismaService])
], ReturnRequestController);
//# sourceMappingURL=return-request.controller.js.map