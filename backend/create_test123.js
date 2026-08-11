const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const argon2 = require('argon2');

async function createTest123User() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vasanthi_designers?schema=public';
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  // Hash password 'test123'
  const passwordHash = await argon2.hash('test123');

  // Upsert pos_operator role
  const posRole = await prisma.role.upsert({
    where: { name: 'pos_operator' },
    update: {
      displayName: 'POS Operator',
      description: 'Access restricted to POS billing and label printer operations only',
    },
    create: {
      name: 'pos_operator',
      displayName: 'POS Operator',
      description: 'Access restricted to POS billing and label printer operations only',
      scope: 'DOMAIN',
      hierarchy: 30,
      isSystem: true,
      isActive: true,
    },
  });

  // Find user test123 if exists
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'test123@vasanthi.com' },
        { email: 'test123' },
      ],
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'test123@vasanthi.com',
        passwordHash: passwordHash,
        firstName: 'Test',
        lastName: '123',
        userType: 'STAFF',
        accountStatus: 'ACTIVE',
        isEmailVerified: true,
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: passwordHash,
        accountStatus: 'ACTIVE',
        isEmailVerified: true,
        userType: 'STAFF',
      },
    });
  }

  // Remove previous userRoles and set strictly to pos_operator
  await prisma.userRole.deleteMany({
    where: { userId: user.id },
  });

  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: posRole.id,
    },
  });

  console.log('✅ User test123 successfully updated with POS Operator role:');
  console.log('Email:', user.email);
  console.log('Password: test123');
  console.log('User Type:', user.userType);
  console.log('Role:', posRole.name);

  await prisma.$disconnect();
}

createTest123User().catch((err) => {
  console.error('❌ Error updating test123 user:', err);
  process.exit(1);
});
