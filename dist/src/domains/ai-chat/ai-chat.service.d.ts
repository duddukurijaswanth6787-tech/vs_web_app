import { ConfigService } from '@nestjs/config';
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../../database/prisma.service";
import { LlmProviderRegistry } from "../rag-agent/rag-providers.service";
import { AiChatRepository } from './ai-chat.repository';
import { CreateConversationDto, SendMessageDto, ConversationQueryDto, AiConversationResponse, AiMessageResponse, AddFeedbackDto } from './ai-chat.types';
export declare class AiChatService {
    private readonly aiChatRepository;
    private readonly auditService;
    private readonly prisma;
    private readonly configService;
    private readonly llmRegistry;
    private readonly logger;
    constructor(aiChatRepository: AiChatRepository, auditService: AuditService, prisma: PrismaService, configService: ConfigService, llmRegistry: LlmProviderRegistry);
    private toConversationResponse;
    private toMessageResponse;
    findAll(userId: string, query: ConversationQueryDto): Promise<{
        data: AiConversationResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string, userId: string): Promise<AiConversationResponse>;
    create(userId: string, dto: CreateConversationDto): Promise<AiConversationResponse>;
    private buildCatalogContext;
    private generateAssistantReply;
    private fallbackReply;
    sendMessage(conversationId: string, userId: string, dto: SendMessageDto): Promise<AiMessageResponse>;
    getMessages(conversationId: string, userId: string, page?: number, limit?: number): Promise<{
        data: AiMessageResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    addFeedback(userId: string, dto: AddFeedbackDto): Promise<void>;
}
