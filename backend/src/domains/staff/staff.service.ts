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
  PunchInDto,
  PunchOutDto,
  AttendanceQueryDto,
  StaffAttendanceResponse,
  CreateStaffTaskDto,
  UpdateStaffTaskDto,
  StaffTaskResponse,
  StaffPerformanceSummaryResponse,
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
      emergencyContact: profile.emergencyContact ?? undefined,
      address: profile.address ?? undefined,
      roles: u.userRoles?.map((ur: any) => ur.role?.name || ur.role) ?? undefined,
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

  async findByUserId(userId: string) {
    const profile = await this.getOrCreateStaffProfileForUser(userId);
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
    if (role?.name === 'super_admin')
      throw new BusinessException('Cannot assign super_admin role via staff creation', 'ROLE_PROTECTED');

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
        accountStatus: 'ACTIVE',
        isEmailVerified: true,
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

  // ==========================================
  // ATTENDANCE & PUNCH IN / OUT METHODS
  // ==========================================

  private toAttendanceResponse(att: any): StaffAttendanceResponse {
    const sp = att.staffProfile;
    const u = sp?.user;
    const staffName =
      u?.firstName || u?.lastName
        ? `${u?.firstName || ''} ${u?.lastName || ''}`.trim()
        : 'Staff Member';

    return {
      id: att.id,
      staffProfileId: att.staffProfileId,
      employeeId: sp?.employeeId || '',
      staffName,
      department: sp?.department || '',
      designation: sp?.designation || '',
      date: att.date,
      punchInAt: att.punchInAt,
      punchOutAt: att.punchOutAt ?? undefined,
      totalHours: Number(att.totalHours || 0),
      breakMinutes: att.breakMinutes || 0,
      status: att.status,
      shiftType: att.shiftType,
      punchInLocation: att.punchInLocation ?? undefined,
      notes: att.notes ?? undefined,
      isCurrentlyActive: !att.punchOutAt,
    };
  }

  private toTaskResponse(t: any): StaffTaskResponse {
    const sp = t.staffProfile;
    const u = sp?.user;
    const staffName =
      u?.firstName || u?.lastName
        ? `${u?.firstName || ''} ${u?.lastName || ''}`.trim()
        : 'Staff Member';
    const assignedUser = t.assignedBy;
    const assignedByName = assignedUser
      ? `${assignedUser.firstName || ''} ${assignedUser.lastName || ''}`.trim()
      : undefined;

    return {
      id: t.id,
      staffProfileId: t.staffProfileId,
      staffName,
      employeeId: sp?.employeeId || '',
      title: t.title,
      description: t.description ?? undefined,
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate ?? undefined,
      completedAt: t.completedAt ?? undefined,
      assignedByName,
      notes: t.notes ?? undefined,
      createdAt: t.createdAt,
    };
  }

  private async getOrCreateStaffProfileForUser(userId: string) {
    let profile = await this.staffRepository.findByUserId(userId);
    if (!profile) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AuthenticationException('User not found', 'USER_404');
      const employeeId = await this.staffRepository.generateEmployeeId();
      await this.staffRepository.create({
        userId: user.id,
        department: 'SALES',
        designation: 'ASSOCIATE',
        employeeId,
        createdBy: user.id,
        jobTitle: 'Store Executive',
      });
      profile = await this.staffRepository.findByUserId(userId);
    }
    if (!profile) {
      throw new AuthenticationException('Staff profile could not be created', 'STAFF_404');
    }
    return profile;
  }

  /**
   * Daily staff clock-in / punch-in
   */
  async punchIn(userId: string, dto: PunchInDto, ip?: string): Promise<StaffAttendanceResponse> {
    const staff = await this.getOrCreateStaffProfileForUser(userId);
    const today = new Date().toISOString().split('T')[0];

    const existing = await this.staffRepository.findAttendanceByStaffAndDate(staff.id, today);
    if (existing) {
      if (!existing.punchOutAt) {
        return this.toAttendanceResponse(existing);
      }
      throw new BusinessException('Already clocked out for today', 'ATT_ALREADY_COMPLETED');
    }

    const now = new Date();
    // Shift threshold: 09:45 AM (after 09:45 marked as LATE)
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 45);
    const status = isLate ? 'LATE' : 'PRESENT';

    const record = await this.staffRepository.createAttendance({
      staffProfileId: staff.id,
      date: today,
      punchInAt: now,
      punchInLocation: dto.location || 'Store Main Counter',
      punchInIp: ip,
      shiftType: dto.shiftType || 'GENERAL',
      status,
      notes: dto.notes,
    });

    this.loggerService.log(
      { action: 'staff_punched_in', staffId: staff.id, time: now.toISOString(), status },
      'StaffService',
    );

    return this.toAttendanceResponse(record);
  }

  /**
   * Daily staff clock-out / punch-out
   */
  async punchOut(userId: string, dto: PunchOutDto, ip?: string): Promise<StaffAttendanceResponse> {
    const staff = await this.getOrCreateStaffProfileForUser(userId);
    const today = new Date().toISOString().split('T')[0];

    const activeRecord = await this.staffRepository.findAttendanceByStaffAndDate(staff.id, today);
    if (!activeRecord || activeRecord.punchOutAt) {
      throw new BusinessException('No active clock-in session found for today', 'ATT_NOT_ACTIVE');
    }

    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - activeRecord.punchInAt.getTime());
    const breakMins = dto.breakMinutes || activeRecord.breakMinutes || 0;
    const totalHours = Math.max(0, Math.round(((diffMs / 3600000) - (breakMins / 60)) * 100) / 100);

    let status = activeRecord.status;
    if (totalHours < 4 && status === 'PRESENT') {
      status = 'HALF_DAY';
    }

    const updated = await this.staffRepository.updateAttendance(activeRecord.id, {
      punchOutAt: now,
      totalHours,
      breakMinutes: breakMins,
      status,
      notes: dto.notes || activeRecord.notes || undefined,
      punchOutIp: ip,
    });

    this.loggerService.log(
      { action: 'staff_punched_out', staffId: staff.id, totalHours },
      'StaffService',
    );

    return this.toAttendanceResponse(updated);
  }

  /**
   * Get current clock-in state for the logged-in user
   */
  async getTodayAttendance(userId: string): Promise<{
    isPunchedIn: boolean;
    attendance?: StaffAttendanceResponse;
  }> {
    const staff = await this.staffRepository.findByUserId(userId);
    if (!staff) {
      return { isPunchedIn: false };
    }
    const today = new Date().toISOString().split('T')[0];
    const record = await this.staffRepository.findAttendanceByStaffAndDate(staff.id, today);

    if (!record) {
      return { isPunchedIn: false };
    }

    return {
      isPunchedIn: !record.punchOutAt,
      attendance: this.toAttendanceResponse(record),
    };
  }

  /**
   * Super Admin live attendance roster
   */
  async getAdminLiveRoster(dateQuery?: string, department?: string) {
    const targetDate = dateQuery || new Date().toISOString().split('T')[0];

    // Fetch all active staff who have the 'staff' role
    const allStaff = await this.prisma.staffProfile.findMany({
      where: {
        employmentStatus: 'ACTIVE',
        user: {
          deletedAt: null,
          userRoles: {
            some: {
              role: {
                name: 'staff',
              },
            },
          },
        },
        ...(department ? { department: department as any } : {}),
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            userRoles: {
              select: {
                role: { select: { name: true, displayName: true } },
              },
            },
          },
        },
      },
      orderBy: { employeeId: 'asc' },
    });

    // Fetch attendance for date
    const attendances = await this.staffRepository.findAttendanceList({
      date: targetDate,
      department,
    });

    const attendanceMap = new Map<string, any>();
    for (const att of attendances) {
      attendanceMap.set(att.staffProfileId, att);
    }

    let clockedInCount = 0;
    let completedCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    const roster = allStaff.map((st) => {
      const att = attendanceMap.get(st.id);
      const name = `${st.user?.firstName || ''} ${st.user?.lastName || ''}`.trim() || 'Staff';

      if (att) {
        if (!att.punchOutAt) clockedInCount++;
        else completedCount++;
        if (att.status === 'LATE') lateCount++;

        return {
          staffProfileId: st.id,
          employeeId: st.employeeId,
          name,
          department: st.department,
          designation: st.designation,
          phone: st.user?.phone,
          status: att.status,
          isClockedIn: !att.punchOutAt,
          punchInAt: att.punchInAt,
          punchOutAt: att.punchOutAt ?? null,
          totalHours: Number(att.totalHours || 0),
          notes: att.notes,
        };
      } else {
        absentCount++;
        return {
          staffProfileId: st.id,
          employeeId: st.employeeId,
          name,
          department: st.department,
          designation: st.designation,
          phone: st.user?.phone,
          status: 'NOT_RECORDED',
          isClockedIn: false,
          punchInAt: null,
          punchOutAt: null,
          totalHours: 0,
          notes: null,
        };
      }
    });

    return {
      date: targetDate,
      stats: {
        totalStaff: allStaff.length,
        currentlyClockedIn: clockedInCount,
        completedShifts: completedCount,
        absentCount,
        lateCount,
      },
      roster,
    };
  }

  /**
   * Super Admin / Staff monthly attendance calendar history
   */
  async getAttendanceHistory(query: AttendanceQueryDto) {
    const list = await this.staffRepository.findAttendanceList({
      staffProfileId: query.staffProfileId,
      date: query.date,
      month: query.month,
      department: query.department,
      status: query.status,
    });
    return list.map((att) => this.toAttendanceResponse(att));
  }

  // ==========================================
  // STAFF TASK MANAGEMENT
  // ==========================================

  async createTask(dto: CreateStaffTaskDto, assignedByUserId: string): Promise<StaffTaskResponse> {
    const task = await this.staffRepository.createTask({
      staffProfileId: dto.staffProfileId,
      title: dto.title,
      description: dto.description,
      priority: dto.priority || 'MEDIUM',
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      assignedById: assignedByUserId,
      notes: dto.notes,
    });

    return this.toTaskResponse(task);
  }

  async updateTask(
    taskId: string,
    dto: UpdateStaffTaskDto,
  ): Promise<StaffTaskResponse> {
    const existing = await this.staffRepository.findTaskById(taskId);
    if (!existing) throw new BusinessException('Task not found', 'TASK_404');

    const completedAt =
      dto.status === 'COMPLETED' ? new Date() : dto.status ? null : existing.completedAt;

    const updated = await this.staffRepository.updateTask(taskId, {
      priority: dto.priority,
      status: dto.status,
      completedAt,
      notes: dto.notes,
    });

    return this.toTaskResponse(updated);
  }

  async getStaffTasks(staffProfileId?: string, status?: string, priority?: string) {
    const list = await this.staffRepository.findTasks({ staffProfileId, status, priority });
    return list.map((t) => this.toTaskResponse(t));
  }

  async getMyTasks(userId: string) {
    const staff = await this.staffRepository.findByUserId(userId);
    if (!staff) return [];
    const list = await this.staffRepository.findTasks({ staffProfileId: staff.id });
    return list.map((t) => this.toTaskResponse(t));
  }

  // ==========================================
  // ERP PERFORMANCE & PAYROLL SUMMARY
  // ==========================================

  async getStaffPerformanceReport(
    staffProfileId: string,
    month?: string,
  ): Promise<StaffPerformanceSummaryResponse> {
    const staff = await this.staffRepository.findById(staffProfileId);
    if (!staff) throw new BusinessException('Staff profile not found', 'STAFF_001');

    const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM
    const attendances = await this.staffRepository.findAttendanceList({
      staffProfileId,
      month: targetMonth,
    });
    const tasks = await this.staffRepository.findTasks({ staffProfileId });

    let presentDays = 0;
    let lateDays = 0;
    let totalHoursWorked = 0;

    for (const att of attendances) {
      if (att.status === 'PRESENT' || att.status === 'LATE' || att.status === 'HALF_DAY') {
        presentDays += att.status === 'HALF_DAY' ? 0.5 : 1;
      }
      if (att.status === 'LATE') lateDays++;
      totalHoursWorked += Number(att.totalHours || 0);
    }

    const totalWorkingDays = 26; // Standard working days in month
    const attendanceRatePercent = Math.min(100, Math.round((presentDays / totalWorkingDays) * 100));

    const totalTasksAssigned = tasks.length;
    const tasksCompleted = tasks.filter((t) => t.status === 'COMPLETED').length;
    const taskCompletionRatePercent =
      totalTasksAssigned > 0 ? Math.round((tasksCompleted / totalTasksAssigned) * 100) : 100;

    const u = staff.user;
    const staffName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Staff';

    return {
      staffProfileId: staff.id,
      employeeId: staff.employeeId,
      staffName,
      department: staff.department,
      designation: staff.designation,
      totalWorkingDays,
      presentDays,
      lateDays,
      totalHoursWorked: Math.round(totalHoursWorked * 10) / 10,
      attendanceRatePercent,
      totalTasksAssigned,
      tasksCompleted,
      taskCompletionRatePercent,
      estimatedPayableHours: Math.round(totalHoursWorked * 10) / 10,
    };
  }
}

