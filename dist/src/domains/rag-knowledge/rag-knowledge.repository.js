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
exports.RagKnowledgeRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
let RagKnowledgeRepository = class RagKnowledgeRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(params) {
        const { page, limit } = params;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.ragKnowledgeSource.findMany({
                where: { deletedAt: null },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.ragKnowledgeSource.count({ where: { deletedAt: null } }),
        ]);
        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
                hasNext: page < Math.ceil(total / limit),
                hasPrevious: page > 1,
            },
        };
    }
    async findById(id) {
        return this.prisma.ragKnowledgeSource.findFirst({
            where: { id, deletedAt: null },
        });
    }
    async create(data) {
        return this.prisma.ragKnowledgeSource.create({ data });
    }
    async update(id, data) {
        return this.prisma.ragKnowledgeSource.update({ where: { id }, data });
    }
    async softDelete(id) {
        return this.prisma.ragKnowledgeSource.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async restore(id) {
        return this.prisma.ragKnowledgeSource.update({
            where: { id },
            data: { deletedAt: null },
        });
    }
    async deleteChunksBySourceId(knowledgeSourceId) {
        return this.prisma.$transaction(async (tx) => {
            await tx.ragDocumentChunk.deleteMany({
                where: { knowledgeSourceId },
            });
            await tx.ragDocument.deleteMany({
                where: { knowledgeSourceId },
            });
        });
    }
    async saveDocumentAndChunks(params) {
        return this.prisma.$transaction(async (tx) => {
            const doc = await tx.ragDocument.create({
                data: {
                    knowledgeSourceId: params.knowledgeSourceId,
                    title: params.title,
                    contentHash: params.contentHash,
                },
            });
            await tx.ragDocumentChunk.createMany({
                data: params.chunks.map((c) => ({
                    documentId: doc.id,
                    knowledgeSourceId: params.knowledgeSourceId,
                    chunkIndex: c.chunkIndex,
                    content: c.content,
                    tokenCount: c.tokenCount,
                    embedding: c.embedding,
                    metadata: c.metadata || {},
                })),
            });
            return doc;
        });
    }
    async findChunksBySourceId(knowledgeSourceId, params) {
        const { page, limit } = params;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.ragDocumentChunk.findMany({
                where: { knowledgeSourceId },
                skip,
                take: limit,
                orderBy: { chunkIndex: 'asc' },
            }),
            this.prisma.ragDocumentChunk.count({ where: { knowledgeSourceId } }),
        ]);
        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
                hasNext: page < Math.ceil(total / limit),
                hasPrevious: page > 1,
            },
        };
    }
};
exports.RagKnowledgeRepository = RagKnowledgeRepository;
exports.RagKnowledgeRepository = RagKnowledgeRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RagKnowledgeRepository);
//# sourceMappingURL=rag-knowledge.repository.js.map