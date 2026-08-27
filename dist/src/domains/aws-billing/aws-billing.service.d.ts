import { ConfigService } from '@nestjs/config';
export interface AwsBillingServiceBreakdown {
    serviceName: string;
    amount: number;
    currency: string;
}
export interface AwsBillingSummaryResponse {
    status: 'active' | 'activation_required';
    period: {
        start: string;
        end: string;
    };
    currency: string;
    totalSpend: number;
    forecastedSpend: number;
    serviceBreakdown: AwsBillingServiceBreakdown[];
    accountInfo: {
        region: string;
        bucket: string;
        storageProvider: string;
    };
    message?: string;
    activationInstructions?: string[];
    lastSyncedAt: string;
}
export declare class AwsBillingService {
    private readonly configService;
    private readonly logger;
    private readonly s3Client;
    private readonly region;
    private readonly bucket;
    private readonly accessKeyId;
    private readonly secretAccessKey;
    constructor(configService: ConfigService);
    getBillingSummary(): Promise<AwsBillingSummaryResponse>;
}
