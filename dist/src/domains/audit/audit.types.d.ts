export declare class CreateAuditLogDto {
    userId?: string;
    staffId?: string;
    action: string;
    module: string;
    resource: string;
    resourceId?: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    correlationId?: string;
    status?: string;
    message?: string;
    metadata?: Record<string, unknown>;
}
export declare class AuditLogQueryDto {
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
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class AuditLogResponse {
    id: string;
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
    status: string;
    message?: string;
    metadata?: any;
    createdAt: Date;
}
export declare class AuditStatsResponse {
    total: number;
    today: number;
    uniqueUsers: number;
    modules: Array<{
        module: string;
        count: number;
    }>;
}
export declare class CompareChange {
    field: string;
    oldValue?: unknown;
    newValue?: unknown;
    changed: boolean;
}
export declare class CompareVersionResponse {
    id: string;
    action: string;
    module: string;
    resource: string;
    resourceId?: string;
    timestamp: Date;
    changes: CompareChange[];
    oldValue: Record<string, unknown>;
    newValue: Record<string, unknown>;
}
