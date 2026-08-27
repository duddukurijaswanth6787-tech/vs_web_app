import { PrismaService } from "../../database/prisma.service";
export declare class AuditRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: {
        userId?: string;
        staffId?: string;
        action: string;
        module: string;
        resource: string;
        resourceId?: string;
        oldValue?: any;
        newValue?: any;
        ipAddress?: string;
        userAgent?: string;
        requestId?: string;
        correlationId?: string;
        status?: string;
        message?: string;
        metadata?: any;
    }): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        requestId: string | null;
        userId: string | null;
        message: string | null;
        module: string;
        staffId: string | null;
        action: string;
        resource: string;
        resourceId: string | null;
        oldValue: import("@prisma/client/runtime/client").JsonValue | null;
        newValue: import("@prisma/client/runtime/client").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        correlationId: string | null;
    }>;
    createMany(data: any[]): Promise<import(".prisma/client").Prisma.BatchPayload>;
    findAll(params: {
        module?: string;
        action?: string;
        userId?: string;
        staffId?: string;
        resource?: string;
        resourceId?: string;
        status?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
        page: number;
        limit: number;
        sortBy: string;
        sortOrder: 'asc' | 'desc';
    }): Promise<{
        data: {
            id: string;
            status: string;
            createdAt: Date;
            userId: string | null;
            message: string | null;
            module: string;
            staffId: string | null;
            action: string;
            resource: string;
            resourceId: string | null;
            ipAddress: string | null;
            userAgent: string | null;
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
        status: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        requestId: string | null;
        userId: string | null;
        message: string | null;
        module: string;
        staffId: string | null;
        action: string;
        resource: string;
        resourceId: string | null;
        oldValue: import("@prisma/client/runtime/client").JsonValue | null;
        newValue: import("@prisma/client/runtime/client").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        correlationId: string | null;
    } | null>;
    getStats(): Promise<{
        total: number;
        today: number;
        uniqueUsers: number;
        modules: {
            module: string;
            count: number;
        }[];
    }>;
    findByResource(resource: string, resourceId: string, limit?: number): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        requestId: string | null;
        userId: string | null;
        message: string | null;
        module: string;
        staffId: string | null;
        action: string;
        resource: string;
        resourceId: string | null;
        oldValue: import("@prisma/client/runtime/client").JsonValue | null;
        newValue: import("@prisma/client/runtime/client").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        correlationId: string | null;
    }[]>;
}
