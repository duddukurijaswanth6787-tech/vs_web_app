import { ConfigService } from '@nestjs/config';
import { LoggerService } from "../logger/logger.service";
export declare enum SecurityEventType {
    RATE_LIMIT_VIOLATION = "RATE_LIMIT_VIOLATION",
    INVALID_CORRELATION_ID = "INVALID_CORRELATION_ID",
    CORS_VIOLATION = "CORS_VIOLATION",
    SUSPICIOUS_REQUEST = "SUSPICIOUS_REQUEST"
}
export interface SecurityEvent {
    type: SecurityEventType;
    ip: string;
    path: string;
    method: string;
    correlationId: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
}
export declare class SecurityEventService {
    private readonly configService;
    private readonly loggerService;
    private enabled;
    constructor(configService: ConfigService, loggerService: LoggerService);
    log(event: SecurityEvent): void;
}
