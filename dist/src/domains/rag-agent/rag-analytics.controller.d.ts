import { RagAgentRepository } from './rag-agent.repository';
export declare class RagAnalyticsController {
    private readonly repository;
    constructor(repository: RagAgentRepository);
    getSummary(): Promise<import("@common/responses/response.builder").ResponsePayload<{
        totalAgents: number;
        activeAgents: number;
        totalKnowledgeSources: number;
        indexedKnowledgeSources: number;
        totalConversations: number;
        conversationsThisMonth: number;
        averageResponseTimeMs: number;
        successRate: number;
        averageRating: number;
    }>>;
    getAgentAnalytics(agentId: string): Promise<import("@common/responses/response.builder").ResponsePayload<{
        conversations: number;
        messages: number;
        successRate: number;
        averageResponseTimeMs: number;
        averageConfidence: number;
        tokenUsage: {
            prompt: number;
            completion: number;
            total: number;
        };
    }>>;
    getIntents(): Promise<import("@common/responses/response.builder").ResponsePayload<{
        intent: string;
        count: number;
    }[]>>;
    getConversations(page?: number, limit?: number): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: ({
            agent: {
                id: string;
                name: string;
                description: string;
                status: string;
                createdBy: string;
                updatedBy: string | null;
                deletedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                isDefault: boolean;
                avatarUrl: string | null;
                agentKey: string;
                systemPrompt: string;
                modelProvider: string;
                model: string;
                temperature: import("@prisma/client-runtime-utils").Decimal;
                maxTokens: number;
                behaviorConfig: import("@prisma/client/runtime/client").JsonValue;
                guardrailConfig: import("@prisma/client/runtime/client").JsonValue;
                instructions: string | null;
                toolConfig: import("@prisma/client/runtime/client").JsonValue;
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            title: string | null;
            metadata: import("@prisma/client/runtime/client").JsonValue;
            customerId: string | null;
            guestId: string | null;
            agentId: string;
            lastMessageAt: Date;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    getConversationDetails(id: string, page?: number, limit?: number): Promise<import("@common/responses/response.builder").ResponsePayload<{
        conversation: {
            agent: {
                id: string;
                name: string;
                description: string;
                status: string;
                createdBy: string;
                updatedBy: string | null;
                deletedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                isDefault: boolean;
                avatarUrl: string | null;
                agentKey: string;
                systemPrompt: string;
                modelProvider: string;
                model: string;
                temperature: import("@prisma/client-runtime-utils").Decimal;
                maxTokens: number;
                behaviorConfig: import("@prisma/client/runtime/client").JsonValue;
                guardrailConfig: import("@prisma/client/runtime/client").JsonValue;
                instructions: string | null;
                toolConfig: import("@prisma/client/runtime/client").JsonValue;
            };
            toolExecutions: {
                id: string;
                status: string;
                createdAt: Date;
                durationMs: number | null;
                messageId: string | null;
                conversationId: string;
                toolName: string;
                input: import("@prisma/client/runtime/client").JsonValue;
                output: import("@prisma/client/runtime/client").JsonValue | null;
                errorCode: string | null;
                errorMessage: string | null;
            }[];
        } & {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            title: string | null;
            metadata: import("@prisma/client/runtime/client").JsonValue;
            customerId: string | null;
            guestId: string | null;
            agentId: string;
            lastMessageAt: Date;
        };
        messages: {
            data: ({
                citations: {
                    id: string;
                    createdAt: Date;
                    label: string | null;
                    messageId: string;
                    knowledgeSourceId: string;
                    documentId: string | null;
                    chunkId: string | null;
                    citationIndex: number;
                    excerpt: string | null;
                    relevanceScore: import("@prisma/client-runtime-utils").Decimal | null;
                }[];
            } & {
                id: string;
                createdAt: Date;
                role: string;
                content: string;
                metadata: import("@prisma/client/runtime/client").JsonValue;
                modelProvider: string | null;
                model: string | null;
                conversationId: string;
                intent: string | null;
                confidence: import("@prisma/client-runtime-utils").Decimal | null;
                promptTokens: number | null;
                completionTokens: number | null;
                totalTokens: number | null;
                responseTimeMs: number | null;
            })[];
            meta: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
                hasNext: boolean;
                hasPrevious: boolean;
            };
        };
    }>>;
}
