import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../../database/prisma.service";
import { CustomerProfileRepository } from './customer-profile.repository';
import { UpdateProfileDto, ProfileResponse } from './customer-profile.types';
export declare class CustomerProfileService {
    private readonly profileRepository;
    private readonly auditService;
    private readonly prisma;
    constructor(profileRepository: CustomerProfileRepository, auditService: AuditService, prisma: PrismaService);
    private toResponse;
    private findOrCreateProfile;
    getProfile(userId: string): Promise<ProfileResponse>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<ProfileResponse>;
}
