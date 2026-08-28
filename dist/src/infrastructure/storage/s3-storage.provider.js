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
var S3StorageProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3StorageProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
let S3StorageProvider = S3StorageProvider_1 = class S3StorageProvider {
    configService;
    logger = new common_1.Logger(S3StorageProvider_1.name);
    client;
    bucket;
    publicUrl;
    signedUrlExpiry;
    region;
    endpoint;
    forcePathStyle;
    constructor(configService) {
        this.configService = configService;
        const region = this.configService.get('app.storage.s3.region', 'ap-south-1');
        const endpoint = this.configService.get('app.storage.s3.endpoint');
        const forcePathStyle = this.configService.get('app.storage.s3.forcePathStyle', false);
        const accessKeyId = this.configService.get('app.storage.s3.accessKeyId', '');
        this.logger.log(`Initializing S3 client... region=${region} bucket=${this.configService.get('app.storage.s3.bucket', '')} endpoint=${endpoint || '(default AWS)'} accessKeySet=${!!accessKeyId} forcePathStyle=${forcePathStyle}`);
        this.client = new client_s3_1.S3Client({
            region,
            ...(endpoint && { endpoint }),
            forcePathStyle,
            credentials: {
                accessKeyId: this.configService.get('app.storage.s3.accessKeyId', ''),
                secretAccessKey: this.configService.get('app.storage.s3.secretAccessKey', ''),
            },
        });
        this.bucket = this.configService.get('app.storage.s3.bucket', '');
        this.region = region;
        this.endpoint = endpoint;
        this.forcePathStyle = forcePathStyle;
        this.publicUrl = this.configService.get('app.storage.s3.publicUrl', '');
        this.signedUrlExpiry = this.configService.get('app.storage.s3.signedUrlExpiry', 3600);
    }
    async write(filePath, data, contentType) {
        const ct = contentType ?? this.getContentType(filePath);
        await this.client.send(new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: filePath,
            Body: data,
            ContentType: ct,
            CacheControl: 'public, max-age=31536000, immutable',
        }));
        return {
            url: this.getPublicUrl(filePath),
            key: filePath,
            bucket: this.bucket,
            mimeType: ct,
            size: data.length,
            uploadedAt: new Date(),
        };
    }
    async read(filePath) {
        const response = await this.client.send(new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: filePath }));
        const chunks = [];
        const stream = response.Body;
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    }
    async delete(filePath) {
        await this.client.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.bucket, Key: filePath }));
    }
    async exists(filePath) {
        try {
            await this.client.send(new client_s3_1.HeadObjectCommand({ Bucket: this.bucket, Key: filePath }));
            return true;
        }
        catch {
            return false;
        }
    }
    async copy(sourceKey, destKey) {
        await this.client.send(new client_s3_1.CopyObjectCommand({
            Bucket: this.bucket,
            CopySource: `${this.bucket}/${sourceKey}`,
            Key: destKey,
        }));
    }
    async move(sourceKey, destKey) {
        await this.copy(sourceKey, destKey);
        await this.delete(sourceKey);
    }
    getPublicUrl(filePath) {
        if (this.publicUrl) {
            return `${this.publicUrl}/${filePath}`;
        }
        if (this.endpoint) {
            const base = this.endpoint.replace(/\/+$/, '');
            return this.forcePathStyle
                ? `${base}/${this.bucket}/${filePath}`
                : `${base.replace('://', `://${this.bucket}.`)}/${filePath}`;
        }
        return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${filePath}`;
    }
    async getSignedUploadUrl(filePath, contentType) {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: filePath,
            ...(contentType && { ContentType: contentType }),
        });
        return (0, s3_request_presigner_1.getSignedUrl)(this.client, command, {
            expiresIn: this.signedUrlExpiry,
        });
    }
    async getSignedDownloadUrl(filePath) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: filePath,
        });
        return (0, s3_request_presigner_1.getSignedUrl)(this.client, command, {
            expiresIn: this.signedUrlExpiry,
        });
    }
    async healthCheck() {
        try {
            const testKey = `.health-check/${Date.now()}`;
            await this.client.send(new client_s3_1.PutObjectCommand({
                Bucket: this.bucket,
                Key: testKey,
                Body: 'health-check',
            }));
            await this.client.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.bucket, Key: testKey }));
            return { writable: true, provider: 's3', root: this.bucket };
        }
        catch (error) {
            this.logger.error(`S3 health check failed for bucket "${this.bucket}": ${error instanceof Error ? error.message : String(error)}`);
            return { writable: false, provider: 's3', root: this.bucket };
        }
    }
    getContentType(filePath) {
        const ext = filePath.split('.').pop()?.toLowerCase();
        const mimeTypes = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            webp: 'image/webp',
            avif: 'image/avif',
            gif: 'image/gif',
            pdf: 'application/pdf',
            mp4: 'video/mp4',
        };
        return mimeTypes[ext ?? ''] ?? 'application/octet-stream';
    }
};
exports.S3StorageProvider = S3StorageProvider;
exports.S3StorageProvider = S3StorageProvider = S3StorageProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], S3StorageProvider);
//# sourceMappingURL=s3-storage.provider.js.map