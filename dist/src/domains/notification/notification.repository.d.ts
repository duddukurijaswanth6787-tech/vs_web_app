import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class NotificationRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        userId: string;
        type?: string;
        isRead?: boolean;
        page: number;
        limit: number;
    }): Promise<{
        data: {
            id: string;
            createdAt: Date;
            type: string;
            data: Prisma.JsonValue | null;
            title: string;
            userId: string;
            message: string;
            isRead: boolean;
            isArchived: boolean;
            readAt: Date | null;
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
    findById(id: string): Promise<{
        id: string;
        createdAt: Date;
        type: string;
        data: Prisma.JsonValue | null;
        title: string;
        userId: string;
        message: string;
        isRead: boolean;
        isArchived: boolean;
        readAt: Date | null;
    } | null>;
    create(data: Prisma.NotificationCreateInput): Promise<{
        id: string;
        createdAt: Date;
        type: string;
        data: Prisma.JsonValue | null;
        title: string;
        userId: string;
        message: string;
        isRead: boolean;
        isArchived: boolean;
        readAt: Date | null;
    }>;
    update(id: string, data: Prisma.NotificationUpdateInput): Promise<{
        id: string;
        createdAt: Date;
        type: string;
        data: Prisma.JsonValue | null;
        title: string;
        userId: string;
        message: string;
        isRead: boolean;
        isArchived: boolean;
        readAt: Date | null;
    }>;
    markAsRead(id: string): Promise<{
        id: string;
        createdAt: Date;
        type: string;
        data: Prisma.JsonValue | null;
        title: string;
        userId: string;
        message: string;
        isRead: boolean;
        isArchived: boolean;
        readAt: Date | null;
    }>;
    markAllAsRead(userId: string): Promise<Prisma.BatchPayload>;
    getUnreadCount(userId: string): Promise<number>;
    deleteAllRead(userId: string): Promise<number>;
    getStats(userId: string): Promise<{
        total: number;
        unread: number;
        read: number;
        archived: number;
    }>;
}
