import { ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { ThrottlerModuleOptions, ThrottlerStorage, ThrottlerLimitDetail } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { SecurityEventService } from './security-event.service';
export declare class ThrottlerBehindProxyGuard extends ThrottlerGuard {
    private readonly securityEventService;
    protected readonly options: ThrottlerModuleOptions;
    protected readonly storageService: ThrottlerStorage;
    protected readonly reflector: Reflector;
    constructor(securityEventService: SecurityEventService, options: ThrottlerModuleOptions, storageService: ThrottlerStorage, reflector: Reflector);
    protected getTracker(req: Record<string, any>): Promise<string>;
    protected throwThrottlingException(context: ExecutionContext, throttlerLimitDetail: ThrottlerLimitDetail): Promise<void>;
}
