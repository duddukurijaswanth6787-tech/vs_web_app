"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AwsBillingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsBillingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
let AwsBillingService = AwsBillingService_1 = class AwsBillingService {
    configService;
    logger = new common_1.Logger(AwsBillingService_1.name);
    s3Client;
    region;
    bucket;
    accessKeyId;
    secretAccessKey;
    constructor(configService) {
        this.configService = configService;
        this.region = this.configService.get('app.storage.s3.region', 'ap-south-2');
        this.bucket = this.configService.get('app.storage.s3.bucket', 'vasanthi-signature-images');
        this.accessKeyId = this.configService.get('app.storage.s3.accessKeyId', '');
        this.secretAccessKey = this.configService.get('app.storage.s3.secretAccessKey', '');
        this.s3Client = new client_s3_1.S3Client({
            region: this.region,
            ...(this.accessKeyId &&
                this.secretAccessKey && {
                credentials: {
                    accessKeyId: this.accessKeyId,
                    secretAccessKey: this.secretAccessKey,
                },
            }),
        });
    }
    async getBillingSummary() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .split('T')[0];
        const tomorrow = new Date(now.getTime() + 86400000);
        const endDate = tomorrow.toISOString().split('T')[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            .toISOString()
            .split('T')[0];
        try {
            const { CostExplorerClient, GetCostAndUsageCommand, GetCostForecastCommand, Granularity, } = require('@aws-sdk/client-cost-explorer');
            const costExplorerClient = new CostExplorerClient({
                region: 'us-east-1',
                ...(this.accessKeyId &&
                    this.secretAccessKey && {
                    credentials: {
                        accessKeyId: this.accessKeyId,
                        secretAccessKey: this.secretAccessKey,
                    },
                }),
            });
            const command = new GetCostAndUsageCommand({
                TimePeriod: { Start: startOfMonth, End: endDate },
                Granularity: Granularity.MONTHLY,
                Metrics: ['UnblendedCost'],
                GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
            });
            const response = await costExplorerClient.send(command);
            let totalSpend = 0;
            let currency = 'USD';
            const serviceBreakdown = [];
            if (response.ResultsByTime && response.ResultsByTime.length > 0) {
                const result = response.ResultsByTime[0];
                if (result.Groups) {
                    for (const group of result.Groups) {
                        const serviceName = group.Keys?.[0] ?? 'Other Services';
                        const amount = parseFloat(group.Metrics?.UnblendedCost?.Amount ?? '0');
                        currency = group.Metrics?.UnblendedCost?.Unit ?? 'USD';
                        if (amount > 0 || serviceBreakdown.length < 5) {
                            serviceBreakdown.push({
                                serviceName,
                                amount: Math.round(amount * 100) / 100,
                                currency,
                            });
                        }
                        totalSpend += amount;
                    }
                }
            }
            serviceBreakdown.sort((a, b) => b.amount - a.amount);
            let forecastedSpend = totalSpend;
            try {
                if (endDate < endOfMonth) {
                    const forecastCmd = new GetCostForecastCommand({
                        TimePeriod: { Start: endDate, End: endOfMonth },
                        Granularity: Granularity.MONTHLY,
                        Metric: 'UNBLENDED_COST',
                    });
                    const forecastRes = await costExplorerClient.send(forecastCmd);
                    const fAmount = parseFloat(forecastRes.Total?.Amount ?? '0');
                    forecastedSpend = Math.round((totalSpend + fAmount) * 100) / 100;
                }
            }
            catch {
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const currentDay = Math.max(1, now.getDate());
                forecastedSpend =
                    Math.round((totalSpend / currentDay) * daysInMonth * 100) / 100;
            }
            return {
                status: 'active',
                period: { start: startOfMonth, end: endDate },
                currency,
                totalSpend: Math.round(totalSpend * 100) / 100,
                forecastedSpend,
                serviceBreakdown,
                accountInfo: {
                    region: this.region,
                    bucket: this.bucket,
                    storageProvider: 's3',
                },
                lastSyncedAt: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.warn(`AWS Cost Explorer SDK notice: ${error?.message || String(error)}`);
            let s3ObjectCount = 0;
            let s3TotalSize = 0;
            try {
                const s3Res = await this.s3Client.send(new client_s3_1.ListObjectsV2Command({ Bucket: this.bucket, MaxKeys: 100 }));
                s3ObjectCount = s3Res.KeyCount ?? 0;
                s3TotalSize = (s3Res.Contents || []).reduce((acc, item) => acc + (item.Size || 0), 0);
            }
            catch {
            }
            return {
                status: 'activation_required',
                period: { start: startOfMonth, end: endDate },
                currency: 'USD',
                totalSpend: 0.0,
                forecastedSpend: 0.0,
                serviceBreakdown: [
                    {
                        serviceName: 'Amazon Elastic Compute Cloud (EC2)',
                        amount: 0.0,
                        currency: 'USD',
                    },
                    {
                        serviceName: `Amazon Simple Storage Service (S3) - ${this.bucket} (${s3ObjectCount} objects, ${(s3TotalSize / 1024 / 1024).toFixed(2)} MB)`,
                        amount: 0.0,
                        currency: 'USD',
                    },
                    {
                        serviceName: 'AWS Data Transfer Out',
                        amount: 0.0,
                        currency: 'USD',
                    },
                ],
                accountInfo: {
                    region: this.region,
                    bucket: this.bucket,
                    storageProvider: 's3',
                },
                message: 'AWS Cost Explorer API requires 1-click activation in AWS Console.',
                activationInstructions: [
                    '1. Log into AWS Console (https://console.aws.amazon.com/billing).',
                    '2. Click "Cost Explorer" on the left sidebar menu.',
                    '3. Click "Launch Cost Explorer" / "Enable Cost Explorer".',
                    '4. Attach "AWSBillingReadOnlyAccess" policy to user "railway-iam-user" in IAM Console.',
                ],
                lastSyncedAt: new Date().toISOString(),
            };
        }
    }
};
exports.AwsBillingService = AwsBillingService;
exports.AwsBillingService = AwsBillingService = AwsBillingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AwsBillingService);
//# sourceMappingURL=aws-billing.service.js.map