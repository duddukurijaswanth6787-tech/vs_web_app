import { PrismaService } from "../../database/prisma.service";
import { DashboardSummaryResponse, SalesChartResponse, OrderAnalyticsResponse, PaymentAnalyticsResponse, RecentActivityResponse } from './dashboard.types';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getSummary(): Promise<DashboardSummaryResponse>;
    getOrderAnalytics(dateFrom?: string, dateTo?: string): Promise<OrderAnalyticsResponse>;
    getPaymentAnalytics(dateFrom?: string, dateTo?: string): Promise<PaymentAnalyticsResponse>;
    getRecentActivity(): Promise<RecentActivityResponse>;
    getSalesChart(period?: string): Promise<SalesChartResponse>;
}
