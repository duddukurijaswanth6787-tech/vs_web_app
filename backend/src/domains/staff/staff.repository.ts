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
    return this.prisma.staffProfile.findUnique({ where: { userId } });
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
    },
  ) {
    return this.prisma.staffProfile.update({
      where: { id },
      data: data as any,
    });
  }
}
