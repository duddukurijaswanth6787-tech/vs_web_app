const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/vasanthi_designers?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const IMAGES = [
  'http://localhost:4000/api/v1/storage/products/50890861-0fb4-4b93-91b2-231422e0fa49/images/7027e0e8-0450-4a09-84a0-e76f84c88935.png',
  'http://localhost:4000/api/v1/storage/products/50890861-0fb4-4b93-91b2-231422e0fa49/images/959a62d3-06e3-47a5-8691-2aaf901ec776.png',
  'http://localhost:4000/api/v1/storage/products/50890861-0fb4-4b93-91b2-231422e0fa49/images/a281f7bd-0cea-4756-afeb-9d95ee281042.png',
  'http://localhost:4000/api/v1/storage/products/50890861-0fb4-4b93-91b2-231422e0fa49/images/bf440116-b297-4648-9296-639f6ebfba53.png',
  'http://localhost:4000/api/v1/storage/products/50890861-0fb4-4b93-91b2-231422e0fa49/images/9911e693-c306-4bd0-a308-9a6372ebfd07.png',
  'http://localhost:4000/api/v1/storage/products/50890861-0fb4-4b93-91b2-231422e0fa49/images/9a043b4f-33a6-4dad-81ca-a8175c87a358.png',
];

async function main() {
  const categories = await prisma.category.findMany();
  for (let i = 0; i < categories.length; i++) {
    const img = IMAGES[i % IMAGES.length];
    await prisma.category.update({
      where: { id: categories[i].id },
      data: { image: img }
    });
  }
  console.log(`Updated ${categories.length} categories with valid image URLs in database!`);
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
