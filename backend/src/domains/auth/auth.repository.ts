import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import * as argon2 from 'argon2';

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

  /** Used to make seedAdmin() a bootstrap-only, idempotent no-op once a
   * real admin exists -- this endpoint has no auth guard (it's what creates
   * the very first admin on an empty DB), so anyone able to reach it must
   * never be able to reset an already-provisioned admin's credentials. */
  async hasSuperAdmin(): Promise<boolean> {
    const link = await this.prisma.userRole.findFirst({
      where: { role: { name: 'super_admin' } },
    });
    return !!link;
  }

  async seedAdmin() {
    const SYSTEM_ROLES = [
      {
        name: 'super_admin',
        displayName: 'Super Admin',
        description: 'Full system access',
        scope: 'GLOBAL' as const,
        hierarchy: 100,
        isSystem: true,
      },
      {
        name: 'admin',
        displayName: 'Admin',
        description: 'Administrative access',
        scope: 'GLOBAL' as const,
        hierarchy: 80,
        isSystem: true,
      },
      {
        name: 'staff',
        displayName: 'Staff',
        description: 'Staff member access',
        scope: 'DOMAIN' as const,
        hierarchy: 50,
        isSystem: true,
      },
      {
        name: 'pos_operator',
        displayName: 'POS Operator',
        description:
          'Billing counter access only — confined to the standalone Shopora POS screen, no admin console',
        scope: 'DOMAIN' as const,
        hierarchy: 40,
        isSystem: true,
      },
      {
        name: 'pos_app',
        displayName: 'POS App',
        description:
          'Shopora Mobile POS App operator role for counter sales, billing, barcode scanning, stock intake, and quotations.',
        scope: 'DOMAIN' as const,
        hierarchy: 40,
        isSystem: true,
      },
      {
        name: 'customer',
        displayName: 'Customer',
        description: 'Customer access',
        scope: 'CUSTOM' as const,
        hierarchy: 10,
        isSystem: true,
      },
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

    const ADMIN_EMAILS = Array.from(
      new Set([
        'admin@vasanthi.com',
        'admin@vasanthidesigners.com',
        (process.env.ADMIN_EMAIL || '').toLowerCase().trim(),
      ]),
    ).filter(Boolean);

    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const passwordHash = await argon2.hash(adminPassword);

    for (const email of ADMIN_EMAILS) {
      const adminUser = await this.prisma.user.upsert({
        where: { email },
        update: {
          passwordHash,
          userType: 'ADMIN',
          accountStatus: 'ACTIVE',
          isEmailVerified: true,
          loginAttempts: 0,
          lockoutUntil: null,
        },
        create: {
          email,
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
            data: {
              userId: adminUser.id,
              roleId: superAdminRole.id,
            },
          });
        }
      }
    }

    const ethnicWear = await this.prisma.category.upsert({
      where: { slug: 'ethnic-wear' },
      update: {
        name: 'Ethnic Wear',
        isVisible: true,
        status: 'ACTIVE',
        level: 0,
      },
      create: {
        name: 'Ethnic Wear',
        slug: 'ethnic-wear',
        description: 'Women ethnic wear collection',
        level: 0,
        path: 'ethnic-wear',
        displayOrder: 1,
        isFeatured: true,
        isVisible: true,
        isMenuVisible: true,
        status: 'ACTIVE',
      },
    });

    const ESSENTIAL_SUBCATEGORIES = [
      {
        name: 'Kurta Sets',
        slug: 'kurta-sets',
        path: 'ethnic-wear/kurta-sets',
        displayOrder: 1,
      },
      {
        name: 'Sarees',
        slug: 'sarees',
        path: 'ethnic-wear/sarees',
        displayOrder: 2,
      },
      {
        name: 'Lehengas',
        slug: 'lehengas',
        path: 'ethnic-wear/lehengas',
        displayOrder: 3,
      },
      {
        name: 'Kurtis & Suits',
        slug: 'kurtis-suits',
        path: 'ethnic-wear/kurtis-suits',
        displayOrder: 4,
      },
      {
        name: 'Dresses',
        slug: 'dresses',
        path: 'ethnic-wear/dresses',
        displayOrder: 5,
      },
      { name: 'Sale', slug: 'sale', path: 'ethnic-wear/sale', displayOrder: 6 },
    ];

    for (const sub of ESSENTIAL_SUBCATEGORIES) {
      await this.prisma.category.upsert({
        where: { slug: sub.slug },
        update: {
          name: sub.name,
          parentId: ethnicWear.id,
          level: 1,
          isVisible: true,
          status: 'ACTIVE',
        },
        create: {
          name: sub.name,
          slug: sub.slug,
          description: `${sub.name} collection`,
          parentId: ethnicWear.id,
          level: 1,
          path: sub.path,
          displayOrder: sub.displayOrder,
          isFeatured: true,
          isVisible: true,
          isMenuVisible: true,
          status: 'ACTIVE',
        },
      });
    }

    return {
      email: ADMIN_EMAILS[0],
      seeded: true,
      categoriesSeeded: true,
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
    isEmailVerified?: boolean;
    googleId?: string;
    avatar?: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        isPhoneVerified: data.isPhoneVerified ?? false,
        isEmailVerified: data.isEmailVerified ?? false,
        googleId: data.googleId,
        avatar: data.avatar,
        accountStatus: 'ACTIVE',
      },
    });
  }

  async findByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({
      where: { googleId },
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

  async linkGoogleId(userId: string, googleId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { googleId, isEmailVerified: true },
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
}
