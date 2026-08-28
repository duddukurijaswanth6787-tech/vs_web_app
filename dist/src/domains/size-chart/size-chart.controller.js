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
exports.SizeChartController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const size_chart_service_1 = require("./size-chart.service");
const size_chart_types_1 = require("./size-chart.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let SizeChartController = class SizeChartController {
    sizeChartService;
    constructor(sizeChartService) {
        this.sizeChartService = sizeChartService;
    }
    async findAll(query) {
        return response_builder_1.ResponseBuilder.success(await this.sizeChartService.findAll(query));
    }
    async findByProduct(productId) {
        return response_builder_1.ResponseBuilder.success(await this.sizeChartService.findByProductId(productId));
    }
    async findById(id) {
        return response_builder_1.ResponseBuilder.success(await this.sizeChartService.findById(id));
    }
    async create(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.sizeChartService.create(dto, user.sub), 'Size chart created');
    }
    async update(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.sizeChartService.update(id, dto, user.sub), 'Size chart updated');
    }
    async remove(id, user) {
        await this.sizeChartService.remove(id, user.sub);
        return response_builder_1.ResponseBuilder.deleted('Size chart deleted');
    }
};
exports.SizeChartController = SizeChartController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List size chart templates (public)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [size_chart_types_1.SizeChartQueryDto]),
    __metadata("design:returntype", Promise)
], SizeChartController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('product/:productId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get the size chart attached to a product (public)',
    }),
    __param(0, (0, common_1.Param)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SizeChartController.prototype, "findByProduct", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get a size chart template (public)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SizeChartController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a size chart template' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [size_chart_types_1.CreateSizeChartTemplateDto, Object]),
    __metadata("design:returntype", Promise)
], SizeChartController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a size chart template' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, size_chart_types_1.UpdateSizeChartTemplateDto, Object]),
    __metadata("design:returntype", Promise)
], SizeChartController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a size chart template' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SizeChartController.prototype, "remove", null);
exports.SizeChartController = SizeChartController = __decorate([
    (0, swagger_1.ApiTags)('Size Charts'),
    (0, common_1.Controller)('size-charts'),
    __metadata("design:paramtypes", [size_chart_service_1.SizeChartService])
], SizeChartController);
//# sourceMappingURL=size-chart.controller.js.map