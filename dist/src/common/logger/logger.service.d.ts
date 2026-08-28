import { LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpLoggingContext } from '../logging/http-log-context';
export declare class LoggerService implements NestLoggerService {
    private readonly configService;
    private pinoLogger;
    private isLoggerEnabled;
    constructor(configService: ConfigService);
    private init;
    private getContextData;
    private shouldSuppress;
    log(message: any, context?: string): void;
    error(message: any, trace?: string, context?: string): void;
    warn(message: any, context?: string): void;
    debug(message: any, context?: string): void;
    verbose(message: any, context?: string): void;
    fatal(message: any, trace?: string, context?: string): void;
    logHttpRequest(ctx: HttpLoggingContext, req: any): void;
    logHttpResponse(ctx: HttpLoggingContext, req: any, statusCode: number, statusText: string, body: any, durationMs: number): void;
    logHttpError(ctx: HttpLoggingContext, req: any, statusCode: number, statusText: string, errorName: string, errorMessage: string, errorResponse: any, durationMs: number, stack?: string): void;
}
