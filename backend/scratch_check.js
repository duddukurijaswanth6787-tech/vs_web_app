const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/vasanthi_designers?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany({
    include: { media: true, categories: { include: { category: true } } }
  });
  console.log(`Total products: ${products.length}`);
  products.forEach(p => {
    console.log(`- Product [${p.id}]: ${p.name} (slug: ${p.slug})`);
    console.log(`  primaryImageUrl: ${p.primaryImageUrl}`);
    p.media.forEach(m => {
      console.log(`  media: ${m.url}`);
    });
  });

  const categories = await prisma.category.findMany();
  console.log(`\nTotal categories: ${categories.length}`);
  categories.forEach(c => {
    console.log(`- Category [${c.id}]: ${c.name} (slug: ${c.slug}, imageUrl: ${c.imageUrl})`);
  });
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
