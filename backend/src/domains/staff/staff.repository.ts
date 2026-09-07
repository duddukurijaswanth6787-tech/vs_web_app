import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class StaffRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    department?: string;
    designation?: string;
    employmentStatus?: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const {
      search,
      department,
      designation,
      employmentStatus,
      page,
      limit,
      sortBy,
      sortOrder,
    } = params;
    const skip = (page - 1) * limit;
    const where: any = { user: { deletedAt: null } };
    if (search) {
      where.OR = [
        { employeeId: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (department) where.department = department;
    if (designation) where.designation = designation;
    if (employmentStatus) where.employmentStatus = employmentStatus;

    const [data, total] = await Promise.all([
      this.prisma.staffProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy:
          sortBy === 'createdAt'
            ? { createdAt: sortOrder }
            : { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              accountStatus: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.staffProfile.count({ where }),
    ]);
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async findById(id: string) {
    return this.prisma.staffProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            accountStatus: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        reportingManager: {
          select: { id: true, employeeId: true, jobTitle: true },
        },
      },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.staffProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            accountStatus: true,
            userRoles: {
              select: {
                role: { select: { name: true, displayName: true } },
              },
            },
          },
        },
      },
    });
  }

  async findByEmployeeId(employeeId: string) {
    return this.prisma.staffProfile.findUnique({ where: { employeeId } });
  }

  /**
   * EMP-0001, EMP-0002, … based on how many staff profiles have ever
   * existed (soft-deleted ones included, so an ID is never reused). Retries
   * on the rare chance of a collision from a concurrent create.
   */
  async generateEmployeeId(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const count = await this.prisma.staffProfile.count();
      const candidate = `EMP-${String(count + 1 + attempt).padStart(4, '0')}`;
      const existing = await this.findByEmployeeId(candidate);
      if (!existing) return candidate;
    }
    return `EMP-${Date.now()}`;
  }

  async create(data: {
    userId: string;
    department: string;
    designation: string;
    employeeId: string;
    jobTitle?: string;
    reportingManagerId?: string;
    joinedAt?: Date;
    emergencyContact?: string;
    address?: string;
    createdBy: string;
  }) {
    return this.prisma.staffProfile.create({ data: data as any });
  }

  async update(
    id: string,
    data: {
      department?: string;
      designation?: string;
      jobTitle?: string;
      reportingManagerId?: string;
      emergencyContact?: string;
      address?: string;
      profileImage?: string;
      joinedAt?: Date;
    },
  ) {
    return this.prisma.staffProfile.update({
      where: { id },
      data: data as any,
    });
  }

  async updateEmploymentStatus(id: string, status: string) {
    return this.prisma.staffProfile.update({
      where: { id },
      data: { employmentStatus: status as any },
    });
  }

  async updateUser(
    userId: string,
    data: {
      accountStatus?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      loginAttempts?: number;
      lockoutUntil?: Date | null;
      deletedAt?: Date | null;
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: data as any,
    });
  }

  async updateStaffProfile(
    id: string,
    data: {
      department?: string;
      designation?: string;
      jobTitle?: string;
      reportingManagerId?: string;
      emergencyContact?: string;
      address?: string;
      profileImage?: string;
      joinedAt?: Date;
    },
  ) {
    return this.prisma.staffProfile.update({
      where: { id },
      data: data as any,
    });
  }

  // --- Attendance Repository Methods ---

  async findAttendanceByStaffAndDate(staffProfileId: string, date: string) {
    return this.prisma.staffAttendance.findUnique({
      where: {
        staffProfileId_date: {
          staffProfileId,
          date,
        },
      },
      include: {
        staffProfile: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  async findAttendanceById(id: string) {
    return this.prisma.staffAttendance.findUnique({
      where: { id },
      include: {
        staffProfile: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  async createAttendance(data: {
    staffProfileId: string;
    date: string;
    punchInAt: Date;
    punchInLocation?: string;
    punchInIp?: string;
    shiftType?: string;
    status?: string;
    notes?: string;
  }) {
    return this.prisma.staffAttendance.create({
      data: {
        staffProfile: { connect: { id: data.staffProfileId } },
        date: data.date,
        punchInAt: data.punchInAt,
        punchInLocation: data.punchInLocation,
        punchInIp: data.punchInIp,
        shiftType: data.shiftType || 'GENERAL',
        status: data.status || 'PRESENT',
        notes: data.notes,
      },
      include: {
        staffProfile: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  async updateAttendance(
    id: string,
    data: {
      punchOutAt?: Date;
      totalHours?: number;
      breakMinutes?: number;
      status?: string;
      notes?: string;
      punchOutIp?: string;
    },
  ) {
    return this.prisma.staffAttendance.update({
      where: { id },
      data: {
        ...(data.punchOutAt && { punchOutAt: data.punchOutAt }),
        ...(data.totalHours !== undefined && { totalHours: data.totalHours }),
        ...(data.breakMinutes !== undefined && { breakMinutes: data.breakMinutes }),
        ...(data.status && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.punchOutIp && { punchOutIp: data.punchOutIp }),
      },
      include: {
        staffProfile: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });
  }

  async findAttendanceList(params: {
    staffProfileId?: string;
    date?: string;
    month?: string;
    department?: string;
    status?: string;
  }) {
    const where: any = {};
    if (params.staffProfileId) where.staffProfileId = params.staffProfileId;
    if (params.date) where.date = params.date;
    if (params.month) where.date = { startsWith: params.month };
    if (params.status) where.status = params.status;
    if (params.department) {
      where.staffProfile = { department: params.department };
    }

    return this.prisma.staffAttendance.findMany({
      where,
      orderBy: [{ date: 'desc' }, { punchInAt: 'desc' }],
      include: {
        staffProfile: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, phone: true },
            },
          },
        },
      },
    });
  }

  // --- Task Repository Methods ---

  async createTask(data: {
    staffProfileId: string;
    title: string;
    description?: string;
    priority?: string;
    dueDate?: Date;
    assignedById?: string;
    notes?: string;
  }) {
    return this.prisma.staffTask.create({
      data: {
        staffProfile: { connect: { id: data.staffProfileId } },
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate,
        assignedBy: data.assignedById ? { connect: { id: data.assignedById } } : undefined,
        notes: data.notes,
      },
      include: {
        staffProfile: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        assignedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async updateTask(
    id: string,
    data: {
      title?: string;
      description?: string;
      priority?: string;
      status?: string;
      completedAt?: Date | null;
      notes?: string;
    },
  ) {
    return this.prisma.staffTask.update({
      where: { id },
      data,
      include: {
        staffProfile: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        assignedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async findTaskById(id: string) {
    return this.prisma.staffTask.findUnique({
      where: { id },
      include: {
        staffProfile: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        assignedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async findTasks(params: {
    staffProfileId?: string;
    status?: string;
    priority?: string;
  }) {
    const where: any = {};
    if (params.staffProfileId) where.staffProfileId = params.staffProfileId;
    if (params.status) where.status = params.status;
    if (params.priority) where.priority = params.priority;

    return this.prisma.staffTask.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        staffProfile: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        assignedBy: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });
  }
}

