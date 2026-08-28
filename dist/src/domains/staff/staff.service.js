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
exports.StaffService = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../../common/logger/logger.service");
const exceptions_1 = require("../../common/exceptions");
const identity_constants_1 = require("../../shared/identity/identity.constants");
const password_service_1 = require("../auth/services/password.service");
const prisma_service_1 = require("../../database/prisma.service");
const staff_repository_1 = require("./staff.repository");
let StaffService = class StaffService {
    staffRepository;
    passwordService;
    prisma;
    loggerService;
    constructor(staffRepository, passwordService, prisma, loggerService) {
        this.staffRepository = staffRepository;
        this.passwordService = passwordService;
        this.prisma = prisma;
        this.loggerService = loggerService;
    }
    toResponse(profile) {
        const u = profile.user;
        return {
            id: profile.id,
            userId: profile.userId,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName ?? undefined,
            department: profile.department,
            designation: profile.designation,
            employeeId: profile.employeeId,
            jobTitle: profile.jobTitle ?? undefined,
            reportingManagerId: profile.reportingManagerId ?? undefined,
            employmentStatus: profile.employmentStatus,
            accountStatus: u.accountStatus,
            joinedAt: profile.joinedAt ?? undefined,
            phone: u.phone ?? undefined,
            profileImage: profile.profileImage ?? undefined,
            createdAt: profile.createdAt,
        };
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 10, 100);
        const result = await this.staffRepository.findAll({
            search: query.search,
            department: query.department,
            designation: query.designation,
            employmentStatus: query.employmentStatus,
            page,
            limit,
            sortBy: query.sortBy ?? 'createdAt',
            sortOrder: query.sortOrder ?? 'desc',
        });
        return {
            data: result.data.map((p) => this.toResponse(p)),
            meta: result.meta,
        };
    }
    async findById(id) {
        const profile = await this.staffRepository.findById(id);
        if (!profile)
            throw new exceptions_1.AuthenticationException('Staff not found', 'STAFF_001');
        return this.toResponse(profile);
    }
    async create(dto, createdBy) {
        let employeeId = dto.employeeId?.trim();
        if (employeeId) {
            const existingEmp = await this.staffRepository.findByEmployeeId(employeeId);
            if (existingEmp)
                throw new exceptions_1.BusinessException('Employee ID already exists', 'STAFF_002');
        }
        else {
            employeeId = await this.staffRepository.generateEmployeeId();
        }
        const role = dto.roleId
            ? await this.prisma.role.findUnique({ where: { id: dto.roleId } })
            : await this.prisma.role.findUnique({
                where: { name: identity_constants_1.IDENTITY_CONSTANTS.DEFAULT_STAFF_ROLE },
            });
        if (dto.roleId && !role)
            throw new exceptions_1.BusinessException('Role not found', 'ROLE_001');
        const passwordHash = await this.passwordService.hash(dto.password);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
                phone: dto.phone,
                userType: 'STAFF',
                staffProfile: {
                    create: {
                        department: dto.department,
                        designation: dto.designation,
                        employeeId,
                        jobTitle: dto.jobTitle,
                        reportingManagerId: dto.reportingManagerId,
                        emergencyContact: dto.emergencyContact,
                        address: dto.address,
                        createdBy,
                    },
                },
            },
            include: { staffProfile: true },
        });
        if (role)
            await this.prisma.userRole.create({
                data: { userId: user.id, roleId: role.id },
            });
        const createdProfile = await this.staffRepository.findByUserId(user.id);
        this.loggerService.log({
            action: 'staff_created',
            staffId: createdProfile?.id,
            employeeId,
        }, 'StaffService');
        return this.findById(createdProfile.id);
    }
    async update(id, dto) {
        const profile = await this.staffRepository.findById(id);
        if (!profile)
            throw new exceptions_1.AuthenticationException('Staff not found', 'STAFF_001');
        await this.staffRepository.updateStaffProfile(id, {
            department: dto.department,
            designation: dto.designation,
            jobTitle: dto.jobTitle,
            reportingManagerId: dto.reportingManagerId,
            emergencyContact: dto.emergencyContact,
            address: dto.address,
            profileImage: dto.profileImage,
        });
        if (dto.firstName || dto.lastName || dto.phone) {
            await this.staffRepository.updateUser(profile.userId, {
                firstName: dto.firstName,
                lastName: dto.lastName,
                phone: dto.phone,
            });
        }
        this.loggerService.log({ action: 'staff_updated', staffId: id }, 'StaffService');
        return this.findById(id);
    }
    async delete(id) {
        const profile = await this.staffRepository.findById(id);
        if (!profile)
            throw new exceptions_1.AuthenticationException('Staff not found', 'STAFF_001');
        await this.staffRepository.updateUser(profile.userId, {
            deletedAt: new Date(),
            accountStatus: 'DELETED',
        });
        this.loggerService.log({ action: 'staff_deleted', staffId: id }, 'StaffService');
    }
    async restore(id) {
        const profile = await this.staffRepository.findById(id);
        if (!profile)
            throw new exceptions_1.AuthenticationException('Staff not found', 'STAFF_001');
        await this.staffRepository.updateUser(profile.userId, {
            deletedAt: null,
            accountStatus: 'ACTIVE',
        });
        await this.staffRepository.updateEmploymentStatus(id, 'ACTIVE');
        this.loggerService.log({ action: 'staff_restored', staffId: id }, 'StaffService');
        return this.findById(id);
    }
    async updateStatus(id, accountStatus, employmentStatus, action) {
        const profile = await this.staffRepository.findById(id);
        if (!profile)
            throw new exceptions_1.AuthenticationException('Staff not found', 'STAFF_001');
        await this.staffRepository.updateUser(profile.userId, {
            accountStatus,
        });
        await this.staffRepository.updateEmploymentStatus(id, employmentStatus);
        this.loggerService.log({ action, staffId: id }, 'StaffService');
        return this.findById(id);
    }
    async activate(id) {
        return this.updateStatus(id, 'ACTIVE', 'ACTIVE', 'staff_activated');
    }
    async deactivate(id) {
        return this.updateStatus(id, 'INACTIVE', 'INACTIVE', 'staff_deactivated');
    }
    async suspend(id) {
        return this.updateStatus(id, 'SUSPENDED', 'SUSPENDED', 'staff_suspended');
    }
    async lock(id) {
        return this.updateStatus(id, 'LOCKED', 'SUSPENDED', 'staff_locked');
    }
    async unlock(id) {
        const profile = await this.staffRepository.findById(id);
        if (!profile)
            throw new exceptions_1.AuthenticationException('Staff not found', 'STAFF_001');
        await this.staffRepository.updateUser(profile.userId, {
            accountStatus: 'ACTIVE',
            loginAttempts: 0,
            lockoutUntil: null,
        });
        await this.staffRepository.updateEmploymentStatus(id, 'ACTIVE');
        this.loggerService.log({ action: 'staff_unlocked', staffId: id }, 'StaffService');
        return this.findById(id);
    }
};
exports.StaffService = StaffService;
exports.StaffService = StaffService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [staff_repository_1.StaffRepository,
        password_service_1.PasswordService,
        prisma_service_1.PrismaService,
        logger_service_1.LoggerService])
], StaffService);
//# sourceMappingURL=staff.service.js.map