import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || '' });
const prisma = new PrismaClient({ adapter });

const SYSTEM_ROLES = [
  { name: 'super_admin', displayName: 'Super Admin', description: 'Full system access', scope: 'GLOBAL' as const, hierarchy: 100, isSystem: true },
  { name: 'admin', displayName: 'Admin', description: 'Administrative access', scope: 'GLOBAL' as const, hierarchy: 80, isSystem: true },
  { name: 'staff', displayName: 'Staff', description: 'Staff member access', scope: 'DOMAIN' as const, hierarchy: 50, isSystem: true },
  { name: 'customer', displayName: 'Customer', description: 'Customer access', scope: 'CUSTOM' as const, hierarchy: 10, isSystem: true },
];

async function main() {
  console.log('Seeding system settings...');
  await prisma.systemSetting.upsert({
    where: { key: 'platform_name' },
    update: {},
    create: { key: 'platform_name', value: 'Vasanthi Designers' },
  });

  console.log('Seeding system roles...');
  for (const role of SYSTEM_ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
