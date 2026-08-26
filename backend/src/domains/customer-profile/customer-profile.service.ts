import { Injectable } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
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
      // Identity lives on the User row. Without these the edit form had
      // nothing to prefill its name/email fields with, so they rendered blank
      // even for a fully populated account.
      firstName: p.user?.firstName ?? undefined,
      lastName: p.user?.lastName ?? undefined,
      email: p.user?.email ?? undefined,
      // Prefer the profile's own phone, falling back to the one captured at
      // OTP signup, so a phone-login customer sees their number prefilled.
      phone: p.phone ?? p.user?.phone ?? undefined,
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

    const { firstName, lastName, email, dateOfBirth, ...rest } = dto;

    // Email is what login resolves an account by, and it is unique across
    // users. Left unguarded, saving an address already registered elsewhere
    // fails deep in Prisma as a P2002 the customer sees as an unexplained
    // error, and an accepted duplicate would point two accounts at one login.
    let nextEmail: string | undefined;
    if (email !== undefined) {
      const normalized = email.trim().toLowerCase();
      const current = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (normalized !== current?.email) {
        const taken = await this.prisma.user.findFirst({
          where: { email: normalized, deletedAt: null, id: { not: userId } },
          select: { id: true },
        });
        if (taken) {
          throw new BusinessException(
            'That email address is already registered to another account',
            'EMAIL_TAKEN',
          );
        }
        nextEmail = normalized;
      }
    }

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
    if (
      firstName !== undefined ||
      lastName !== undefined ||
      nextEmail !== undefined
    ) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(firstName !== undefined ? { firstName } : {}),
          ...(lastName !== undefined ? { lastName } : {}),
          // A new address has not been proven to belong to the customer, so
          // it stops counting as verified until they confirm it.
          ...(nextEmail !== undefined
            ? { email: nextEmail, isEmailVerified: false }
            : {}),
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
