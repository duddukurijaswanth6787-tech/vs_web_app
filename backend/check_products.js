const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL || '' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, barcode: true }
  });
  console.log(JSON.stringify(products, null, 2));
  await prisma.$disconnect();
}

main();
