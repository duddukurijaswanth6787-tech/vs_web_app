const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const argon2 = require('argon2');

async function createAdmin() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vasanthi_designers?schema=public';
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });
  // Hash password
  const passwordHash = await argon2.hash('Admin@123');
  
  // Find admin role
  const adminRole = await prisma.role.findUnique({ where: { name: 'super_admin' } });
  
  if (!adminRole) {
    console.error('Admin role "super_admin" not found in DB! Check roles table.');
    process.exit(1);
  }

  // Upsert Admin (Use email as unique constraint)
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
        create: {
          roleId: adminRole.id
        }
      }
    }
  });

  console.log('Admin user upserted:', admin.email);
  await prisma.$disconnect();
}

createAdmin().catch(console.error);
