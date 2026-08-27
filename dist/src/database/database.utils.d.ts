import { PaginationMeta } from './database.types';
export declare class DatabaseUtils {
    static buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta;
    static normalizePagination(page?: number, limit?: number): {
        page: number;
        limit: number;
        skip: number;
    };
}
