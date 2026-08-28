import { ConfigService } from '@nestjs/config';
export declare class MonitoringService {
    private readonly configService;
    readonly startTime: number;
    readonly slowRequestThreshold: number;
    requestCount: number;
    successCount: number;
    errorCount: number;
    totalResponseTime: number;
    slowRequestCount: number;
    constructor(configService: ConfigService);
    getSnapshot(): Record<string, unknown>;
}
