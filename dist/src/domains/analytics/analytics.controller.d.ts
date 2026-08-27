import { AnalyticsService } from './analytics.service';
import { AnalyticsPeriod } from './analytics.types';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getOmnichannel(period?: AnalyticsPeriod): Promise<import("@common/responses/response.builder").ResponsePayload<import("./analytics.types").OmnichannelSummary>>;
    getOfflinePos(period?: AnalyticsPeriod): Promise<import("@common/responses/response.builder").ResponsePayload<import("./analytics.types").OfflinePosAnalytics>>;
    getOnlineSales(period?: AnalyticsPeriod): Promise<import("@common/responses/response.builder").ResponsePayload<import("./analytics.types").OnlineSalesAnalytics>>;
    getInventoryVelocity(): Promise<import("@common/responses/response.builder").ResponsePayload<import("./analytics.types").InventoryVelocityAnalytics>>;
}
