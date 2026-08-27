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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagIngestionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const rag_knowledge_repository_1 = require("./rag-knowledge.repository");
const rag_providers_service_1 = require("../rag-agent/rag-providers.service");
const config_1 = require("@nestjs/config");
const storage_service_1 = require("../../infrastructure/storage/storage.service");
const crypto = __importStar(require("crypto"));
let RagIngestionService = class RagIngestionService {
    prisma;
    repository;
    embeddingRegistry;
    configService;
    storageService;
    logger = new common_1.Logger('RagIngestionService');
    constructor(prisma, repository, embeddingRegistry, configService, storageService) {
        this.prisma = prisma;
        this.repository = repository;
        this.embeddingRegistry = embeddingRegistry;
        this.configService = configService;
        this.storageService = storageService;
    }
    async processIngestion(sourceId) {
        this.logger.log(`Starting ingestion processor for source: ${sourceId}`);
        await this.repository.update(sourceId, {
            status: 'PROCESSING',
            indexingError: null,
        });
        try {
            const source = await this.prisma.ragKnowledgeSource.findUnique({
                where: { id: sourceId },
            });
            if (!source || source.deletedAt) {
                throw new Error('Knowledge source not found or deleted');
            }
            let contentText = '';
            if (source.sourceType === 'TEXT') {
                contentText = source.rawText || '';
            }
            else if (source.sourceType === 'FAQ') {
                const faqs = await this.prisma.faq.findMany({
                    where: { isActive: true },
                });
                contentText = faqs
                    .map((f) => `Question: ${f.question}\nAnswer: ${f.answer}\nCategory: ${f.category || 'General'}`)
                    .join('\n\n');
            }
            else if (source.sourceType === 'CMS') {
                const pages = await this.prisma.cmsPage.findMany({
                    where: { status: 'PUBLISHED', deletedAt: null },
                });
                contentText = pages
                    .map((p) => `Title: ${p.title}\nSlug: ${p.slug}\nContent: ${p.content || ''}`)
                    .join('\n\n');
            }
            else if (source.sourceType === 'DOCUMENT') {
                if (!source.s3Key) {
                    throw new Error('S3 Key is missing for document source');
                }
                if (source.mimeType !== 'text/plain') {
                    throw new Error(`Unsupported document MIME type: ${source.mimeType}. Only text/plain is supported.`);
                }
                const buffer = await this.storageService.get(source.s3Key);
                contentText = buffer.toString('utf-8');
            }
            else if (source.sourceType === 'URL') {
                if (!source.sourceUrl) {
                    throw new Error('Source URL is missing');
                }
                contentText = source.rawText || '';
                if (!contentText) {
                    throw new Error('URL content has not been fetched or parsed.');
                }
            }
            if (!contentText.trim()) {
                throw new Error('Ingested content is empty');
            }
            const normalized = contentText
                .replace(/\r\n/g, '\n')
                .replace(/\n{3,}/g, '\n\n')
                .replace(/[ \t]+/g, ' ')
                .trim();
            const checksum = crypto
                .createHash('sha256')
                .update(normalized)
                .digest('hex');
            if (source.checksum === checksum && source.status === 'INDEXED') {
                this.logger.log(`Content checksum is identical. Skipping re-indexing.`);
                await this.repository.update(sourceId, {
                    status: 'INDEXED',
                    lastIndexedAt: new Date(),
                });
                return;
            }
            const chunkSize = Number(this.configService.get('RAG_CHUNK_SIZE') || 800);
            const overlap = Number(this.configService.get('RAG_CHUNK_OVERLAP') || 120);
            const chunks = this.splitIntoChunks(normalized, chunkSize, overlap);
            if (chunks.length === 0) {
                throw new Error('No valid chunks generated');
            }
            const embeddingProvider = this.embeddingRegistry.getProvider('gemini');
            const chunkEmbeddings = await embeddingProvider.embedBatch(chunks.map((c) => c.text), 'text-embedding-004');
            await this.repository.deleteChunksBySourceId(sourceId);
            const chunkData = chunks.map((c, idx) => ({
                chunkIndex: idx,
                content: c.text,
                tokenCount: Math.round(c.text.length / 4),
                embedding: chunkEmbeddings[idx],
                metadata: { length: c.text.length, range: c.range },
            }));
            await this.repository.saveDocumentAndChunks({
                knowledgeSourceId: sourceId,
                title: source.name,
                contentHash: checksum,
                chunks: chunkData,
            });
            await this.repository.update(sourceId, {
                status: 'INDEXED',
                checksum,
                lastIndexedAt: new Date(),
            });
            this.logger.log(`Ingestion completed successfully for source ${sourceId}. Total chunks: ${chunks.length}`);
        }
        catch (err) {
            this.logger.error(`Ingestion failed for source ${sourceId}: ${err.message}`);
            await this.repository.update(sourceId, {
                status: 'FAILED',
                indexingError: err.message,
            });
        }
    }
    splitIntoChunks(text, size, overlap) {
        const paragraphs = text.split('\n\n');
        const chunks = [];
        let currentChunk = '';
        let startIdx = 0;
        for (let i = 0; i < paragraphs.length; i++) {
            const p = paragraphs[i];
            if ((currentChunk + '\n\n' + p).length <= size) {
                currentChunk = currentChunk ? currentChunk + '\n\n' + p : p;
            }
            else {
                if (currentChunk) {
                    chunks.push({
                        text: currentChunk,
                        range: `${startIdx}-${startIdx + currentChunk.length}`,
                    });
                    startIdx += currentChunk.length - overlap;
                }
                if (p.length > size) {
                    let cursor = 0;
                    while (cursor < p.length) {
                        const sub = p.substring(cursor, cursor + size);
                        chunks.push({
                            text: sub,
                            range: `${startIdx + cursor}-${startIdx + cursor + sub.length}`,
                        });
                        cursor += size - overlap;
                    }
                    currentChunk = '';
                }
                else {
                    currentChunk = p;
                }
            }
        }
        if (currentChunk) {
            chunks.push({
                text: currentChunk,
                range: `${startIdx}-${startIdx + currentChunk.length}`,
            });
        }
        return chunks;
    }
};
exports.RagIngestionService = RagIngestionService;
exports.RagIngestionService = RagIngestionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rag_knowledge_repository_1.RagKnowledgeRepository,
        rag_providers_service_1.EmbeddingProviderRegistry,
        config_1.ConfigService,
        storage_service_1.StorageService])
], RagIngestionService);
//# sourceMappingURL=rag-ingestion.service.js.map