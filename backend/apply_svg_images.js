const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/vasanthi_designers?schema=public' });
const prisma = new PrismaClient({ adapter });

function createFashionSvg(title, subtitle, bg1, bg2, accentColor = '#D4AF37', isCircle = false) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}"/>
        <stop offset="100%" stop-color="${bg2}"/>
      </linearGradient>
    </defs>
    <rect width="600" height="600" fill="url(#grad)"/>
    ${isCircle ? `<circle cx="300" cy="300" r="260" fill="none" stroke="${accentColor}" stroke-width="4" opacity="0.5"/>` : ''}
    <rect x="40" y="40" width="520" height="520" fill="none" stroke="${accentColor}" stroke-width="2" opacity="0.4" rx="16"/>
    <text x="300" y="270" font-family="Georgia, serif" font-size="42" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">${title}</text>
    <text x="300" y="320" font-family="sans-serif" font-size="18" font-weight="600" fill="${accentColor}" text-anchor="middle" letter-spacing="4">${subtitle}</text>
    <line x1="220" y1="350" x2="380" y2="350" stroke="${accentColor}" stroke-width="2" opacity="0.6"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const CATEGORY_STYLE_MAP = {
  'indo-western': { title: 'Indo Western', subtitle: 'LUXURY FUSION', bg1: '#800020', bg2: '#3A000E' },
  'party-wear': { title: 'Party Wear', subtitle: 'EVENING GOWNS', bg1: '#0F382C', bg2: '#051A14' },
  'kurta-sets': { title: 'Kurta Sets', subtitle: 'ANARKALI & SUITS', bg1: '#9E2A2B', bg2: '#4A1212' },
  'ethnic-wear': { title: 'Ethnic Wear', subtitle: 'HERITAGE WEAVE', bg1: '#1B263B', bg2: '#0D131D' },
  'western-wear': { title: 'Western Wear', subtitle: 'MODERN DESIGNS', bg1: '#4A154B', bg2: '#230924' },
  'sarees': { title: 'Sarees', subtitle: 'SILK & SILHOUETTES', bg1: '#A4161A', bg2: '#4D0A0B' },
  'lehengas': { title: 'Lehengas', subtitle: 'BRIDAL & COUTURE', bg1: '#7209B7', bg2: '#360457' },
  'office-wear': { title: 'Office Wear', subtitle: 'WORK ETHNIC', bg1: '#2B2D42', bg2: '#14151F' },
  'casual-wear': { title: 'Casual Wear', subtitle: 'EVERYDAY COTTONS', bg1: '#C05C46', bg2: '#57281D' },
  'wedding-collection': { title: 'Wedding Collection', subtitle: 'ROYAL BRIDAL', bg1: '#800020', bg2: '#200008' },
};

async function main() {
  await prisma.$connect();
  console.log('Applying high-resolution SVG data URIs to categories and products...');

  const categories = await prisma.category.findMany({});
  for (const cat of categories) {
    const config = CATEGORY_STYLE_MAP[cat.slug] || {
      title: cat.name,
      subtitle: 'VASANTHI DESIGNERS',
      bg1: '#800020',
      bg2: '#3D000F',
    };
    const svgData = createFashionSvg(config.title, config.subtitle, config.bg1, config.bg2, '#D4AF37', true);

    await prisma.category.update({
      where: { id: cat.id },
      data: {
        image: svgData,
        bannerImage: svgData,
        icon: svgData,
        isFeatured: true,
        isVisible: true,
      },
    });
    console.log(`Updated Category: ${cat.name}`);
  }

  const products = await prisma.product.findMany({ include: { media: true } });
  for (const prod of products) {
    const prodSvg = createFashionSvg(prod.name, 'VASANTHI DESIGNERS', '#800020', '#3D000F', '#FFD700', false);

    if (prod.media.length > 0) {
      for (const m of prod.media) {
        await prisma.productMedia.update({
          where: { id: m.id },
          data: { url: prodSvg, thumbnailUrl: prodSvg, isPrimary: true },
        });
      }
    } else {
      await prisma.productMedia.create({
        data: {
          productId: prod.id,
          mediaType: 'IMAGE',
          url: prodSvg,
          thumbnailUrl: prodSvg,
          isPrimary: true,
          displayOrder: 1,
        },
      });
    }
    console.log(`Updated Product: ${prod.name}`);
  }

  console.log('Successfully updated all database images to SVG Data URIs!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
