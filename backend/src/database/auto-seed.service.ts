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
    name: 'pos_operator',
    displayName: 'POS Operator',
    description:
      'Billing counter access only — confined to the standalone Shopora POS screen, no admin console',
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

// module -> actions. Codes are seeded as "module:action" (e.g. "staff:view").
// Matches the module list already surfaced in shared/identity/permission-groups.ts.
const PERMISSION_MODULES: Record<string, string[]> = {
  dashboard: ['view'],
  users: ['view', 'create', 'update', 'delete'],
  staff: ['view', 'create', 'update', 'delete'],
  products: ['view', 'create', 'update', 'delete'],
  categories: ['view', 'create', 'update', 'delete'],
  brands: ['view', 'create', 'update', 'delete'],
  inventory: ['view', 'update'],
  orders: ['view', 'update'],
  payments: ['view', 'update'],
  reports: ['view', 'export'],
  settings: ['view', 'update'],
  coupons: ['view', 'create', 'update', 'delete'],
  reviews: ['view', 'update'],
  customers: ['view', 'update'],
  pos: ['view'],
};

@Injectable()
export class AutoSeedService implements OnModuleInit {
  private readonly logger = new Logger(AutoSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.prisma.$executeRawUnsafe(
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS "facebookId" TEXT;',
      );
      await this.prisma.$executeRawUnsafe(
        'ALTER TABLE users ADD COLUMN IF NOT EXISTS "appleId" TEXT;',
      );
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS testimonials (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          name TEXT NOT NULL,
          title TEXT,
          location TEXT,
          rating INTEGER NOT NULL DEFAULT 5,
          content TEXT NOT NULL,
          avatarUrl TEXT,
          isFeatured BOOLEAN NOT NULL DEFAULT false,
          displayOrder INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'ACTIVE',
          createdBy TEXT,
          updatedBy TEXT,
          createdAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          deletedAt TIMESTAMP(3)
        );
      `);
    } catch {
      // ignore DDL errors if column/table exists or role is unprivileged
    }
    await this.seedEssentialData();
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

    // 1b. Seed Permission catalog
    for (const [module, actions] of Object.entries(PERMISSION_MODULES)) {
      for (const action of actions) {
        const code = `${module}:${action}`;
        await this.prisma.permission.upsert({
          where: { code },
          update: {},
          create: {
            code,
            name: `${action.charAt(0).toUpperCase()}${action.slice(1)} ${module.charAt(0).toUpperCase()}${module.slice(1)}`,
            module,
            scope: 'MODULE',
          },
        });
      }
    }

    // 2. Seed Super Admin Role & User
    const superAdminRole = await this.prisma.role.findUnique({
      where: { name: 'super_admin' },
    });

    if (!superAdminRole) {
      this.logger.warn('super_admin role missing after role upsert');
      return;
    }

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
        `Essential admin user verified/seeded successfully: ${email}`,
      );
    }

    // 3. Seed admin-configurable session length settings, once. Only
    // `create` on first run -- `update: {}` deliberately touches nothing on
    // later restarts, so an admin's change via Admin > Settings survives a
    // redeploy instead of being reset back to this default every boot.
    const sessionSettings: { key: string; value: string; description: string }[] = [
      {
        key: 'security.sessionExpiryMinutes',
        value: '15',
        description: 'How long a normal login session stays valid, in minutes, before the user must sign in again.',
      },
      {
        key: 'security.rememberMeExpiryDays',
        value: '30',
        description: 'How long a "Remember Me" login session stays valid, in days.',
      },
    ];
    for (const s of sessionSettings) {
      await this.prisma.appSetting.upsert({
        where: { key: s.key },
        update: {},
        create: {
          key: s.key,
          value: s.value,
          type: 'NUMBER',
          group: 'security',
          description: s.description,
        },
      });
    }

    // 4. Seed Demo Customer Account
    const custPassword = await argon2.hash('Customer@123');
    for (const custEmail of ['customer@vasanthi.com', 'customer@vasanthidesigners.com']) {
      await this.prisma.user.upsert({
        where: { email: custEmail },
        update: {
          passwordHash: custPassword,
          userType: 'CUSTOMER',
          accountStatus: 'ACTIVE',
          isEmailVerified: true,
          loginAttempts: 0,
          lockoutUntil: null,
        },
        create: {
          email: custEmail,
          passwordHash: custPassword,
          firstName: 'Anjali',
          lastName: 'Sharma',
          userType: 'CUSTOMER',
          accountStatus: 'ACTIVE',
          isEmailVerified: true,
          loginAttempts: 0,
        },
      });
    }
    this.logger.log('Essential security roles, permissions and admin users initialized.');
  }
}
