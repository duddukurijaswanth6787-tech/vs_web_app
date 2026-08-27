"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagKnowledgeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const rag_knowledge_repository_1 = require("./rag-knowledge.repository");
const storage_service_1 = require("../../infrastructure/storage/storage.service");
const audit_service_1 = require("../audit/audit.service");
const rag_ingestion_service_1 = require("./rag-ingestion.service");
const bullmq_1 = require("bullmq");
const dns = __importStar(require("dns"));
const util_1 = require("util");
const crypto = __importStar(require("crypto"));
const resolve4 = (0, util_1.promisify)(dns.resolve4);
let RagKnowledgeService = class RagKnowledgeService {
    repository;
    storageService;
    auditService;
    ingestionService;
    queue;
    logger = new common_1.Logger('RagKnowledgeService');
    isBullMQEnabled = process.env.ENABLE_BULLMQ !== 'false';
    constructor(_prisma, repository, storageService, auditService, ingestionService, queue) {
        this.repository = repository;
        this.storageService = storageService;
        this.auditService = auditService;
        this.ingestionService = ingestionService;
        this.queue = queue;
    }
    async findAll(page, limit) {
        return this.repository.findAll({ page, limit });
    }
    async findById(id) {
        const source = await this.repository.findById(id);
        if (!source)
            throw new common_1.NotFoundException('Knowledge source not found');
        return source;
    }
    async create(dto, userId) {
        let crawledText = dto.rawText || '';
        if (dto.sourceType === 'URL' && dto.sourceUrl) {
            crawledText = await this.crawlUrl(dto.sourceUrl);
        }
        const source = await this.repository.create({
            name: dto.name,
            sourceType: dto.sourceType,
            sourceUrl: dto.sourceUrl || null,
            rawText: crawledText || null,
            status: 'PENDING',
            createdBy: userId,
            metadata: {},
        });
        await this.auditService.log({
            userId,
            action: 'CREATE',
            module: 'RAG_KNOWLEDGE',
            resource: 'RAG',
            resourceId: source.id,
            metadata: { sourceType: source.sourceType },
        });
        await this.triggerIngestion(source.id);
        return source;
    }
    async update(id, dto, userId) {
        await this.findById(id);
        let crawledText = dto.rawText;
        if (dto.sourceUrl) {
            crawledText = await this.crawlUrl(dto.sourceUrl);
        }
        const updated = await this.repository.update(id, {
            name: dto.name || undefined,
            sourceUrl: dto.sourceUrl || undefined,
            rawText: crawledText || undefined,
            status: 'PENDING',
            updatedBy: userId,
        });
        await this.auditService.log({
            userId,
            action: 'UPDATE',
            module: 'RAG_KNOWLEDGE',
            resource: 'RAG',
            resourceId: id,
        });
        await this.triggerIngestion(id);
        return updated;
    }
    async softDelete(id, userId) {
        await this.findById(id);
        const source = await this.repository.softDelete(id);
        await this.auditService.log({
            userId,
            action: 'DELETE',
            module: 'RAG_KNOWLEDGE',
            resource: 'RAG',
            resourceId: id,
        });
        return source;
    }
    async restore(id, userId) {
        await this.repository.restore(id);
        await this.auditService.log({
            userId,
            action: 'RESTORE',
            module: 'RAG_KNOWLEDGE',
            resource: 'RAG',
            resourceId: id,
        });
        return { success: true };
    }
    async getUploadUrl(dto) {
        if (dto.mimeType !== 'text/plain') {
            throw new common_1.BadRequestException('Unsupported document MIME type. Only text/plain is supported.');
        }
        const sourceId = crypto.randomUUID();
        const fileId = crypto.randomUUID();
        const safeName = dto.fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const s3Key = `rag/knowledge/${sourceId}/${fileId}-${safeName}`;
        const uploadUrl = await this.storageService.getSignedUploadUrl(s3Key, dto.mimeType);
        return {
            sourceId,
            s3Key,
            uploadUrl,
        };
    }
    async confirmUpload(id, s3Key, fileName, mimeType, size, userId) {
        if (!s3Key.startsWith(`rag/knowledge/${id}/`)) {
            throw new common_1.BadRequestException('S3 Key does not match the knowledge source ID prefix.');
        }
        const exists = await this.storageService.exists(s3Key);
        if (!exists) {
            throw new common_1.BadRequestException('Uploaded file not found in storage bucket.');
        }
        const source = await this.repository.create({
            id,
            name: fileName,
            sourceType: 'DOCUMENT',
            status: 'PENDING',
            s3Key,
            originalFileName: fileName,
            mimeType,
            metadata: { size },
            createdBy: userId,
        });
        await this.auditService.log({
            userId,
            action: 'CONFIRM_UPLOAD',
            module: 'RAG_KNOWLEDGE',
            resource: 'RAG',
            resourceId: id,
            metadata: { s3Key },
        });
        await this.triggerIngestion(id);
        return source;
    }
    async reindex(id, userId) {
        await this.findById(id);
        await this.repository.update(id, { status: 'PENDING', updatedBy: userId });
        await this.auditService.log({
            userId,
            action: 'REINDEX',
            module: 'RAG_KNOWLEDGE',
            resource: 'RAG',
            resourceId: id,
        });
        await this.triggerIngestion(id);
        return { success: true };
    }
    async triggerIngestion(sourceId) {
        if (this.isBullMQEnabled) {
            await this.queue.add('ingest', { sourceId });
            this.logger.log(`Ingestion job queued for source: ${sourceId}`);
        }
        else {
            setTimeout(() => {
                void (async () => {
                    try {
                        await this.ingestionService.processIngestion(sourceId);
                    }
                    catch (err) {
                        this.logger.error(`Synchronous background ingestion failed: ${err.message}`);
                    }
                })();
            }, 100);
        }
    }
    async crawlUrl(urlStr) {
        const url = new URL(urlStr);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            throw new common_1.BadRequestException('Protocol not allowed. Only HTTP and HTTPS are permitted.');
        }
        let ip;
        try {
            const addresses = await resolve4(url.hostname);
            ip = addresses[0];
        }
        catch {
            throw new common_1.BadRequestException('Failed to resolve hostname');
        }
        if (this.isPrivateIp(ip)) {
            throw new common_1.BadRequestException('SSRF Detected: Forbidden destination IP address.');
        }
        try {
            const res = await fetch(url.toString(), {
                signal: AbortSignal.timeout(5000),
            });
            if (!res.ok) {
                throw new Error(`Server returned HTTP ${res.status}`);
            }
            const buffer = await res.arrayBuffer();
            if (buffer.byteLength > 5242880) {
                throw new Error('Content exceeds maximum limit of 5MB');
            }
            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('text/html') &&
                !contentType.includes('text/plain')) {
                throw new Error('Content-Type not allowed');
            }
            const text = new TextDecoder('utf-8').decode(buffer);
            return text
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }
        catch (err) {
            throw new common_1.BadRequestException(`URL crawling failed: ${err.message}`);
        }
    }
    isPrivateIp(ip) {
        const parts = ip.split('.').map(Number);
        if (parts.length !== 4)
            return true;
        if (parts[0] === 127)
            return true;
        if (parts[0] === 10)
            return true;
        if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
            return true;
        if (parts[0] === 192 && parts[1] === 168)
            return true;
        if (parts[0] === 169 && parts[1] === 254)
            return true;
        if (parts[0] === 0)
            return true;
        return false;
    }
    async findChunks(id, page, limit) {
        await this.findById(id);
        return this.repository.findChunksBySourceId(id, { page, limit });
    }
};
exports.RagKnowledgeService = RagKnowledgeService;
exports.RagKnowledgeService = RagKnowledgeService = __decorate([
    (0, common_1.Injectable)(),
    __param(5, (0, common_1.Inject)('BullQueue_rag-ingestion')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rag_knowledge_repository_1.RagKnowledgeRepository,
        storage_service_1.StorageService,
        audit_service_1.AuditService,
        rag_ingestion_service_1.RagIngestionService,
        bullmq_1.Queue])
], RagKnowledgeService);
//# sourceMappingURL=rag-knowledge.service.js.map