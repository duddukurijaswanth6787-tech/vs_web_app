import { Injectable } from '@nestjs/common';
import { AuditService } from '@domains/audit/audit.service';
import { PrismaService } from '@database/prisma.service';
import { CustomerProfileRepository } from './customer-profile.repository';
import { UpdateProfileDto, ProfileResponse } from './customer-profile.types';

@Injectable()
export class CustomerProfileService {
  constructor(
    private readonly profileRepository: CustomerProfileRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
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

  /**
   * A CustomerProfile row is created lazily, not at signup -- the Google and
   * OTP paths create a User without one. Reads have always tolerated that by
   * creating on demand; writes used to throw 'Profile not found' (422)
   * instead, so a customer who signed up with Google and went straight to
   * editing their details could never save. Both paths share this now.
   */
  private async findOrCreateProfile(userId: string) {
    const existing = await this.profileRepository.findByUserId(userId);
    if (existing) return existing;

    const created = await this.profileRepository.create({
      user: { connect: { id: userId } },
    });
    await this.auditService.log({
      action: 'PROFILE_CREATED',
      module: 'customer-profile',
      resource: 'customerProfile',
      resourceId: created.id,
      userId,
    });
    return created;
  }

  async getProfile(userId: string): Promise<ProfileResponse> {
    return this.toResponse(await this.findOrCreateProfile(userId));
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponse> {
    const profile = await this.findOrCreateProfile(userId);

    const { firstName, lastName, dateOfBirth, ...rest } = dto;

    // <input type="date"> submits 'YYYY-MM-DD', and @IsDateString accepts it,
    // but Prisma's DateTime rejects the date-only form at runtime with
    // PrismaClientValidationError. That is not a PrismaClientKnownRequestError,
    // so it bypasses the mapper's 400/404/409 branches and surfaces as a bare
    // 422 -- which is why saving personal details failed with no usable error.
    // Prisma's types accept `string | Date` here, so TypeScript never flagged it.
    const profileData = {
      ...rest,
      ...(dateOfBirth !== undefined
        ? { dateOfBirth: new Date(dateOfBirth) }
        : {}),
    };
    if (firstName !== undefined || lastName !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(firstName !== undefined ? { firstName } : {}),
          ...(lastName !== undefined ? { lastName } : {}),
        },
      });
    }

    await this.profileRepository.update(profile.id, { ...profileData });
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
