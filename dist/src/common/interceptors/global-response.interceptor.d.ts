import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface StandardResponse<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T | null;
    meta: {
        timestamp: string;
        correlationId: string;
        path: string;
        apiVersion: string;
        pagination?: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
        [key: string]: unknown;
    };
}
export declare class GlobalResponseInterceptor<T> implements NestInterceptor<T, StandardResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T>>;
}
