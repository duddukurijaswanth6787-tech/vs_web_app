import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(emailInput: string) {
    const trimmed = (emailInput || '').trim();
    const formattedEmail = trimmed.includes('@')
      ? trimmed
      : `${trimmed}@vasanthi.com`;

    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: trimmed, mode: 'insensitive' } },
          { email: { equals: formattedEmail, mode: 'insensitive' } },
          { phone: trimmed },
        ],
      },
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

  async seedAdmin() {
    const SYSTEM_ROLES = [
      { name: 'super_admin', displayName: 'Super Admin', description: 'Full system access', scope: 'GLOBAL' as const, hierarchy: 100, isSystem: true },
      { name: 'admin', displayName: 'Admin', description: 'Administrative access', scope: 'GLOBAL' as const, hierarchy: 80, isSystem: true },
      { name: 'staff', displayName: 'Staff', description: 'Staff member access', scope: 'DOMAIN' as const, hierarchy: 50, isSystem: true },
      { name: 'customer', displayName: 'Customer', description: 'Customer access', scope: 'CUSTOM' as const, hierarchy: 10, isSystem: true },
    ];

    for (const role of SYSTEM_ROLES) {
      await this.prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      });
    }

    const superAdminRole = await this.prisma.role.findUnique({
      where: { name: 'super_admin' },
    });

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@vasanthi.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const passwordHash = await require('argon2').hash(adminPassword);

    const adminUser = await this.prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash,
        userType: 'ADMIN',
        accountStatus: 'ACTIVE',
        isEmailVerified: true,
        loginAttempts: 0,
        lockoutUntil: null,
      },
      create: {
        email: adminEmail,
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        userType: 'ADMIN',
        accountStatus: 'ACTIVE',
        isEmailVerified: true,
        loginAttempts: 0,
      },
    });

    if (superAdminRole) {
      const existingRoleLink = await this.prisma.userRole.findFirst({
        where: { userId: adminUser.id, roleId: superAdminRole.id },
      });
      if (!existingRoleLink) {
        await this.prisma.userRole.create({
          data: { userId: adminUser.id, roleId: superAdminRole.id },
        });
      }
    }

    return {
      email: adminEmail,
      seeded: true,
    };
  }

  // ponytail: lightweight lookup — no roles/permissions, for auth checks that only need user fields
  async findByEmailBasic(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        accountStatus: true,
        userType: true,
        loginAttempts: true,
        lockoutUntil: true,
        firstName: true,
        lastName: true,
      },
    });
  }

  async findByIdBasic(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        accountStatus: true,
        userType: true,
        firstName: true,
        lastName: true,
      },
    });
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findFirst({
      where: { phone, deletedAt: null },
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

  async createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    isPhoneVerified?: boolean;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        isPhoneVerified: data.isPhoneVerified ?? false,
        accountStatus: 'ACTIVE',
      },
    });
  }

  async assignRole(userId: string, roleId: string) {
    return this.prisma.userRole.create({ data: { userId, roleId } });
  }

  async findRoleByName(name: string) {
    return this.prisma.role.findUnique({ where: { name } });
  }

  async updateLoginAttempts(
    userId: string,
    attempts: number,
    lockoutUntil?: Date | null,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { loginAttempts: attempts, lockoutUntil: lockoutUntil ?? null },
    });
  }

  async resetLoginAttempts(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { loginAttempts: 0, lockoutUntil: null, lastLoginAt: new Date() },
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async findRefreshToken(token: string) {
    return this.prisma.refreshToken.findUnique({ where: { token } });
  }
}
