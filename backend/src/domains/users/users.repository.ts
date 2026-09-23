import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    status?: string;
    userType?: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const { page, limit, sortBy, sortOrder, search, status, userType } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    if (status) where.accountStatus = status as any;
    if (userType) where.userType = userType as any;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          userType: true,
          accountStatus: true,
          isEmailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          customerProfile: {
            select: {
              id: true,
              phone: true,
              addresses: {
                take: 1,
                orderBy: { isDefaultShipping: 'desc' },
                select: {
                  fullName: true,
                  phone: true,
                },
              },
              orders: {
                take: 1,
                orderBy: { createdAt: 'desc' },
                select: {
                  addresses: {
                    take: 1,
                    select: {
                      fullName: true,
                      phone: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const mappedData = data.map((u) => {
      let firstName = u.firstName;
      let lastName = u.lastName;
      let phone = u.phone;

      // Extract real phone if missing or if email is OTP placeholder
      if (!phone) {
        if (u.customerProfile?.phone) {
          phone = u.customerProfile.phone;
        } else if (u.customerProfile?.addresses?.[0]?.phone) {
          phone = u.customerProfile.addresses[0].phone;
        } else if (u.customerProfile?.orders?.[0]?.addresses?.[0]?.phone) {
          phone = u.customerProfile.orders[0].addresses[0].phone;
        } else if (u.email?.startsWith('otp_')) {
          const match = u.email.match(/^otp_(\d+)@/);
          if (match) phone = match[1];
        }
      }

      // Extract real name if name is generic 'Customer' or empty
      if (!firstName || firstName.toLowerCase() === 'customer') {
        const fallbackName =
          u.customerProfile?.addresses?.[0]?.fullName ||
          u.customerProfile?.orders?.[0]?.addresses?.[0]?.fullName;
        if (fallbackName) {
          const parts = fallbackName.trim().split(/\s+/);
          firstName = parts[0];
          lastName = parts.slice(1).join(' ') || lastName;
        }
      }

      const { customerProfile, ...rest } = u;
      return {
        ...rest,
        firstName,
        lastName,
        phone,
      };
    });

    return {
      data: mappedData,
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
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: {
              include: { rolePermissions: { include: { permission: true } } },
            },
          },
        },
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName?: string;
    phone?: string;
  }) {
    return this.prisma.user.create({ data });
  }

  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      gender?: string;
    },
  ) {
    return this.prisma.user.update({ where: { id }, data: data as any });
  }

  async updateStatus(id: string, accountStatus: string) {
    return this.prisma.user.update({
      where: { id },
      data: { accountStatus: accountStatus as any },
    });
  }

  async updateLockout(
    id: string,
    loginAttempts: number,
    lockoutUntil: Date | null,
  ) {
    return this.prisma.user.update({
      where: { id },
      data: { loginAttempts, lockoutUntil },
    });
  }

  async softDelete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), accountStatus: 'DELETED' as any },
    });
  }

  async findWithDeleted(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async restore(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: null, accountStatus: 'ACTIVE' as any },
    });
  }

  async resetLockout(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { loginAttempts: 0, lockoutUntil: null },
    });
  }

  async findRoleById(roleId: string) {
    return this.prisma.role.findUnique({ where: { id: roleId } });
  }

  async findRoleByName(name: string) {
    return this.prisma.role.findUnique({ where: { name } });
  }

  async assignRole(userId: string, roleId: string) {
    return this.prisma.userRole.create({ data: { userId, roleId } });
  }

  async removeRole(userId: string, roleId: string) {
    return this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    });
  }
}
