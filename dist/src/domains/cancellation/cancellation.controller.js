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
exports.CancellationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cancellation_service_1 = require("./cancellation.service");
const cancellation_types_1 = require("./cancellation.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let CancellationController = class CancellationController {
    cancelService;
    constructor(cancelService) {
        this.cancelService = cancelService;
    }
    async findByOrderId(orderId) {
        return response_builder_1.ResponseBuilder.success(await this.cancelService.findByOrderId(orderId));
    }
    async create(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.cancelService.create(user.sub, dto), 'Cancellation request created');
    }
    async update(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.cancelService.update(id, dto, user.sub), 'Cancellation updated');
    }
};
exports.CancellationController = CancellationController;
__decorate([
    (0, common_1.Get)(':orderId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get cancellation by order ID' }),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CancellationController.prototype, "findByOrderId", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create cancellation request' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cancellation_types_1.CreateCancellationDto, Object]),
    __metadata("design:returntype", Promise)
], CancellationController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update cancellation' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cancellation_types_1.UpdateCancellationDto, Object]),
    __metadata("design:returntype", Promise)
], CancellationController.prototype, "update", null);
exports.CancellationController = CancellationController = __decorate([
    (0, swagger_1.ApiTags)('Cancellations'),
    (0, common_1.Controller)('cancellations'),
    __metadata("design:paramtypes", [cancellation_service_1.CancellationService])
], CancellationController);
//# sourceMappingURL=cancellation.controller.js.map