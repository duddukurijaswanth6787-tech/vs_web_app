import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { MonitoringService } from './monitoring.service';
export declare class MetricsInterceptor implements NestInterceptor {
    private readonly monitoringService;
    constructor(monitoringService: MonitoringService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
