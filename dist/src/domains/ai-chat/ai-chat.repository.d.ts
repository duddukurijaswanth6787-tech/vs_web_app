import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class AiChatRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        userId: string;
        status?: string;
        page: number;
        limit: number;
    }): Promise<{
        data: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            title: string | null;
            userId: string;
            context: Prisma.JsonValue | null;
            tokenCount: number;
        }[];
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
        messages: {
            id: string;
            createdAt: Date;
            role: string;
            content: string;
            metadata: Prisma.JsonValue | null;
            conversationId: string;
            tokenCount: number;
        }[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        userId: string;
        context: Prisma.JsonValue | null;
        tokenCount: number;
    }) | null>;
    create(data: Prisma.AiConversationCreateInput): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        userId: string;
        context: Prisma.JsonValue | null;
        tokenCount: number;
    }>;
    update(id: string, data: Prisma.AiConversationUpdateInput): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string | null;
        userId: string;
        context: Prisma.JsonValue | null;
        tokenCount: number;
    }>;
    createMessage(data: Prisma.AiMessageCreateInput): Promise<{
        id: string;
        createdAt: Date;
        role: string;
        content: string;
        metadata: Prisma.JsonValue | null;
        conversationId: string;
        tokenCount: number;
    }>;
    getMessages(conversationId: string, page: number, limit: number): Promise<{
        data: {
            id: string;
            createdAt: Date;
            role: string;
            content: string;
            metadata: Prisma.JsonValue | null;
            conversationId: string;
            tokenCount: number;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
}
