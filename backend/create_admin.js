const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

async function createAdmin() {
  const prisma = new PrismaClient();
  
  // Hash password
  const passwordHash = await argon2.hash('Admin@123');
  
  // Find admin role
  const adminRole = await prisma.role.findUnique({ where: { name: 'super_admin' } });
  
  if (!adminRole) {
    console.error('Admin role not found!');
    process.exit(1);
  }

  // Create Admin
  const admin = await prisma.user.create({
    data: {
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

  console.log('Admin user created:', admin.email);
  await prisma.$disconnect();
}

createAdmin();
