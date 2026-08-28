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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const sharp_1 = __importDefault(require("sharp"));
const logger_service_1 = require("../../common/logger/logger.service");
const exceptions_1 = require("../../common/exceptions");
const constants_1 = require("../../common/constants");
const storage_constants_1 = require("./storage.constants");
const storage_utils_1 = require("./storage.utils");
let StorageService = class StorageService {
    provider;
    configService;
    loggerService;
    constructor(provider, configService, loggerService) {
        this.provider = provider;
        this.configService = configService;
        this.loggerService = loggerService;
    }
    async upload(data, options) {
        this.validate(data, options.mimeType);
        const key = storage_utils_1.StorageUtils.generateKey(options.folder, options.entityId, options.mimeType);
        const result = await this.provider.write(key, data, options.mimeType);
        this.loggerService.log(`File uploaded: ${key} (${data.length} bytes)`, 'StorageService');
        return result;
    }
    async uploadImage(data, options) {
        this.validate(data, options.mimeType);
        if (!this.isImage(options.mimeType)) {
            throw new exceptions_1.FileUploadException('File is not an image', 'INVALID_FILE_TYPE');
        }
        const key = storage_utils_1.StorageUtils.generateKey(options.folder, options.entityId, options.mimeType);
        const baseKey = key.replace(/\.[^.]+$/, '');
        const [original, thumbnail, medium, large] = await Promise.all([
            this.provider.write(`${baseKey}.webp`, await this.toWebp(data), 'image/webp'),
            this.provider.write(`${baseKey}_thumb.webp`, await this.toWebp(data, 150), 'image/webp'),
            this.provider.write(`${baseKey}_medium.webp`, await this.toWebp(data, 600), 'image/webp'),
            this.provider.write(`${baseKey}_large.webp`, await this.toWebp(data, 1200), 'image/webp'),
        ]);
        this.loggerService.log(`Image uploaded with variants: ${baseKey}`, 'StorageService');
        return { original, thumbnail, medium, large };
    }
    async delete(storagePath) {
        await this.provider.delete(storagePath);
        this.loggerService.log(`File deleted: ${storagePath}`, 'StorageService');
    }
    async deleteImageVariants(baseKey) {
        const keys = [
            `${baseKey}.webp`,
            `${baseKey}_thumb.webp`,
            `${baseKey}_medium.webp`,
            `${baseKey}_large.webp`,
        ];
        await Promise.all(keys.map((k) => this.provider.delete(k).catch(() => { })));
    }
    async get(storagePath) {
        return this.provider.read(storagePath);
    }
    async exists(storagePath) {
        return this.provider.exists(storagePath);
    }
    async getOrGenerateVariant(key, variant) {
        const widths = {
            thumb: 150,
            medium: 600,
            large: 1200,
        };
        const baseKey = key.replace(/\.[^.]+$/, '');
        const variantKey = `${baseKey}_${variant}.webp`;
        try {
            if (await this.provider.exists(variantKey)) {
                return {
                    buffer: await this.provider.read(variantKey),
                    contentType: 'image/webp',
                };
            }
        }
        catch {
        }
        const original = await this.provider.read(key);
        const webp = await this.toWebp(original, widths[variant]);
        try {
            await this.provider.write(variantKey, webp, 'image/webp');
            this.loggerService.log(`Generated variant: ${variantKey} (${webp.length} bytes)`, 'StorageService');
        }
        catch (err) {
            this.loggerService.warn(`Failed to cache variant ${variantKey}: ${String(err)}`, 'StorageService');
        }
        return { buffer: webp, contentType: 'image/webp' };
    }
    async copy(sourceKey, destKey) {
        return this.provider.copy(sourceKey, destKey);
    }
    async move(sourceKey, destKey) {
        return this.provider.move(sourceKey, destKey);
    }
    getPublicUrl(filePath) {
        return this.provider.getPublicUrl(filePath);
    }
    sanitizeUrl(url) {
        if (!url)
            return url;
        const match = /^https?:\/\/[^/]+:4000\/api\/v1\/storage\/(.+)$/.exec(url);
        if (!match)
            return url;
        try {
            return this.getPublicUrl(decodeURIComponent(match[1]));
        }
        catch {
            return url;
        }
    }
    async getSignedUploadUrl(filePath, contentType) {
        return this.provider.getSignedUploadUrl(filePath, contentType);
    }
    async getSignedDownloadUrl(filePath) {
        return this.provider.getSignedDownloadUrl(filePath);
    }
    async healthCheck() {
        return this.provider.healthCheck();
    }
    validate(data, mimeType) {
        const maxSize = this.configService.get('app.storage.maxFileSize') ??
            constants_1.FILE_LIMITS.MAX_FILE_SIZE;
        const allowedMimeTypes = [
            ...(this.configService
                .get('app.storage.allowedMimeTypes')
                ?.split(',') ?? [...constants_1.FILE_LIMITS.ALLOWED_MIME_TYPES]),
            'text/csv',
        ];
        if (!allowedMimeTypes.includes(mimeType)) {
            throw new exceptions_1.FileUploadException(`File type ${mimeType} is not allowed`, 'INVALID_FILE_TYPE', { allowedMimeTypes, mimeType });
        }
        if (data.length > maxSize) {
            throw new exceptions_1.FileUploadException(`File size ${data.length} exceeds maximum ${maxSize}`, 'FILE_TOO_LARGE', { maxSize, fileSize: data.length });
        }
    }
    isImage(mimeType) {
        return mimeType.startsWith('image/');
    }
    async toWebp(data, maxWidth) {
        let pipeline = (0, sharp_1.default)(data).webp({ quality: 80 });
        if (maxWidth) {
            pipeline = pipeline.resize(maxWidth, null, { withoutEnlargement: true });
        }
        return pipeline.toBuffer();
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(storage_constants_1.STORAGE_PROVIDER)),
    __metadata("design:paramtypes", [Object, config_1.ConfigService,
        logger_service_1.LoggerService])
], StorageService);
//# sourceMappingURL=storage.service.js.map