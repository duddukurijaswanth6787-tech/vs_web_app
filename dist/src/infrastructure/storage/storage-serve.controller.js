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
exports.StorageServeController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const storage_service_1 = require("./storage.service");
const storage_utils_1 = require("./storage.utils");
const jwt_auth_guard_1 = require("../../domains/auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../domains/auth/guards/permissions.guard");
const response_builder_1 = require("../../common/responses/response.builder");
const VARIANT_WIDTHS = {
    thumb: 150,
    medium: 600,
    large: 1200,
};
let StorageServeController = class StorageServeController {
    storageService;
    constructor(storageService) {
        this.storageService = storageService;
    }
    async upload(file, folder, req) {
        if (!file)
            throw new common_1.BadRequestException('No file provided');
        const absolute = (url) => url && url.startsWith('/')
            ? `${req.protocol}://${req.get('host')}${url}`
            : url;
        const isImage = file.mimetype.startsWith('image/');
        if (isImage) {
            const variants = await this.storageService.uploadImage(file.buffer, {
                originalName: file.originalname,
                mimeType: file.mimetype,
                folder: folder || 'products',
            });
            return response_builder_1.ResponseBuilder.success({
                url: absolute(variants.original.url),
                thumbnailUrl: absolute(variants.thumbnail?.url),
                mediumUrl: absolute(variants.medium?.url),
                largeUrl: absolute(variants.large?.url),
            });
        }
        const result = await this.storageService.upload(file.buffer, {
            originalName: file.originalname,
            mimeType: file.mimetype,
            folder: folder || 'products',
        });
        return response_builder_1.ResponseBuilder.success({ url: absolute(result.url) });
    }
    async serve(path, variant, req, res) {
        const raw = (Array.isArray(path) ? path.join('/') : path) ||
            req.path.replace(/^\/api\/v1\/storage\/?/, '');
        const key = decodeURIComponent(String(raw).replace(/^\/+/, ''));
        if (!key || key.includes('..')) {
            return res.status(400).json({ message: 'Invalid storage key' });
        }
        try {
            storage_utils_1.StorageUtils.assertSafePath(key);
        }
        catch {
            return res.status(400).json({ message: 'Invalid storage key' });
        }
        const isVariantRequest = variant && Object.prototype.hasOwnProperty.call(VARIANT_WIDTHS, variant);
        try {
            if (isVariantRequest) {
                const { buffer, contentType } = await this.storageService.getOrGenerateVariant(key, variant);
                res.set({
                    'Content-Type': contentType,
                    'Content-Length': String(buffer.length),
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    Vary: 'Accept',
                });
                return res.send(buffer);
            }
            const exists = await this.storageService.exists(key);
            if (!exists) {
                return res.status(404).json({ message: 'File not found' });
            }
            const buffer = await this.storageService.get(key);
            const ext = key.split('.').pop()?.toLowerCase() ?? '';
            const mimeTypes = {
                jpg: 'image/jpeg',
                jpeg: 'image/jpeg',
                png: 'image/png',
                webp: 'image/webp',
                avif: 'image/avif',
                gif: 'image/gif',
                svg: 'image/svg+xml',
                pdf: 'application/pdf',
                mp4: 'video/mp4',
            };
            res.set({
                'Content-Type': mimeTypes[ext] ?? 'application/octet-stream',
                'Content-Length': String(buffer.length),
                'Cache-Control': 'public, max-age=31536000, immutable',
            });
            return res.send(buffer);
        }
        catch (err) {
            if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) {
                return res.status(404).json({ message: 'File not found' });
            }
            return res.status(500).json({ message: 'Failed to serve file' });
        }
    }
};
exports.StorageServeController = StorageServeController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('products:update'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({
        summary: 'Direct file upload (works with local or S3 storage)',
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('folder')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], StorageServeController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)('*path'),
    (0, swagger_1.ApiOperation)({
        summary: 'Serve a stored file by key with optional WebP variant',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'variant',
        required: false,
        enum: ['thumb', 'medium', 'large'],
    }),
    __param(0, (0, common_1.Param)('path')),
    __param(1, (0, common_1.Query)('variant')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], StorageServeController.prototype, "serve", null);
exports.StorageServeController = StorageServeController = __decorate([
    (0, swagger_1.ApiTags)('Storage'),
    (0, common_1.Controller)('storage'),
    __metadata("design:paramtypes", [storage_service_1.StorageService])
], StorageServeController);
//# sourceMappingURL=storage-serve.controller.js.map