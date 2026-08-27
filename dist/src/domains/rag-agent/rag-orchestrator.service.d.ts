import { PrismaService } from "../../database/prisma.service";
import { RagAgentRepository } from './rag-agent.repository';
import { RagIntentService } from './rag-intent.service';
import { RagToolRegistry, RagToolContext } from './rag-tool.registry';
import { RagRetrievalService } from './rag-retrieval.service';
import { RagPromptBuilder } from './rag-prompt.builder';
import { LlmProviderRegistry, EmbeddingProviderRegistry } from './rag-providers.service';
export declare class RagOrchestratorService {
    private readonly prisma;
    private readonly repository;
    private readonly intentService;
    private readonly toolRegistry;
    private readonly retrievalService;
    private readonly promptBuilder;
    private readonly llmRegistry;
    private readonly embeddingRegistry;
    private readonly logger;
    constructor(prisma: PrismaService, repository: RagAgentRepository, intentService: RagIntentService, toolRegistry: RagToolRegistry, retrievalService: RagRetrievalService, promptBuilder: RagPromptBuilder, llmRegistry: LlmProviderRegistry, embeddingRegistry: EmbeddingProviderRegistry);
    orchestrate(params: {
        agentKey: string;
        conversationId?: string;
        message: string;
        context: RagToolContext;
    }): Promise<{
        conversationId: string;
        messageId: string;
        answer: string;
        intent: string;
        confidence: number;
        citations: {
            index: number;
            label: any;
            sourceId: any;
            excerpt: any;
            relevanceScore: any;
        }[];
        products: never[];
        toolsUsed: {
            name: any;
            status: any;
        }[];
        suggestedActions: {
            type: string;
            label: string;
            entityId: string;
        }[];
        responseTimeMs: number;
    }>;
}
