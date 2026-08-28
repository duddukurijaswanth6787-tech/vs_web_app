import { PrismaService } from "../../database/prisma.service";
import { AnalyticsPeriod, OmnichannelSummary, OfflinePosAnalytics, OnlineSalesAnalytics, InventoryVelocityAnalytics } from './analytics.types';
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getStartDate;
    getOmnichannelOverview(period?: AnalyticsPeriod): Promise<OmnichannelSummary>;
    getOfflinePosAnalytics(period?: AnalyticsPeriod): Promise<OfflinePosAnalytics>;
    getOnlineSalesAnalytics(period?: AnalyticsPeriod): Promise<OnlineSalesAnalytics>;
    getInventoryVelocityAnalytics(): Promise<InventoryVelocityAnalytics>;
}
