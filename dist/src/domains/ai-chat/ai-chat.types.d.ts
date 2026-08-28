export declare class CreateConversationDto {
    title?: string;
    context?: string;
}
export declare class SendMessageDto {
    content: string;
}
export declare class ConversationQueryDto {
    status?: string;
    page?: number;
    limit?: number;
}
export declare class AiMessageResponse {
    id: string;
    role: string;
    content: string;
    tokenCount: number;
    createdAt: Date;
}
export declare class AiConversationResponse {
    id: string;
    userId: string;
    title?: string;
    status: string;
    tokenCount: number;
    messages?: AiMessageResponse[];
    createdAt: Date;
}
export declare class AddFeedbackDto {
    type: string;
    referenceId: string;
    rating: number;
    comment?: string;
}
