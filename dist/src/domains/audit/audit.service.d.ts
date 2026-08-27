import { LoggerService } from "../../common/logger/logger.service";
import { AuditRepository } from './audit.repository';
import { CreateAuditLogDto, AuditLogQueryDto, AuditLogResponse } from './audit.types';
export declare class AuditService {
    private readonly auditRepository;
    private readonly loggerService;
    constructor(auditRepository: AuditRepository, loggerService: LoggerService);
    log(dto: CreateAuditLogDto): Promise<void>;
    logMany(entries: CreateAuditLogDto[]): Promise<void>;
    findAll(query: AuditLogQueryDto): Promise<{
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
    findById(id: string): Promise<AuditLogResponse>;
    getStats(): Promise<{
        total: number;
        today: number;
        uniqueUsers: number;
        modules: {
            module: string;
            count: number;
        }[];
    }>;
    getEntityHistory(resource: string, resourceId: string, limit?: number): Promise<{
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
    compareVersions(id: string): Promise<{
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
    }>;
}
