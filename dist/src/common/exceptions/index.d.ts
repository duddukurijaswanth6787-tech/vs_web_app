import { HttpException, HttpStatus } from '@nestjs/common';
export declare abstract class BaseException extends HttpException {
    readonly errorCode: string;
    readonly timestamp: string;
    readonly metadata: Record<string, unknown>;
    constructor(message: string, errorCode: string, status: HttpStatus, metadata?: Record<string, unknown>);
}
export declare class BusinessException extends BaseException {
    constructor(message: string, errorCode: string, metadata?: Record<string, unknown>);
}
export declare class ValidationException extends BaseException {
    constructor(message: string, errorCode: string, metadata?: Record<string, unknown>);
}
export declare class ResourceNotFoundException extends BaseException {
    constructor(message: string, errorCode: string, metadata?: Record<string, unknown>);
}
export declare class InternalServerException extends BaseException {
    constructor(message: string, errorCode: string, metadata?: Record<string, unknown>);
}
export declare class PassthroughHttpException extends BaseException {
    constructor(message: string, errorCode: string, status: HttpStatus, metadata?: Record<string, unknown>);
}
export declare class DatabaseException extends BaseException {
    constructor(message: string, errorCode: string, status?: HttpStatus, metadata?: Record<string, unknown>);
}
export declare class InfrastructureException extends BaseException {
    constructor(message: string, errorCode: string, metadata?: Record<string, unknown>);
}
export declare class ExternalApiException extends BaseException {
    constructor(message: string, errorCode: string, status?: HttpStatus, metadata?: Record<string, unknown>);
}
export declare class AuthenticationException extends BaseException {
    constructor(message: string, errorCode: string, metadata?: Record<string, unknown>);
}
export declare class AuthorizationException extends BaseException {
    constructor(message: string, errorCode: string, metadata?: Record<string, unknown>);
}
export declare class FileUploadException extends BaseException {
    constructor(message: string, errorCode: string, metadata?: Record<string, unknown>);
}
export declare class PaymentException extends BaseException {
    constructor(message: string, errorCode: string, metadata?: Record<string, unknown>);
}
export declare class ShippingException extends BaseException {
    constructor(message: string, errorCode: string, metadata?: Record<string, unknown>);
}
export declare class GlobalExceptionMapper {
    static map(exception: unknown): BaseException;
}
