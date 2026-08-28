import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { LoggerService } from '../logger/logger.service';
export declare function isResponseWorthLogging({ logSuccess, statusCode, durationMs, slowMs, }: {
    logSuccess: boolean;
    statusCode: number;
    durationMs: number;
    slowMs: number;
}): boolean;
export declare class HttpLoggingInterceptor implements NestInterceptor {
    private readonly configService;
    private readonly loggerService;
    constructor(configService: ConfigService, loggerService: LoggerService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
