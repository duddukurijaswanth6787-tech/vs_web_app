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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerProfileService = void 0;
const common_1 = require("@nestjs/common");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const prisma_service_1 = require("../../database/prisma.service");
const customer_profile_repository_1 = require("./customer-profile.repository");
let CustomerProfileService = class CustomerProfileService {
    profileRepository;
    auditService;
    prisma;
    constructor(profileRepository, auditService, prisma) {
        this.profileRepository = profileRepository;
        this.auditService = auditService;
        this.prisma = prisma;
    }
    toResponse(p) {
        return {
            id: p.id,
            userId: p.userId,
            firstName: p.user?.firstName ?? undefined,
            lastName: p.user?.lastName ?? undefined,
            email: p.user?.email ?? undefined,
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
    async findOrCreateProfile(userId) {
        const existing = await this.profileRepository.findByUserId(userId);
        if (existing)
            return existing;
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
    async getProfile(userId) {
        return this.toResponse(await this.findOrCreateProfile(userId));
    }
    async updateProfile(userId, dto) {
        const profile = await this.findOrCreateProfile(userId);
        const { firstName, lastName, email, dateOfBirth, ...rest } = dto;
        let nextEmail;
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
                    throw new exceptions_1.BusinessException('That email address is already registered to another account', 'EMAIL_TAKEN');
                }
                nextEmail = normalized;
            }
        }
        const profileData = {
            ...rest,
            ...(dateOfBirth !== undefined
                ? { dateOfBirth: new Date(dateOfBirth) }
                : {}),
        };
        if (firstName !== undefined ||
            lastName !== undefined ||
            nextEmail !== undefined) {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    ...(firstName !== undefined ? { firstName } : {}),
                    ...(lastName !== undefined ? { lastName } : {}),
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
};
exports.CustomerProfileService = CustomerProfileService;
exports.CustomerProfileService = CustomerProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [customer_profile_repository_1.CustomerProfileRepository,
        audit_service_1.AuditService,
        prisma_service_1.PrismaService])
], CustomerProfileService);
//# sourceMappingURL=customer-profile.service.js.map