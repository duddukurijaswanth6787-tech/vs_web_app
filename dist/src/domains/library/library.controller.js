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
exports.LibraryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const library_service_1 = require("./library.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let LibraryController = class LibraryController {
    libraryService;
    constructor(libraryService) {
        this.libraryService = libraryService;
    }
    async listMedia(folderId, mimeType, search, page, limit, sortBy, sortOrder) {
        return response_builder_1.ResponseBuilder.success(await this.libraryService.listMedia({
            folderId,
            mimeType,
            search,
            page,
            limit,
            sortBy,
            sortOrder,
        }));
    }
    async getMedia(id) {
        return response_builder_1.ResponseBuilder.success(await this.libraryService.getMedia(id));
    }
    async createMedia(body, user) {
        return response_builder_1.ResponseBuilder.created(await this.libraryService.createMedia({ ...body, uploadedBy: user.sub }), 'Media uploaded');
    }
    async updateMedia(id, body, user) {
        return response_builder_1.ResponseBuilder.success(await this.libraryService.updateMedia(id, body, user.sub), 'Media updated');
    }
    async renameMedia(id, body, user) {
        return response_builder_1.ResponseBuilder.success(await this.libraryService.renameMedia(id, body.originalFilename, user.sub), 'Media renamed');
    }
    async replaceMedia(id, body, user) {
        return response_builder_1.ResponseBuilder.success(await this.libraryService.replaceMedia(id, body, user.sub), 'Media replaced');
    }
    async bulkDeleteMedia(body, user) {
        return response_builder_1.ResponseBuilder.success(await this.libraryService.bulkDeleteMedia(body.ids, user.sub), 'Media deleted');
    }
    async bulkMoveMedia(body, user) {
        await this.libraryService.bulkMoveMedia(body.ids, body.folderId, user.sub);
        return response_builder_1.ResponseBuilder.success(null, 'Media moved');
    }
    async restoreMedia(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.libraryService.restoreMedia(id, user.sub), 'Media restored');
    }
    async deleteMedia(id, user) {
        await this.libraryService.deleteMedia(id, user.sub);
        return response_builder_1.ResponseBuilder.deleted('Media deleted');
    }
    async getUploadUrl(body) {
        return response_builder_1.ResponseBuilder.success(await this.libraryService.getUploadUrl(body.filename, body.mimeType), 'Upload URL generated');
    }
    async findDuplicates(checksum) {
        return response_builder_1.ResponseBuilder.success(await this.libraryService.findDuplicates(checksum));
    }
    async listFolders(parentId) {
        return response_builder_1.ResponseBuilder.success(await this.libraryService.listFolders(parentId));
    }
    async getFolder(id) {
        return response_builder_1.ResponseBuilder.success(await this.libraryService.getFolder(id));
    }
    async createFolder(body, user) {
        return response_builder_1.ResponseBuilder.created(await this.libraryService.createFolder({ ...body, createdBy: user.sub }), 'Folder created');
    }
    async updateFolder(id, body, user) {
        return response_builder_1.ResponseBuilder.success(await this.libraryService.updateFolder(id, body, user.sub), 'Folder updated');
    }
    async deleteFolder(id, user) {
        await this.libraryService.deleteFolder(id, user.sub);
        return response_builder_1.ResponseBuilder.deleted('Folder deleted');
    }
};
exports.LibraryController = LibraryController;
__decorate([
    (0, common_1.Get)('media'),
    (0, swagger_1.ApiOperation)({ summary: 'List media library with filtering and pagination' }),
    __param(0, (0, common_1.Query)('folderId')),
    __param(1, (0, common_1.Query)('mimeType')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __param(5, (0, common_1.Query)('sortBy')),
    __param(6, (0, common_1.Query)('sortOrder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "listMedia", null);
__decorate([
    (0, common_1.Get)('media/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get media by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "getMedia", null);
__decorate([
    (0, common_1.Post)('media'),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Create media record after upload' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "createMedia", null);
__decorate([
    (0, common_1.Patch)('media/:id'),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Update media metadata' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "updateMedia", null);
__decorate([
    (0, common_1.Patch)('media/:id/rename'),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Rename media file' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "renameMedia", null);
__decorate([
    (0, common_1.Post)('media/:id/replace'),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Replace media file' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "replaceMedia", null);
__decorate([
    (0, common_1.Post)('media/bulk-delete'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk soft delete media' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "bulkDeleteMedia", null);
__decorate([
    (0, common_1.Post)('media/bulk-move'),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk move media to folder' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "bulkMoveMedia", null);
__decorate([
    (0, common_1.Post)('media/:id/restore'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Restore soft-deleted media' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "restoreMedia", null);
__decorate([
    (0, common_1.Delete)('media/:id'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete media' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "deleteMedia", null);
__decorate([
    (0, common_1.Post)('media/upload-url'),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get signed S3 upload URL for library media' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "getUploadUrl", null);
__decorate([
    (0, common_1.Get)('media/duplicates'),
    (0, swagger_1.ApiOperation)({ summary: 'Find duplicate media by checksum' }),
    __param(0, (0, common_1.Query)('checksum')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "findDuplicates", null);
__decorate([
    (0, common_1.Get)('folders'),
    (0, swagger_1.ApiOperation)({
        summary: 'List root-level folders (pass parentId to get children)',
    }),
    __param(0, (0, common_1.Query)('parentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "listFolders", null);
__decorate([
    (0, common_1.Get)('folders/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get folder by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "getFolder", null);
__decorate([
    (0, common_1.Post)('folders'),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a media folder' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "createFolder", null);
__decorate([
    (0, common_1.Patch)('folders/:id'),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Update folder metadata' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "updateFolder", null);
__decorate([
    (0, common_1.Delete)('folders/:id'),
    (0, roles_guard_1.Roles)('super_admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a folder' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "deleteFolder", null);
exports.LibraryController = LibraryController = __decorate([
    (0, swagger_1.ApiTags)('Media Library'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin', 'manager'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('library'),
    __metadata("design:paramtypes", [library_service_1.LibraryService])
], LibraryController);
//# sourceMappingURL=library.controller.js.map