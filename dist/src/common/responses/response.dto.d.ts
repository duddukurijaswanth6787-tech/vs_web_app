export declare class StandardApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    timestamp: string;
    correlationId: string;
    path: string;
    metadata: Record<string, unknown>;
    constructor(partial: Partial<StandardApiResponse<T>>);
}
export declare class PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}
export declare class PaginatedApiResponse<T> extends StandardApiResponse<T[]> {
    metadata: Record<string, unknown> & {
        pagination: PaginationMeta;
    };
}
