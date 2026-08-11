import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { CustomerProfileRepository } from './customer-profile.repository';
import { UpdateProfileDto, ProfileResponse } from './customer-profile.types';

@Injectable()
export class CustomerProfileService {
  constructor(
    private readonly profileRepository: CustomerProfileRepository,
    private readonly auditService: AuditService,
  ) {}

  private toResponse(p: any): ProfileResponse {
    return {
      id: p.id,
      userId: p.userId,
      phone: p.phone ?? undefined,
      gender: p.gender ?? undefined,
      dateOfBirth: p.dateOfBirth ?? undefined,
      preferredLanguage: p.preferredLanguage ?? undefined,
      preferredCurrency: p.preferredCurrency ?? undefined,
      preferredCategories: p.preferredCategories ?? undefined,
      preferredBrands: p.preferredBrands ?? undefined,
      preferredSizes: p.preferredSizes ?? undefined,
      preferredColors: p.preferredColors ?? undefined,
      preferredPriceMin: p.preferredPriceMin
        ? Number(p.preferredPriceMin)
        : undefined,
      preferredPriceMax: p.preferredPriceMax
        ? Number(p.preferredPriceMax)
        : undefined,
      profileImage: p.profileImage ?? undefined,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  async getProfile(userId: string): Promise<ProfileResponse> {
    let profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      profile = await this.profileRepository.create({
        user: { connect: { id: userId } },
      });
      await this.auditService.log({
        action: 'PROFILE_CREATED',
        module: 'customer-profile',
        resource: 'customerProfile',
        resourceId: profile.id,
        userId,
      });
    }
    return this.toResponse(profile);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponse> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile)
      throw new BusinessException('Profile not found', 'PROFILE_001');
    await this.profileRepository.update(profile.id, { ...dto });
    await this.auditService.log({
      action: 'PROFILE_UPDATED',
      module: 'customer-profile',
      resource: 'customerProfile',
      resourceId: profile.id,
      userId,
      newValue: { ...dto },
    });
    return this.getProfile(userId);
  }
}
