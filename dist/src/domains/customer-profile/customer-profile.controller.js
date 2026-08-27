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
exports.CustomerProfileController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const customer_profile_service_1 = require("./customer-profile.service");
const customer_profile_types_1 = require("./customer-profile.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let CustomerProfileController = class CustomerProfileController {
    profileService;
    constructor(profileService) {
        this.profileService = profileService;
    }
    async getProfile(user) {
        return response_builder_1.ResponseBuilder.success(await this.profileService.getProfile(user.sub));
    }
    async updateProfile(dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.profileService.updateProfile(user.sub, dto), 'Profile updated');
    }
    async adminGetProfile(userId) {
        return response_builder_1.ResponseBuilder.success(await this.profileService.getProfile(userId));
    }
    async adminUpdateProfile(userId, dto) {
        return response_builder_1.ResponseBuilder.success(await this.profileService.updateProfile(userId, dto), 'Profile updated by Admin');
    }
};
exports.CustomerProfileController = CustomerProfileController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get own customer profile' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomerProfileController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update own customer profile' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [customer_profile_types_1.UpdateProfileDto, Object]),
    __metadata("design:returntype", Promise)
], CustomerProfileController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('admin/:userId'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('customers:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get customer profile by user ID (Admin only)' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomerProfileController.prototype, "adminGetProfile", null);
__decorate([
    (0, common_1.Patch)('admin/:userId'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('customers:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Update customer profile by user ID (Admin only)' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, customer_profile_types_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], CustomerProfileController.prototype, "adminUpdateProfile", null);
exports.CustomerProfileController = CustomerProfileController = __decorate([
    (0, swagger_1.ApiTags)('Customer Profile'),
    (0, common_1.Controller)('customer-profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [customer_profile_service_1.CustomerProfileService])
], CustomerProfileController);
//# sourceMappingURL=customer-profile.controller.js.map