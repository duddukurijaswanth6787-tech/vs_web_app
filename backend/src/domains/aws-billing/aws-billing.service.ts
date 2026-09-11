import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { PrismaService } from '@database/prisma.service';

export interface AwsBillingServiceBreakdown {
  serviceName: string;
  amount: number;
  currency: string;
}

export interface AwsCreditsInfo {
  totalGrantUSD: number;
  usedCreditsUSD: number;
  remainingCreditsUSD: number;
  percentageUsed: number;
  expiryDate: string;
  daysRemaining: number;
  grantName: string;
  notes?: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';
}

export interface S3StorageInfo {
  bucket: string;
  region: string;
  objectCount: number;
  totalSizeBytes: number;
  totalSizeMB: number;
  totalSizeGB: number;
  storageClass: string;
  // Estimated monthly costs
  monthlyStorageCostUSD: number;
  monthlyRequestsCostUSD: number;
  monthlyTotalCostUSD: number;
  // Free Tier Status
  freeTierLimitGB: number;
  freeTierUsedGB: number;
  freeTierRemainingGB: number;
  isUnderFreeTier: boolean;
  ratePerGB: number;
}

export interface ProjectSpendAttribution {
  projectName: string;
  s3MediaCostUSD: number;
  dataTransferCostUSD: number;
  estimatedMonthlyCostUSD: number;
  coveredByCreditsOrFreeTier: boolean;
  activeMediaBucket: string;
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
  projectSpend: ProjectSpendAttribution;
  credits: AwsCreditsInfo;
  s3Storage: S3StorageInfo;
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

export interface UpdateAwsCreditsDto {
  totalGrantUSD?: number;
  expiryDate?: string;
  grantName?: string;
  notes?: string;
}

@Injectable()
export class AwsBillingService {
  private readonly logger = new Logger(AwsBillingService.name);
  private readonly s3Client: S3Client;
  private readonly region: string;
  private readonly bucket: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.region = this.configService.get<string>(
      'app.storage.s3.region',
      'ap-south-2',
    );
    this.bucket = this.configService.get<string>(
      'app.storage.s3.bucket',
      'vasanthi-signature-images',
    );

    this.accessKeyId = this.configService.get<string>(
      'app.storage.s3.accessKeyId',
      '',
    );
    this.secretAccessKey = this.configService.get<string>(
      'app.storage.s3.secretAccessKey',
      '',
    );

    this.s3Client = new S3Client({
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

  async getCreditsSettings(): Promise<{
    totalGrantUSD: number;
    expiryDate: string;
    grantName: string;
    notes: string;
  }> {
    try {
      const settings = await this.prisma.systemSetting.findMany({
        where: {
          key: {
            in: [
              'AWS_CREDIT_GRANT_AMOUNT',
              'AWS_CREDIT_EXPIRY_DATE',
              'AWS_CREDIT_GRANT_NAME',
              'AWS_CREDIT_NOTES',
            ],
          },
        },
      });

      const map = new Map(settings.map((s) => [s.key, s.value]));

      return {
        totalGrantUSD: parseFloat(map.get('AWS_CREDIT_GRANT_AMOUNT') || '1000.00'),
        expiryDate: map.get('AWS_CREDIT_EXPIRY_DATE') || '2026-12-31',
        grantName: map.get('AWS_CREDIT_GRANT_NAME') || 'AWS Promotional Credit / Free Tier',
        notes: map.get('AWS_CREDIT_NOTES') || 'Active AWS Promotional Credits applied on AWS Account',
      };
    } catch {
      return {
        totalGrantUSD: 1000.0,
        expiryDate: '2026-12-31',
        grantName: 'AWS Promotional Credit / Free Tier',
        notes: 'Active AWS Promotional Credits applied on AWS Account',
      };
    }
  }

  async updateCreditsSettings(dto: UpdateAwsCreditsDto) {
    const updates: Array<{ key: string; value: string }> = [];

    if (dto.totalGrantUSD !== undefined && !isNaN(Number(dto.totalGrantUSD))) {
      updates.push({
        key: 'AWS_CREDIT_GRANT_AMOUNT',
        value: String(Number(dto.totalGrantUSD)),
      });
    }
    if (dto.expiryDate && dto.expiryDate.trim()) {
      updates.push({
        key: 'AWS_CREDIT_EXPIRY_DATE',
        value: dto.expiryDate.trim(),
      });
    }
    if (dto.grantName && dto.grantName.trim()) {
      updates.push({
        key: 'AWS_CREDIT_GRANT_NAME',
        value: dto.grantName.trim(),
      });
    }
    if (dto.notes !== undefined) {
      updates.push({
        key: 'AWS_CREDIT_NOTES',
        value: dto.notes.trim(),
      });
    }

    for (const item of updates) {
      await this.prisma.systemSetting.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: { key: item.key, value: item.value },
      });
    }

    return this.getBillingSummary();
  }

  async getBillingSummary(): Promise<AwsBillingSummaryResponse> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];

    const tomorrow = new Date(now.getTime() + 86400000);
    const endDate = tomorrow.toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    // Load Credit configurations from DB
    const creditConfig = await this.getCreditsSettings();

    // Query S3 Live Metrics
    let s3ObjectCount = 0;
    let s3TotalSizeBytes = 0;
    try {
      const s3Res = await this.s3Client.send(
        new ListObjectsV2Command({ Bucket: this.bucket, MaxKeys: 1000 }),
      );
      s3ObjectCount = s3Res.KeyCount ?? 0;
      s3TotalSizeBytes = (s3Res.Contents || []).reduce(
        (acc, item) => acc + (item.Size || 0),
        0,
      );
    } catch (e: any) {
      this.logger.debug(`S3 stats fetch notice: ${e?.message}`);
    }

    const s3TotalSizeMB = Math.round((s3TotalSizeBytes / (1024 * 1024)) * 100) / 100;
    const s3TotalSizeGB = Math.round((s3TotalSizeBytes / (1024 * 1024 * 1024)) * 1000) / 1000;

    // AWS ap-south-2 S3 pricing: $0.023 / GB/month
    const ratePerGB = 0.023;
    const freeTierLimitGB = 5.0;
    const freeTierUsedGB = Math.min(freeTierLimitGB, s3TotalSizeGB);
    const freeTierRemainingGB = Math.max(0, Math.round((freeTierLimitGB - s3TotalSizeGB) * 100) / 100);
    const isUnderFreeTier = s3TotalSizeGB <= freeTierLimitGB;

    const billableGB = Math.max(0, s3TotalSizeGB - freeTierLimitGB);
    const monthlyStorageCostUSD = Math.round(billableGB * ratePerGB * 100) / 100;
    // Estimated API operations cost ($0.005 / 1000 PUT/POST, $0.0004 / 1000 GET)
    const monthlyRequestsCostUSD = Math.round((s3ObjectCount * 0.000005) * 100) / 100;
    const monthlyTotalCostUSD = Math.round((monthlyStorageCostUSD + monthlyRequestsCostUSD) * 100) / 100;

    const s3StorageInfo: S3StorageInfo = {
      bucket: this.bucket,
      region: this.region,
      objectCount: s3ObjectCount,
      totalSizeBytes: s3TotalSizeBytes,
      totalSizeMB: s3TotalSizeMB,
      totalSizeGB: s3TotalSizeGB,
      storageClass: 'Standard S3 (SSE-S3 AES-256)',
      monthlyStorageCostUSD,
      monthlyRequestsCostUSD,
      monthlyTotalCostUSD,
      freeTierLimitGB,
      freeTierUsedGB,
      freeTierRemainingGB,
      isUnderFreeTier,
      ratePerGB,
    };

    const projectSpend: ProjectSpendAttribution = {
      projectName: "Vasanthi's Signature Web Platform & POS",
      s3MediaCostUSD: monthlyTotalCostUSD,
      dataTransferCostUSD: 0.0, // First 100GB/mo is free on AWS
      estimatedMonthlyCostUSD: monthlyTotalCostUSD,
      coveredByCreditsOrFreeTier: true,
      activeMediaBucket: this.bucket,
    };

    // Calculate Credit remaining and expiry status
    const calculateCredits = (spend: number): AwsCreditsInfo => {
      const totalGrant = creditConfig.totalGrantUSD || 1000;
      const used = Math.round(spend * 100) / 100;
      const remaining = Math.max(0, Math.round((totalGrant - used) * 100) / 100);
      const percentageUsed = Math.min(100, Math.round((used / totalGrant) * 1000) / 10);

      const expiry = new Date(creditConfig.expiryDate);
      const diffTime = expiry.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      let status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' = 'ACTIVE';
      if (daysRemaining <= 0) {
        status = 'EXPIRED';
      } else if (daysRemaining <= 30) {
        status = 'EXPIRING_SOON';
      }

      return {
        totalGrantUSD: totalGrant,
        usedCreditsUSD: used,
        remainingCreditsUSD: remaining,
        percentageUsed,
        expiryDate: creditConfig.expiryDate,
        daysRemaining,
        grantName: creditConfig.grantName,
        notes: creditConfig.notes,
        status,
      };
    };

    // Try live AWS Cost Explorer SDK via dynamic import
    try {
      const {
        CostExplorerClient,
        GetCostAndUsageCommand,
        GetCostForecastCommand,
        Granularity,
      } = require('@aws-sdk/client-cost-explorer');

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
      const serviceBreakdown: AwsBillingServiceBreakdown[] = [];

      if (response.ResultsByTime && response.ResultsByTime.length > 0) {
        const result = response.ResultsByTime[0];
        if (result.Groups) {
          for (const group of result.Groups) {
            const serviceName = group.Keys?.[0] ?? 'Other Services';
            const amount = parseFloat(
              group.Metrics?.UnblendedCost?.Amount ?? '0',
            );
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
      } catch {
        const daysInMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
        ).getDate();
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
        projectSpend,
        credits: calculateCredits(totalSpend),
        s3Storage: s3StorageInfo,
        serviceBreakdown,
        accountInfo: {
          region: this.region,
          bucket: this.bucket,
          storageProvider: 's3',
        },
        lastSyncedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.warn(
        `AWS Cost Explorer SDK notice: ${error?.message || String(error)}`,
      );

      const estimatedSpend = 0.0;

      return {
        status: 'activation_required',
        period: { start: startOfMonth, end: endDate },
        currency: 'USD',
        totalSpend: estimatedSpend,
        forecastedSpend: estimatedSpend,
        projectSpend,
        credits: calculateCredits(estimatedSpend),
        s3Storage: s3StorageInfo,
        serviceBreakdown: [
          {
            serviceName: 'Amazon Elastic Compute Cloud (EC2)',
            amount: 0.0,
            currency: 'USD',
          },
          {
            serviceName: `Amazon Simple Storage Service (S3) - ${this.bucket} (${s3ObjectCount} items, ${s3TotalSizeMB} MB)`,
            amount: monthlyTotalCostUSD,
            currency: 'USD',
          },
          {
            serviceName: 'AWS Data Transfer Out (Global CDN)',
            amount: 0.0,
            currency: 'USD',
          },
        ],
        accountInfo: {
          region: this.region,
          bucket: this.bucket,
          storageProvider: 's3',
        },
        message:
          'AWS Cost Explorer API requires 1-click activation in AWS Console.',
        activationInstructions: [
          '1. Log into AWS Console (https://console.aws.amazon.com/billing/home#/credits) to view your active promotional credits.',
          '2. Click "Cost Explorer" on the left sidebar menu (https://console.aws.amazon.com/costmanagement/home#/cost-explorer).',
          '3. Click "Enable Cost Explorer" (AWS initial data ingestion takes 24 hours).',
          '4. Attach "CostExplorerReadOnlyAccess" or "AWSBillingReadOnlyAccess" policy to your IAM user in AWS IAM Console.',
        ],
        lastSyncedAt: new Date().toISOString(),
      };
    }
  }
}
