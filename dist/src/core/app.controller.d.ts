import { AppService } from './app.service';
import { AwsBillingService } from '../domains/aws-billing/aws-billing.service';
import { AnalyticsService } from '../domains/analytics/analytics.service';
import { AnalyticsPeriod } from '../domains/analytics/analytics.types';
import { PrismaService } from "../database/prisma.service";
export declare class AppController {
    private readonly appService;
    private readonly awsBillingService;
    private readonly analyticsService;
    private readonly prisma;
    constructor(appService: AppService, awsBillingService: AwsBillingService, analyticsService: AnalyticsService, prisma: PrismaService);
    getHello(): {
        status: string;
        name: string;
        version: string;
        health: string;
        docs: string;
        apiVersion: string;
    };
    syncBarcodeDirect(): Promise<import("../common/responses/response.builder").ResponsePayload<import(".prisma/client").Prisma.BatchPayload>>;
    getOmnichannelDirect(period?: AnalyticsPeriod): Promise<import("../common/responses/response.builder").ResponsePayload<import("../domains/analytics/analytics.types").OmnichannelSummary>>;
    getOfflinePosDirect(period?: AnalyticsPeriod): Promise<import("../common/responses/response.builder").ResponsePayload<import("../domains/analytics/analytics.types").OfflinePosAnalytics>>;
    getOnlineSalesDirect(period?: AnalyticsPeriod): Promise<import("../common/responses/response.builder").ResponsePayload<import("../domains/analytics/analytics.types").OnlineSalesAnalytics>>;
    getInventoryVelocityDirect(): Promise<import("../common/responses/response.builder").ResponsePayload<import("../domains/analytics/analytics.types").InventoryVelocityAnalytics>>;
    syncAnalyticsDirect(): Promise<import("../common/responses/response.builder").ResponsePayload<import("../domains/analytics/analytics.types").OmnichannelSummary>>;
    getAwsBilling(): Promise<import("../common/responses/response.builder").ResponsePayload<import("../domains/aws-billing/aws-billing.service").AwsBillingSummaryResponse>>;
    syncAwsBilling(): Promise<import("../common/responses/response.builder").ResponsePayload<import("../domains/aws-billing/aws-billing.service").AwsBillingSummaryResponse>>;
    getAdminAwsBilling(): Promise<import("../common/responses/response.builder").ResponsePayload<import("../domains/aws-billing/aws-billing.service").AwsBillingSummaryResponse>>;
    syncAdminAwsBilling(): Promise<import("../common/responses/response.builder").ResponsePayload<import("../domains/aws-billing/aws-billing.service").AwsBillingSummaryResponse>>;
}
