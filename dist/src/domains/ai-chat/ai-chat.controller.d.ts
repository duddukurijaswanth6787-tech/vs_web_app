import { AiChatService } from './ai-chat.service';
import { CreateConversationDto, SendMessageDto, ConversationQueryDto, AddFeedbackDto } from './ai-chat.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class AiChatController {
    private readonly aiChatService;
    constructor(aiChatService: AiChatService);
    findAll(query: ConversationQueryDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./ai-chat.types").AiConversationResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findById(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./ai-chat.types").AiConversationResponse>>;
    create(dto: CreateConversationDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./ai-chat.types").AiConversationResponse>>;
    sendMessage(id: string, dto: SendMessageDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./ai-chat.types").AiMessageResponse>>;
    getMessages(id: string, page: number, limit: number, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./ai-chat.types").AiMessageResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    addFeedback(id: string, dto: AddFeedbackDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
}
