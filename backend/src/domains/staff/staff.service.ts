import { Injectable } from '@nestjs/common';
import { LoggerService } from '@common/logger/logger.service';
import { AuthenticationException, BusinessException } from '@common/exceptions';
import { IDENTITY_CONSTANTS } from '@shared/identity/identity.constants';
import { PasswordService } from '@domains/auth/services/password.service';
import { PrismaService } from '@database/prisma.service';
import { StaffRepository } from './staff.repository';
import {
  CreateStaffDto,
  UpdateStaffDto,
  StaffQueryDto,
  StaffResponse,
} from './staff.types';

@Injectable()
export class StaffService {
  constructor(
    private readonly staffRepository: StaffRepository,
    private readonly passwordService: PasswordService,
    private readonly prisma: PrismaService,
    private readonly loggerService: LoggerService,
  ) {}

  private toResponse(profile: any): StaffResponse {
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

  async findAll(query: StaffQueryDto) {
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

  async findById(id: string) {
    const profile = await this.staffRepository.findById(id);
    if (!profile)
      throw new AuthenticationException('Staff not found', 'STAFF_001');
    return this.toResponse(profile);
  }

  async create(dto: CreateStaffDto, createdBy: string) {
    let employeeId = dto.employeeId?.trim();
    if (employeeId) {
      const existingEmp =
        await this.staffRepository.findByEmployeeId(employeeId);
      if (existingEmp)
        throw new BusinessException('Employee ID already exists', 'STAFF_002');
    } else {
      employeeId = await this.staffRepository.generateEmployeeId();
    }

    const role = dto.roleId
      ? await this.prisma.role.findUnique({ where: { id: dto.roleId } })
      : await this.prisma.role.findUnique({
          where: { name: IDENTITY_CONSTANTS.DEFAULT_STAFF_ROLE },
        });
    if (dto.roleId && !role)
      throw new BusinessException('Role not found', 'ROLE_001');

    const passwordHash = await this.passwordService.hash(dto.password);
    // ponytail: create user + staff profile in one prisma nested create
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
            department: dto.department as any,
            designation: dto.designation as any,
            employeeId,
            jobTitle: dto.jobTitle,
            reportingManagerId: dto.reportingManagerId,
            emergencyContact: dto.emergencyContact,
            address: dto.address,
            joinedAt: dto.joinedAt ? new Date(dto.joinedAt) : undefined,
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
    this.loggerService.log(
      {
        action: 'staff_created',
        staffId: createdProfile?.id,
        employeeId,
      },
      'StaffService',
    );
    return this.findById(createdProfile!.id);
  }

  async update(id: string, dto: UpdateStaffDto) {
    const profile = await this.staffRepository.findById(id);
    if (!profile)
      throw new AuthenticationException('Staff not found', 'STAFF_001');

    await this.staffRepository.updateStaffProfile(id, {
      department: dto.department,
      designation: dto.designation,
      jobTitle: dto.jobTitle,
      reportingManagerId: dto.reportingManagerId,
      emergencyContact: dto.emergencyContact,
      address: dto.address,
      profileImage: dto.profileImage,
      joinedAt: dto.joinedAt ? new Date(dto.joinedAt) : undefined,
    });
    if (dto.firstName || dto.lastName || dto.phone) {
      await this.staffRepository.updateUser(profile.userId, {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      });
    }
    this.loggerService.log(
      { action: 'staff_updated', staffId: id },
      'StaffService',
    );
    return this.findById(id);
  }

  async delete(id: string) {
    const profile = await this.staffRepository.findById(id);
    if (!profile)
      throw new AuthenticationException('Staff not found', 'STAFF_001');
    await this.staffRepository.updateUser(profile.userId, {
      deletedAt: new Date(),
      accountStatus: 'DELETED',
    });
    this.loggerService.log(
      { action: 'staff_deleted', staffId: id },
      'StaffService',
    );
  }

  async restore(id: string) {
    const profile = await this.staffRepository.findById(id);
    if (!profile)
      throw new AuthenticationException('Staff not found', 'STAFF_001');
    await this.staffRepository.updateUser(profile.userId, {
      deletedAt: null,
      accountStatus: 'ACTIVE',
    });
    await this.staffRepository.updateEmploymentStatus(id, 'ACTIVE');
    this.loggerService.log(
      { action: 'staff_restored', staffId: id },
      'StaffService',
    );
    return this.findById(id);
  }

  private async updateStatus(
    id: string,
    accountStatus: string,
    employmentStatus: string,
    action: string,
  ) {
    const profile = await this.staffRepository.findById(id);
    if (!profile)
      throw new AuthenticationException('Staff not found', 'STAFF_001');
    await this.staffRepository.updateUser(profile.userId, {
      accountStatus,
    });
    await this.staffRepository.updateEmploymentStatus(id, employmentStatus);
    this.loggerService.log({ action, staffId: id }, 'StaffService');
    return this.findById(id);
  }

  async activate(id: string) {
    return this.updateStatus(id, 'ACTIVE', 'ACTIVE', 'staff_activated');
  }
  async deactivate(id: string) {
    return this.updateStatus(id, 'INACTIVE', 'INACTIVE', 'staff_deactivated');
  }
  async suspend(id: string) {
    return this.updateStatus(id, 'SUSPENDED', 'SUSPENDED', 'staff_suspended');
  }
  async lock(id: string) {
    return this.updateStatus(id, 'LOCKED', 'SUSPENDED', 'staff_locked');
  }

  async unlock(id: string) {
    const profile = await this.staffRepository.findById(id);
    if (!profile)
      throw new AuthenticationException('Staff not found', 'STAFF_001');
    await this.staffRepository.updateUser(profile.userId, {
      accountStatus: 'ACTIVE',
      loginAttempts: 0,
      lockoutUntil: null,
    });
    await this.staffRepository.updateEmploymentStatus(id, 'ACTIVE');
    this.loggerService.log(
      { action: 'staff_unlocked', staffId: id },
      'StaffService',
    );
    return this.findById(id);
  }
}
