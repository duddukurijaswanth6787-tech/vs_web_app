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
exports.MediaController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const media_service_1 = require("./media.service");
const media_types_1 = require("./media.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let MediaController = class MediaController {
    mediaService;
    constructor(mediaService) {
        this.mediaService = mediaService;
    }
    async findAll(query) {
        return response_builder_1.ResponseBuilder.success(await this.mediaService.findAll(query));
    }
    async findById(id) {
        return response_builder_1.ResponseBuilder.success(await this.mediaService.findById(id));
    }
    async create(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.mediaService.create(dto, user.sub), 'Media created');
    }
    async update(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.mediaService.update(id, dto, user.sub), 'Media updated');
    }
    async delete(id, user) {
        await this.mediaService.delete(id, user.sub);
        return response_builder_1.ResponseBuilder.deleted('Media deleted');
    }
    async restore(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.mediaService.restore(id, user.sub), 'Media restored');
    }
    async setPrimary(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.mediaService.setPrimary(id, user.sub), 'Primary media set');
    }
    async reorder(dto) {
        return response_builder_1.ResponseBuilder.success(await this.mediaService.reorder(dto), 'Gallery reordered');
    }
    async getUploadUrl(body) {
        const data = await this.mediaService.getUploadUrl(body.productId, body.mediaType, body.extension);
        return response_builder_1.ResponseBuilder.success(data, 'Upload URL generated');
    }
};
exports.MediaController = MediaController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List product media with filtering, pagination' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [media_types_1.MediaQueryDto]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get media by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Upload/add media to product' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [media_types_1.CreateMediaDto, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update media' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, media_types_1.UpdateMediaDto, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete media' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/restore'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Restore deleted media' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "restore", null);
__decorate([
    (0, common_1.Post)(':id/set-primary'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Set media as primary image' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "setPrimary", null);
__decorate([
    (0, common_1.Post)('reorder'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Reorder media gallery' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [media_types_1.ReorderMediaDto]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "reorder", null);
__decorate([
    (0, common_1.Post)('upload-url'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get a signed S3 upload URL for product media' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MediaController.prototype, "getUploadUrl", null);
exports.MediaController = MediaController = __decorate([
    (0, swagger_1.ApiTags)('Product Media'),
    (0, common_1.Controller)('media'),
    __metadata("design:paramtypes", [media_service_1.MediaService])
], MediaController);
//# sourceMappingURL=media.controller.js.map