import { EnvironmentType } from '../enums';
export type UUID = string;
export interface PaginationQuery {
    page?: number;
    limit?: number;
    search?: string;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
}
export interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T | null;
    meta: {
        timestamp: string;
        pagination?: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
        [key: string]: unknown;
    };
}
export interface RequestContext {
    requestId: string;
    ip: string;
    userAgent: string;
    userId?: UUID;
    role?: string;
}
export type Environment = EnvironmentType;
