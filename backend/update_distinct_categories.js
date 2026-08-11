const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/vasanthi_designers?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const CATEGORY_IMAGES = {
  'party-wear': 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=500&auto=format&fit=crop&q=80',
  'indo-western': 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=80',
  'kurta-sets': 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&auto=format&fit=crop&q=80',
  'ethnic-wear': 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500&auto=format&fit=crop&q=80',
  'sarees': 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=500&auto=format&fit=crop&q=80',
  'western-wear': 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&auto=format&fit=crop&q=80',
  'lehengas': 'https://images.unsplash.com/photo-1610030469668-98e550d6193c?w=500&auto=format&fit=crop&q=80',
  'office-wear': 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&auto=format&fit=crop&q=80',
  'casual-wear': 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&auto=format&fit=crop&q=80',
  'wedding-collection': 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=500&auto=format&fit=crop&q=80',
  'festive-collection': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&auto=format&fit=crop&q=80',
  'plus-size': 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&auto=format&fit=crop&q=80',
  'summer-collection': 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&auto=format&fit=crop&q=80',
  'winter-collection': 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&auto=format&fit=crop&q=80',
};

async function main() {
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    const imgUrl = CATEGORY_IMAGES[cat.slug] || CATEGORY_IMAGES['ethnic-wear'];
    await prisma.category.update({
      where: { id: cat.id },
      data: { image: imgUrl }
    });
    console.log(`Updated category [${cat.name}] -> ${imgUrl}`);
  }
  console.log('All categories updated with distinct fashion images!');
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
  await pool.end();
});
