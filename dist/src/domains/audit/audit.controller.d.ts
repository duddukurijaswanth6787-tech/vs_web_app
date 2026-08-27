import { AuditService } from './audit.service';
import { AuditLogQueryDto } from './audit.types';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    findAll(query: AuditLogQueryDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }>>;
    getStats(): Promise<import("@common/responses/response.builder").ResponsePayload<{
        total: number;
        today: number;
        uniqueUsers: number;
        modules: {
            module: string;
            count: number;
        }[];
    }>>;
    getEntityHistory(resource: string, resourceId: string): Promise<import("@common/responses/response.builder").ResponsePayload<{
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
    }[]>>;
    compareVersions(id: string): Promise<import("@common/responses/response.builder").ResponsePayload<{
        id: string;
        action: string;
        module: string;
        resource: string;
        resourceId: string | null;
        timestamp: Date;
        changes: {
            field: string;
            oldValue: unknown;
            newValue: unknown;
            changed: boolean;
        }[];
        oldValue: Record<string, unknown>;
        newValue: Record<string, unknown>;
    }>>;
    findById(id: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./audit.types").AuditLogResponse>>;
}
