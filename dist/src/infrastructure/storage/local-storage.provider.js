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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalStorageProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const storage_utils_1 = require("./storage.utils");
let LocalStorageProvider = class LocalStorageProvider {
    configService;
    storageRoot;
    publicUrlBase;
    constructor(configService) {
        this.configService = configService;
        this.storageRoot = (0, path_1.resolve)(this.configService.get('app.storage.root', './storage'));
        this.publicUrlBase = this.configService.get('app.storage.publicUrl', '/storage');
    }
    async write(filePath, data, contentType) {
        storage_utils_1.StorageUtils.assertSafePath(filePath);
        const fullPath = (0, path_1.join)(this.storageRoot, filePath);
        await (0, promises_1.mkdir)((0, path_1.join)(fullPath, '..'), { recursive: true });
        await (0, promises_1.writeFile)(fullPath, data);
        return {
            url: this.getPublicUrl(filePath),
            key: filePath,
            bucket: 'local',
            mimeType: contentType ?? 'application/octet-stream',
            size: data.length,
            uploadedAt: new Date(),
        };
    }
    async read(filePath) {
        storage_utils_1.StorageUtils.assertSafePath(filePath);
        return (0, promises_1.readFile)((0, path_1.join)(this.storageRoot, filePath));
    }
    async delete(filePath) {
        storage_utils_1.StorageUtils.assertSafePath(filePath);
        await (0, promises_1.unlink)((0, path_1.join)(this.storageRoot, filePath));
    }
    async exists(filePath) {
        storage_utils_1.StorageUtils.assertSafePath(filePath);
        try {
            await (0, promises_1.access)((0, path_1.join)(this.storageRoot, filePath));
            return true;
        }
        catch {
            return false;
        }
    }
    async copy(sourceKey, destKey) {
        storage_utils_1.StorageUtils.assertSafePath(sourceKey);
        storage_utils_1.StorageUtils.assertSafePath(destKey);
        const destDir = (0, path_1.join)(this.storageRoot, destKey, '..');
        await (0, promises_1.mkdir)(destDir, { recursive: true });
        await (0, promises_1.copyFile)((0, path_1.join)(this.storageRoot, sourceKey), (0, path_1.join)(this.storageRoot, destKey));
    }
    async move(sourceKey, destKey) {
        await this.copy(sourceKey, destKey);
        await this.delete(sourceKey);
    }
    getPublicUrl(filePath) {
        storage_utils_1.StorageUtils.assertSafePath(filePath);
        return `${this.publicUrlBase}/${filePath.replace(/\\/g, '/')}`;
    }
    async getSignedUploadUrl(filePath) {
        throw new Error(`Local storage cannot generate signed upload URLs (key: ${filePath}). Set STORAGE_PROVIDER=s3.`);
    }
    async getSignedDownloadUrl(filePath) {
        return this.getPublicUrl(filePath);
    }
    async healthCheck() {
        try {
            await (0, promises_1.mkdir)(this.storageRoot, { recursive: true });
            return { writable: true, provider: 'local', root: this.storageRoot };
        }
        catch {
            return { writable: false, provider: 'local', root: this.storageRoot };
        }
    }
};
exports.LocalStorageProvider = LocalStorageProvider;
exports.LocalStorageProvider = LocalStorageProvider = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], LocalStorageProvider);
//# sourceMappingURL=local-storage.provider.js.map