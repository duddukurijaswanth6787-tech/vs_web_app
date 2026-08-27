import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
export declare class UUIDPipe implements PipeTransform {
    transform(value: unknown): string;
}
export declare class PaginationPipe implements PipeTransform {
    transform(value: any): {
        page: number;
        limit: number;
        direction: string;
        search?: undefined;
        sort?: undefined;
    } | {
        page: number;
        limit: number;
        search: any;
        sort: any;
        direction: string;
    };
}
export declare class SortingPipe implements PipeTransform {
    private readonly allowedFields?;
    constructor(allowedFields?: string[] | undefined);
    transform(value: any): any;
}
export declare class FilterPipe implements PipeTransform {
    private readonly allowedFilters;
    constructor(allowedFilters: string[]);
    transform(value: any): any;
}
export declare class TrimPipe implements PipeTransform {
    transform(value: unknown, metadata: ArgumentMetadata): any;
    private trimObject;
}
export declare class SanitizePipe implements PipeTransform {
    transform(value: unknown, metadata: ArgumentMetadata): any;
    private sanitizeObject;
}
