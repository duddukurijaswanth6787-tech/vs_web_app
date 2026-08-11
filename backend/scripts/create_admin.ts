import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

async function createAdmin() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || '' });
  const prisma = new PrismaClient({ adapter });
  
  const passwordHash = await argon2.hash('Admin@123');
  
  const adminRole = await prisma.role.findUnique({ where: { name: 'super_admin' } });
  
  if (!adminRole) {
    console.error('Admin role not found!');
    process.exit(1);
  }

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vasanthi.com' },
    update: { passwordHash: passwordHash },
    create: {
      email: 'admin@vasanthi.com',
      passwordHash: passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      userType: 'ADMIN',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
      userRoles: {
        create: { roleId: adminRole.id }
      }
    }
  });

  console.log('Admin user upserted:', admin.email);
  await prisma.$disconnect();
}

createAdmin().catch(console.error);
