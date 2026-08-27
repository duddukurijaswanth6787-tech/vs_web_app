import { AwsBillingService } from './aws-billing.service';
export declare class AwsBillingController {
    private readonly awsBillingService;
    constructor(awsBillingService: AwsBillingService);
    getBillingSummary(): Promise<import("@common/responses/response.builder").ResponsePayload<import("./aws-billing.service").AwsBillingSummaryResponse>>;
    getBillingSummaryAlias(): Promise<import("@common/responses/response.builder").ResponsePayload<import("./aws-billing.service").AwsBillingSummaryResponse>>;
    syncBillingData(): Promise<import("@common/responses/response.builder").ResponsePayload<import("./aws-billing.service").AwsBillingSummaryResponse>>;
}
