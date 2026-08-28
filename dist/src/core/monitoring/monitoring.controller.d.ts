import { ConfigService } from '@nestjs/config';
import { MonitoringService } from './monitoring.service';
export declare class MonitoringController {
    private readonly monitoringService;
    private readonly configService;
    private readonly enabled;
    constructor(monitoringService: MonitoringService, configService: ConfigService);
    getMetrics(): Record<string, unknown>;
}
