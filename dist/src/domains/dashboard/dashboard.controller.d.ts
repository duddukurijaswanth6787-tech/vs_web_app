import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getSummary(): Promise<import("@common/responses/response.builder").ResponsePayload<import("./dashboard.types").DashboardSummaryResponse>>;
    getSalesChart(period?: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./dashboard.types").SalesChartResponse>>;
    getOrderAnalytics(dateFrom?: string, dateTo?: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./dashboard.types").OrderAnalyticsResponse>>;
    getPaymentAnalytics(dateFrom?: string, dateTo?: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./dashboard.types").PaymentAnalyticsResponse>>;
    getRecentActivity(): Promise<import("@common/responses/response.builder").ResponsePayload<import("./dashboard.types").RecentActivityResponse>>;
}
