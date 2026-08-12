import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as argon2 from 'argon2';

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
    name: 'customer',
    displayName: 'Customer',
    description: 'Customer access',
    scope: 'CUSTOM' as const,
    hierarchy: 10,
    isSystem: true,
  },
];

@Injectable()
export class AutoSeedService implements OnModuleInit {
  private readonly logger = new Logger(AutoSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.seedEssentialData();
    } catch (error) {
      this.logger.error(
        'Error auto-seeding essential database records',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async seedEssentialData() {
    this.logger.log('Verifying essential database roles and admin user...');

    // 1. Seed Roles
    for (const role of SYSTEM_ROLES) {
      await this.prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      });
    }

    // 2. Seed Super Admin Role & User
    const superAdminRole = await this.prisma.role.findUnique({
      where: { name: 'super_admin' },
    });

    if (!superAdminRole) {
      this.logger.warn('super_admin role missing after role upsert');
      return;
    }

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@vasanthi.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const passwordHash = await argon2.hash(adminPassword);

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

    // 3. Ensure role link exists
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

    this.logger.log(
      `Essential admin user verified/seeded successfully: ${adminEmail}`,
    );
  }
}
