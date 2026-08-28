import { JwtService } from "../auth/services/jwt.service";
import type { JwtPayload } from "../auth/services/jwt.service";
import { RagOrchestratorService } from './rag-orchestrator.service';
import { RagAgentRepository } from './rag-agent.repository';
import { ChatRequestDto, SubmitFeedbackDto } from './rag-agent.types';
import type { Request } from 'express';
export declare class RagAgentController {
    private readonly orchestrator;
    private readonly repository;
    private readonly jwtService;
    constructor(orchestrator: RagOrchestratorService, repository: RagAgentRepository, jwtService: JwtService);
    chat(dto: ChatRequestDto, req: Request): Promise<import("../../common/responses/response.builder").ResponsePayload<{
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
    }>>;
    getConversations(user: JwtPayload, page?: number, limit?: number): Promise<import("../../common/responses/response.builder").ResponsePayload<{
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
    getConversationDetails(id: string, user: JwtPayload, page?: number, limit?: number): Promise<import("../../common/responses/response.builder").ResponsePayload<{
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
    }>>;
    deleteConversation(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
    submitFeedback(messageId: string, dto: SubmitFeedbackDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string | null;
        messageId: string;
        rating: number | null;
        comment: string | null;
        isHelpful: boolean | null;
    }>>;
}
