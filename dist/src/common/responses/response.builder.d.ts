export declare class ResponsePayload<T> {
    readonly statusCode: number;
    readonly message: string;
    readonly data: T | null;
    readonly customMeta?: Record<string, unknown> | undefined;
    constructor(statusCode: number, message: string, data: T | null, customMeta?: Record<string, unknown> | undefined);
}
export declare class ResponseBuilder {
    static success<T>(data: T, message?: string, metadata?: Record<string, unknown>): ResponsePayload<T>;
    static created<T>(data: T, message?: string, metadata?: Record<string, unknown>): ResponsePayload<T>;
    static updated<T>(data: T, message?: string, metadata?: Record<string, unknown>): ResponsePayload<T>;
    static deleted(message?: string, metadata?: Record<string, unknown>): ResponsePayload<null>;
}
