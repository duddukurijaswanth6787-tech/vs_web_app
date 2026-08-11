import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { BusinessException } from '@common/exceptions';

@Injectable()
export class FeatureGateService {
  constructor(private readonly prisma: PrismaService) {}

  async isEnabled(key: string): Promise<boolean> {
    const toggle = await this.prisma.featureToggle.findUnique({
      where: { key },
    });
    return toggle?.enabled === true;
  }

  async assertEnabled(key: string, featureName?: string): Promise<void> {
    const enabled = await this.isEnabled(key);
    if (!enabled) {
      throw new BusinessException(
        `${featureName ?? key} is currently disabled by admin`,
        'FEATURE_DISABLED',
      );
    }
  }
}
