import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL || '' });
const prisma = new PrismaClient({ adapter });

function createFashionSvg(title: string, subtitle: string, bg1: string, bg2: string, accentColor = '#D4AF37') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bg1}"/>
        <stop offset="100%" stop-color="${bg2}"/>
      </linearGradient>
    </defs>
    <rect width="600" height="600" fill="url(#grad)"/>
    <circle cx="300" cy="300" r="250" fill="none" stroke="${accentColor}" stroke-width="3" opacity="0.4"/>
    <rect x="40" y="40" width="520" height="520" fill="none" stroke="${accentColor}" stroke-width="2" opacity="0.3" rx="16"/>
    <text x="300" y="270" font-family="Georgia, serif" font-size="36" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">${title}</text>
    <text x="300" y="320" font-family="sans-serif" font-size="16" font-weight="600" fill="${accentColor}" text-anchor="middle" letter-spacing="3">${subtitle}</text>
    <line x1="220" y1="350" x2="380" y2="350" stroke="${accentColor}" stroke-width="2" opacity="0.6"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const CATEGORIES_DATA = [
  { name: 'Ethnic Wear', slug: 'ethnic-wear', path: 'ethnic-wear' },
  { name: 'Sarees', slug: 'sarees', path: 'ethnic-wear/sarees' },
  { name: 'Kurta Sets', slug: 'kurta-sets', path: 'ethnic-wear/kurta-sets' },
  { name: 'Lehengas', slug: 'lehengas', path: 'ethnic-wear/lehengas' },
  { name: 'Sharara Sets', slug: 'sharara', path: 'ethnic-wear/sharara' },
  { name: 'Indo Western', slug: 'indo-western', path: 'indo-western' },
  { name: 'Party Wear', slug: 'party-wear', path: 'party-wear' },
  { name: 'Wedding Collection', slug: 'wedding-collection', path: 'wedding-collection' },
  { name: 'Casual Wear', slug: 'casual-wear', path: 'casual-wear' },
  { name: 'Office Wear', slug: 'office-wear', path: 'office-wear' },
];

const SAMPLE_PRODUCTS = [
  {
    sku: 'VAS-KRT-001',
    barcode: '890711718851',
    name: "Women's Floral Printed Anarkali Kurta Set",
    slug: 'women-s-floral-printed-anarkali-kurta-set',
    categorySlugs: ['ethnic-wear', 'kurta-sets'],
    basePrice: 3499,
    salePrice: 2499,
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    isPublished: true,
    hsnCode: '6204',
    badge: 'BESTSELLER',
    bg1: '#800020',
    bg2: '#3D000F',
    desc: 'Elegant floral printed rayon Anarkali kurta set with matching bottom and dupatta. Perfect for festive and casual occasions.',
  },
  {
    sku: 'VAS-SAR-002',
    barcode: '890711718852',
    name: 'Kanjeevaram Pure Silk Saree with Zari Border',
    slug: 'kanjeevaram-pure-silk-saree-with-zari-border',
    categorySlugs: ['ethnic-wear', 'sarees', 'wedding-collection'],
    basePrice: 12999,
    salePrice: 9999,
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    isPublished: true,
    hsnCode: '5007',
    badge: 'LUXURY',
    bg1: '#A4161A',
    bg2: '#4D0A0B',
    desc: 'Handcrafted Kanjeevaram pure silk saree adorned with intricate gold zari weave and matching blouse piece.',
  },
  {
    sku: 'VAS-LHN-003',
    barcode: '890711718853',
    name: 'Royal Velvet Embroidered Bridal Lehenga Choli',
    slug: 'royal-velvet-embroidered-bridal-lehenga-choli',
    categorySlugs: ['ethnic-wear', 'lehengas', 'wedding-collection', 'party-wear'],
    basePrice: 24999,
    salePrice: 18999,
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    isPublished: true,
    hsnCode: '6204',
    badge: 'BRIDAL',
    bg1: '#7209B7',
    bg2: '#360457',
    desc: 'Heavy velvet lehenga embroidered with zardozi, sequin, and threadwork. Comes with dupatta and unstitched blouse.',
  },
  {
    sku: 'VAS-SHR-004',
    barcode: '890711718854',
    name: 'Georgette Mirror Work Sharara Suit Set',
    slug: 'georgette-mirror-work-sharara-suit-set',
    categorySlugs: ['ethnic-wear', 'sharara', 'party-wear'],
    basePrice: 4999,
    salePrice: 3499,
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: true,
    isPublished: true,
    hsnCode: '6204',
    badge: 'NEW',
    bg1: '#9E2A2B',
    bg2: '#4A1212',
    desc: 'Flowy georgette short kurti with heavy mirror-work flared sharara pants and net dupatta.',
  },
  {
    sku: 'VAS-IND-005',
    barcode: '890711718855',
    name: 'Indo-Western Draped Saree Gown with Cape',
    slug: 'indo-western-draped-saree-gown-with-cape',
    categorySlugs: ['indo-western', 'party-wear'],
    basePrice: 7999,
    salePrice: 5999,
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    isPublished: true,
    hsnCode: '6204',
    badge: 'TRENDING',
    bg1: '#0F382C',
    bg2: '#051A14',
    desc: 'Contemporary pre-stitched draped saree gown paired with an embroidered sheer organza cape.',
  },
  {
    sku: 'VAS-KRT-006',
    barcode: '890711718856',
    name: 'Chanderi Silk Straight Kurta with Palazzo',
    slug: 'chanderi-silk-straight-kurta-with-palazzo',
    categorySlugs: ['ethnic-wear', 'kurta-sets', 'office-wear'],
    basePrice: 2999,
    salePrice: 2199,
    isNewArrival: false,
    isBestSeller: true,
    isFeatured: false,
    isPublished: true,
    hsnCode: '6204',
    badge: 'POPULAR',
    bg1: '#2B2D42',
    bg2: '#14151F',
    desc: 'Soft Chanderi silk straight kurti paired with wide palazzo pants and a lightweight organza dupatta.',
  },
  {
    sku: 'VAS-SAR-007',
    barcode: '890711718857',
    name: 'Organza Floral Print Saree with Scallop Border',
    slug: 'organza-floral-print-saree-with-scallop-border',
    categorySlugs: ['ethnic-wear', 'sarees', 'casual-wear'],
    basePrice: 3999,
    salePrice: 2799,
    isNewArrival: true,
    isBestSeller: false,
    isFeatured: true,
    isPublished: true,
    hsnCode: '5007',
    badge: 'ELEGANT',
    bg1: '#C05C46',
    bg2: '#57281D',
    desc: 'Lightweight pastel organza saree featuring digital floral prints and delicate hand-embroidery scallop border.',
  },
  {
    sku: 'VAS-LHN-008',
    barcode: '890711718858',
    name: 'Pastel Pink Net Sequin Lehenga',
    slug: 'pastel-pink-net-sequin-lehenga',
    categorySlugs: ['ethnic-wear', 'lehengas', 'party-wear'],
    basePrice: 15999,
    salePrice: 11999,
    isNewArrival: true,
    isBestSeller: true,
    isFeatured: true,
    isPublished: true,
    hsnCode: '6204',
    badge: 'FEATURED',
    bg1: '#4A154B',
    bg2: '#230924',
    desc: 'Soft pink net lehenga with all-over foil & sequin embroidery, silk lining, and matching designer blouse.',
  },
];

async function main() {
  console.log('Seeding categories...');
  const catMap: Record<string, string> = {};
  for (const cat of CATEGORIES_DATA) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, isVisible: true, status: 'ACTIVE' },
      create: {
        name: cat.name,
        slug: cat.slug,
        path: cat.path,
        description: `${cat.name} collection`,
        isVisible: true,
        isMenuVisible: true,
        isFeatured: true,
        status: 'ACTIVE',
      },
    });
    catMap[cat.slug] = record.id;
  }
  console.log('Cleaning existing products...');
  await prisma.orderItem.deleteMany({}).catch(() => undefined);
  await prisma.shoppingCartItem.deleteMany({}).catch(() => undefined);
  await prisma.wishlistItem.deleteMany({}).catch(() => undefined);
  await prisma.review.deleteMany({}).catch(() => undefined);
  await prisma.productCategory.deleteMany({}).catch(() => undefined);
  await prisma.productMedia.deleteMany({}).catch(() => undefined);
  await prisma.inventoryMovement.deleteMany({}).catch(() => undefined);
  await prisma.inventory.deleteMany({}).catch(() => undefined);
  await prisma.variantWarehouseInventory.deleteMany({}).catch(() => undefined);
  await prisma.productVariant.deleteMany({}).catch(() => undefined);
  await prisma.product.deleteMany({}).catch(() => undefined);

  const brand = await prisma.brand.upsert({
    where: { slug: 'vasanthis-signature' },
    update: { name: "Vasanthi's Signature", isVisible: true, status: 'ACTIVE' },
    create: {
      name: "Vasanthi's Signature",
      slug: 'vasanthis-signature',
      isVisible: true,
      status: 'ACTIVE',
    },
  });

  const warehouse = await prisma.warehouse.findFirst();

  console.log('Seeding catalog products...');
  for (const item of SAMPLE_PRODUCTS) {
    const svgUrl = createFashionSvg(item.name.split(' ')[0] + ' ' + item.name.split(' ')[1], "VASANTHI'S SIGNATURE", item.bg1, item.bg2);

    let product = await prisma.product.findFirst({
      where: { OR: [{ sku: item.sku }, { slug: item.slug }] },
    });
    const productData = {
      sku: item.sku,
      barcode: item.barcode,
      name: item.name,
      slug: item.slug,
      brandId: brand.id,
      basePrice: item.basePrice,
      salePrice: item.salePrice,
      shortDescription: item.desc,
      description: item.desc,
      isNewArrival: item.isNewArrival,
      isBestSeller: item.isBestSeller,
      isFeatured: item.isFeatured,
      isPublished: item.isPublished,
      status: 'ACTIVE',
      hsnCode: item.hsnCode,
    };
    if (product) {
      product = await prisma.product.update({
        where: { id: product.id },
        data: productData,
      });
    } else {
      product = await prisma.product.create({
        data: productData,
      });
    }

    // Link categories
    await prisma.productCategory.deleteMany({ where: { productId: product.id } });
    for (const cSlug of item.categorySlugs) {
      if (catMap[cSlug]) {
        await prisma.productCategory.create({
          data: {
            productId: product.id,
            categoryId: catMap[cSlug],
          },
        });
      }
    }

    // Media
    await prisma.productMedia.deleteMany({ where: { productId: product.id } });
    await prisma.productMedia.create({
      data: {
        productId: product.id,
        mediaType: 'IMAGE',
        url: svgUrl,
        thumbnailUrl: svgUrl,
        isPrimary: true,
        displayOrder: 1,
      },
    });

    // Variants & Inventory
    const variantSku = `${item.sku}-M`;
    const variant = await prisma.productVariant.upsert({
      where: { sku: variantSku },
      update: {
        title: `${item.name} - M`,
        status: 'ACTIVE',
      },
      create: {
        productId: product.id,
        sku: variantSku,
        barcode: `${item.barcode}01`,
        title: `${item.name} - M`,
        status: 'ACTIVE',
      },
    });

    await prisma.inventory.upsert({
      where: { variantId: variant.id },
      update: { availableQuantity: 50 },
      create: {
        variantId: variant.id,
        availableQuantity: 50,
      },
    });

    if (warehouse) {
      await prisma.variantWarehouseInventory.upsert({
        where: {
          warehouseId_variantId: {
            warehouseId: warehouse.id,
            variantId: variant.id,
          },
        },
        update: { availableQuantity: 50 },
        create: {
          warehouseId: warehouse.id,
          variantId: variant.id,
          availableQuantity: 50,
        },
      });
    }

    console.log(`Seeded Product: ${item.name}`);
  }

  console.log('Demo products seed completed successfully!');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
