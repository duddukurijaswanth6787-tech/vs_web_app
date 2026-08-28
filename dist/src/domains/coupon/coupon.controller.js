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
exports.CouponController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const coupon_service_1 = require("./coupon.service");
const coupon_types_1 = require("./coupon.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let CouponController = class CouponController {
    couponService;
    constructor(couponService) {
        this.couponService = couponService;
    }
    async findAll(query) {
        return response_builder_1.ResponseBuilder.success(await this.couponService.findAll(query));
    }
    async findActivePublic() {
        return response_builder_1.ResponseBuilder.success(await this.couponService.getActiveCoupons());
    }
    async findById(id) {
        return response_builder_1.ResponseBuilder.success(await this.couponService.findById(id));
    }
    async create(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.couponService.create(user.sub, dto));
    }
    async update(id, dto, user) {
        return response_builder_1.ResponseBuilder.updated(await this.couponService.update(id, dto, user.sub));
    }
    async apply(dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.couponService.applyCoupon(user.sub, dto));
    }
    async validate(dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.couponService.validateCoupon(user.sub, dto));
    }
};
exports.CouponController = CouponController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('coupons:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List coupons' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [coupon_types_1.CouponQueryDto]),
    __metadata("design:returntype", Promise)
], CouponController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({ summary: 'List active public coupons for storefront' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CouponController.prototype, "findActivePublic", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get coupon by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CouponController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('coupons:create'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create coupon' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [coupon_types_1.CreateCouponDto, Object]),
    __metadata("design:returntype", Promise)
], CouponController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('coupons:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update coupon' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, coupon_types_1.UpdateCouponDto, Object]),
    __metadata("design:returntype", Promise)
], CouponController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('apply'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Apply coupon to order' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [coupon_types_1.ApplyCouponDto, Object]),
    __metadata("design:returntype", Promise)
], CouponController.prototype, "apply", null);
__decorate([
    (0, common_1.Post)('validate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Validate a coupon code and preview the discount (no side effects)',
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [coupon_types_1.ValidateCouponDto, Object]),
    __metadata("design:returntype", Promise)
], CouponController.prototype, "validate", null);
exports.CouponController = CouponController = __decorate([
    (0, swagger_1.ApiTags)('Coupons'),
    (0, common_1.Controller)('coupons'),
    __metadata("design:paramtypes", [coupon_service_1.CouponService])
], CouponController);
//# sourceMappingURL=coupon.controller.js.map