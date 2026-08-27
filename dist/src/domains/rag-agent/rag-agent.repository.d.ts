import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class RagAgentRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        page: number;
        limit: number;
    }): Promise<{
        data: ({
            _count: {
                conversations: number;
            };
        } & {
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
            temperature: Prisma.Decimal;
            maxTokens: number;
            behaviorConfig: Prisma.JsonValue;
            guardrailConfig: Prisma.JsonValue;
            instructions: string | null;
            toolConfig: Prisma.JsonValue;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string): Promise<({
        knowledgeSources: ({
            knowledgeSource: {
                id: string;
                name: string;
                status: string;
                createdBy: string;
                updatedBy: string | null;
                deletedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                metadata: Prisma.JsonValue;
                mimeType: string | null;
                checksum: string | null;
                sourceType: string;
                sourceUrl: string | null;
                s3Key: string | null;
                originalFileName: string | null;
                rawText: string | null;
                indexingError: string | null;
                lastIndexedAt: Date | null;
            };
        } & {
            createdAt: Date;
            priority: number;
            knowledgeSourceId: string;
            agentId: string;
        })[];
    } & {
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
        temperature: Prisma.Decimal;
        maxTokens: number;
        behaviorConfig: Prisma.JsonValue;
        guardrailConfig: Prisma.JsonValue;
        instructions: string | null;
        toolConfig: Prisma.JsonValue;
    }) | null>;
    findByKey(agentKey: string): Promise<({
        knowledgeSources: ({
            knowledgeSource: {
                id: string;
                name: string;
                status: string;
                createdBy: string;
                updatedBy: string | null;
                deletedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                metadata: Prisma.JsonValue;
                mimeType: string | null;
                checksum: string | null;
                sourceType: string;
                sourceUrl: string | null;
                s3Key: string | null;
                originalFileName: string | null;
                rawText: string | null;
                indexingError: string | null;
                lastIndexedAt: Date | null;
            };
        } & {
            createdAt: Date;
            priority: number;
            knowledgeSourceId: string;
            agentId: string;
        })[];
    } & {
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
        temperature: Prisma.Decimal;
        maxTokens: number;
        behaviorConfig: Prisma.JsonValue;
        guardrailConfig: Prisma.JsonValue;
        instructions: string | null;
        toolConfig: Prisma.JsonValue;
    }) | null>;
    create(data: Prisma.RagAgentCreateInput): Promise<{
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
        temperature: Prisma.Decimal;
        maxTokens: number;
        behaviorConfig: Prisma.JsonValue;
        guardrailConfig: Prisma.JsonValue;
        instructions: string | null;
        toolConfig: Prisma.JsonValue;
    }>;
    update(id: string, data: Prisma.RagAgentUpdateInput): Promise<{
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
        temperature: Prisma.Decimal;
        maxTokens: number;
        behaviorConfig: Prisma.JsonValue;
        guardrailConfig: Prisma.JsonValue;
        instructions: string | null;
        toolConfig: Prisma.JsonValue;
    }>;
    softDelete(id: string): Promise<{
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
        temperature: Prisma.Decimal;
        maxTokens: number;
        behaviorConfig: Prisma.JsonValue;
        guardrailConfig: Prisma.JsonValue;
        instructions: string | null;
        toolConfig: Prisma.JsonValue;
    }>;
    restore(id: string): Promise<{
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
        temperature: Prisma.Decimal;
        maxTokens: number;
        behaviorConfig: Prisma.JsonValue;
        guardrailConfig: Prisma.JsonValue;
        instructions: string | null;
        toolConfig: Prisma.JsonValue;
    }>;
    assignKnowledgeSources(agentId: string, sourceIds: string[]): Promise<({
        knowledgeSources: ({
            knowledgeSource: {
                id: string;
                name: string;
                status: string;
                createdBy: string;
                updatedBy: string | null;
                deletedAt: Date | null;
                createdAt: Date;
                updatedAt: Date;
                metadata: Prisma.JsonValue;
                mimeType: string | null;
                checksum: string | null;
                sourceType: string;
                sourceUrl: string | null;
                s3Key: string | null;
                originalFileName: string | null;
                rawText: string | null;
                indexingError: string | null;
                lastIndexedAt: Date | null;
            };
        } & {
            createdAt: Date;
            priority: number;
            knowledgeSourceId: string;
            agentId: string;
        })[];
    } & {
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
        temperature: Prisma.Decimal;
        maxTokens: number;
        behaviorConfig: Prisma.JsonValue;
        guardrailConfig: Prisma.JsonValue;
        instructions: string | null;
        toolConfig: Prisma.JsonValue;
    }) | null>;
    findConversationById(id: string): Promise<({
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
            temperature: Prisma.Decimal;
            maxTokens: number;
            behaviorConfig: Prisma.JsonValue;
            guardrailConfig: Prisma.JsonValue;
            instructions: string | null;
            toolConfig: Prisma.JsonValue;
        };
        toolExecutions: {
            id: string;
            status: string;
            createdAt: Date;
            durationMs: number | null;
            messageId: string | null;
            conversationId: string;
            toolName: string;
            input: Prisma.JsonValue;
            output: Prisma.JsonValue | null;
            errorCode: string | null;
            errorMessage: string | null;
        }[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        metadata: Prisma.JsonValue;
        customerId: string | null;
        guestId: string | null;
        agentId: string;
        lastMessageAt: Date;
    }) | null>;
    findConversations(params: {
        customerId?: string;
        guestId?: string;
        agentId?: string;
        page: number;
        limit: number;
    }): Promise<{
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
                temperature: Prisma.Decimal;
                maxTokens: number;
                behaviorConfig: Prisma.JsonValue;
                guardrailConfig: Prisma.JsonValue;
                instructions: string | null;
                toolConfig: Prisma.JsonValue;
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            title: string | null;
            metadata: Prisma.JsonValue;
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
    }>;
    createConversation(data: Prisma.RagConversationCreateInput): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        metadata: Prisma.JsonValue;
        customerId: string | null;
        guestId: string | null;
        agentId: string;
        lastMessageAt: Date;
    }>;
    updateConversation(id: string, data: Prisma.RagConversationUpdateInput): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        metadata: Prisma.JsonValue;
        customerId: string | null;
        guestId: string | null;
        agentId: string;
        lastMessageAt: Date;
    }>;
    getConversationMessages(params: {
        conversationId: string;
        page: number;
        limit: number;
    }): Promise<{
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
                relevanceScore: Prisma.Decimal | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            role: string;
            content: string;
            metadata: Prisma.JsonValue;
            modelProvider: string | null;
            model: string | null;
            conversationId: string;
            intent: string | null;
            confidence: Prisma.Decimal | null;
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
    }>;
    createMessage(data: Prisma.RagMessageCreateInput): Promise<{
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
            relevanceScore: Prisma.Decimal | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        role: string;
        content: string;
        metadata: Prisma.JsonValue;
        modelProvider: string | null;
        model: string | null;
        conversationId: string;
        intent: string | null;
        confidence: Prisma.Decimal | null;
        promptTokens: number | null;
        completionTokens: number | null;
        totalTokens: number | null;
        responseTimeMs: number | null;
    }>;
    createMessageCitation(data: Prisma.RagMessageCitationCreateInput): Promise<{
        id: string;
        createdAt: Date;
        label: string | null;
        messageId: string;
        knowledgeSourceId: string;
        documentId: string | null;
        chunkId: string | null;
        citationIndex: number;
        excerpt: string | null;
        relevanceScore: Prisma.Decimal | null;
    }>;
    createToolExecution(data: Prisma.RagToolExecutionCreateInput): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        durationMs: number | null;
        messageId: string | null;
        conversationId: string;
        toolName: string;
        input: Prisma.JsonValue;
        output: Prisma.JsonValue | null;
        errorCode: string | null;
        errorMessage: string | null;
    }>;
    addFeedback(messageId: string, data: {
        rating?: number;
        isHelpful?: boolean;
        comment?: string;
        userId?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        messageId: string;
        rating: number | null;
        comment: string | null;
        isHelpful: boolean | null;
    }>;
    incrementMetrics(params: {
        agentId: string;
        isSuccessful: boolean;
        responseTimeMs: number;
        confidence: number;
        promptTokens: number;
        completionTokens: number;
    }): Promise<void>;
    getSummaryAnalytics(): Promise<{
        totalAgents: number;
        activeAgents: number;
        totalKnowledgeSources: number;
        indexedKnowledgeSources: number;
        totalConversations: number;
        conversationsThisMonth: number;
        averageResponseTimeMs: number;
        successRate: number;
        averageRating: number;
    }>;
    getAgentPerformanceSummary(agentId: string): Promise<{
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
    }>;
}
