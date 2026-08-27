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
exports.RagRetrievalService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const client_1 = require("@prisma/client");
let RagRetrievalService = class RagRetrievalService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async retrieve(params) {
        const { agentId, query, queryEmbedding, limit = 8, minScore = 0.65, } = params;
        const assignedSources = await this.prisma.ragAgentKnowledgeSource.findMany({
            where: { agentId },
            include: {
                knowledgeSource: true,
            },
        });
        const activeSourceIds = assignedSources
            .filter((as) => as.knowledgeSource.status === 'INDEXED' &&
            !as.knowledgeSource.deletedAt)
            .map((as) => as.knowledgeSourceId);
        if (activeSourceIds.length === 0) {
            return [];
        }
        const pgVectorString = `{${queryEmbedding.join(',')}}`;
        const rawChunks = await this.prisma.$queryRaw `
      SELECT 
        c.id, 
        c."documentId", 
        c."knowledgeSourceId", 
        c.content, 
        c.metadata,
        (
          SELECT sum(a * b) 
          FROM unnest(c.embedding) WITH ORDINALITY AS x(a, i) 
          JOIN unnest(CAST(${pgVectorString} as double precision[])) WITH ORDINALITY AS y(b, j) ON i = j
        ) AS "vectorScore"
      FROM rag_document_chunks c
      WHERE c."knowledgeSourceId" IN (${client_1.Prisma.join(activeSourceIds)})
      ORDER BY "vectorScore" DESC
      LIMIT ${limit * 2}
    `;
        const results = [];
        for (const chunk of rawChunks) {
            const vScore = Number(chunk.vectorScore || 0);
            const queryTerms = query
                .toLowerCase()
                .split(/\s+/)
                .filter((t) => t.length > 2);
            let keywordCount = 0;
            const contentLower = chunk.content.toLowerCase();
            queryTerms.forEach((term) => {
                if (contentLower.includes(term)) {
                    keywordCount++;
                }
            });
            const keywordScore = queryTerms.length > 0 ? keywordCount / queryTerms.length : 0;
            const finalScore = vScore * 0.8 + keywordScore * 0.2;
            if (finalScore >= minScore) {
                results.push({
                    chunkId: chunk.id,
                    documentId: chunk.documentId,
                    knowledgeSourceId: chunk.knowledgeSourceId,
                    content: chunk.content,
                    vectorScore: vScore,
                    keywordScore,
                    finalScore,
                    metadata: chunk.metadata || {},
                });
            }
        }
        results.sort((a, b) => b.finalScore - a.finalScore);
        const seen = new Set();
        return results
            .filter((r) => {
            const key = `${r.documentId}_${r.content.substring(0, 30)}`;
            if (seen.has(key))
                return false;
            seen.add(key);
            return true;
        })
            .slice(0, limit);
    }
};
exports.RagRetrievalService = RagRetrievalService;
exports.RagRetrievalService = RagRetrievalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RagRetrievalService);
//# sourceMappingURL=rag-retrieval.service.js.map