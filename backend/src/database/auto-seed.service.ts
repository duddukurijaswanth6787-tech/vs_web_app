import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as argon2 from 'argon2';

const SYSTEM_ROLES = [
  {
    name: 'super_admin',
    displayName: 'Super Admin',
    description: 'Full system access',
    scope: 'GLOBAL' as const,
    hierarchy: 100,
    isSystem: true,
  },
  {
    name: 'admin',
    displayName: 'Admin',
    description: 'Administrative access',
    scope: 'GLOBAL' as const,
    hierarchy: 80,
    isSystem: true,
  },
  {
    name: 'staff',
    displayName: 'Staff',
    description: 'Staff member access',
    scope: 'DOMAIN' as const,
    hierarchy: 50,
    isSystem: true,
  },
  {
    name: 'pos_operator',
    displayName: 'POS Operator',
    description: 'Billing counter access only — confined to the standalone Shopora POS screen, no admin console',
    scope: 'DOMAIN' as const,
    hierarchy: 40,
    isSystem: true,
  },
  {
    name: 'customer',
    displayName: 'Customer',
    description: 'Customer access',
    scope: 'CUSTOM' as const,
    hierarchy: 10,
    isSystem: true,
  },
];

// module -> actions. Codes are seeded as "module:action" (e.g. "staff:view").
// Matches the module list already surfaced in shared/identity/permission-groups.ts.
const PERMISSION_MODULES: Record<string, string[]> = {
  dashboard: ['view'],
  users: ['view', 'create', 'update', 'delete'],
  staff: ['view', 'create', 'update', 'delete'],
  products: ['view', 'create', 'update', 'delete'],
  categories: ['view', 'create', 'update', 'delete'],
  brands: ['view', 'create', 'update', 'delete'],
  inventory: ['view', 'update'],
  orders: ['view', 'update'],
  payments: ['view', 'update'],
  reports: ['view', 'export'],
  settings: ['view', 'update'],
  coupons: ['view', 'create', 'update', 'delete'],
  reviews: ['view', 'update'],
  customers: ['view', 'update'],
};

@Injectable()
export class AutoSeedService implements OnModuleInit {
  private readonly logger = new Logger(AutoSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.seedEssentialData();
    } catch (error) {
      this.logger.error(
        'Error auto-seeding essential database records',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async seedEssentialData() {
    this.logger.log('Verifying essential database roles and admin user...');

    // 1. Seed Roles
    for (const role of SYSTEM_ROLES) {
      await this.prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      });
    }

    // 1b. Seed Permission catalog
    for (const [module, actions] of Object.entries(PERMISSION_MODULES)) {
      for (const action of actions) {
        const code = `${module}:${action}`;
        await this.prisma.permission.upsert({
          where: { code },
          update: {},
          create: {
            code,
            name: `${action.charAt(0).toUpperCase()}${action.slice(1)} ${module.charAt(0).toUpperCase()}${module.slice(1)}`,
            module,
            scope: 'MODULE',
          },
        });
      }
    }

    // 2. Seed Super Admin Role & User
    const superAdminRole = await this.prisma.role.findUnique({
      where: { name: 'super_admin' },
    });

    if (!superAdminRole) {
      this.logger.warn('super_admin role missing after role upsert');
      return;
    }

    const ADMIN_EMAILS = Array.from(
      new Set([
        'admin@vasanthi.com',
        'admin@vasanthidesigners.com',
        (process.env.ADMIN_EMAIL || '').toLowerCase().trim(),
      ]),
    ).filter(Boolean);

    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const passwordHash = await argon2.hash(adminPassword);

    for (const email of ADMIN_EMAILS) {
      const adminUser = await this.prisma.user.upsert({
        where: { email },
        update: {
          passwordHash,
          userType: 'ADMIN',
          accountStatus: 'ACTIVE',
          isEmailVerified: true,
          loginAttempts: 0,
          lockoutUntil: null,
        },
        create: {
          email,
          passwordHash,
          firstName: 'Admin',
          lastName: 'User',
          userType: 'ADMIN',
          accountStatus: 'ACTIVE',
          isEmailVerified: true,
          loginAttempts: 0,
        },
      });

      const existingRoleLink = await this.prisma.userRole.findFirst({
        where: { userId: adminUser.id, roleId: superAdminRole.id },
      });

      if (!existingRoleLink) {
        await this.prisma.userRole.create({
          data: {
            userId: adminUser.id,
            roleId: superAdminRole.id,
          },
        });
      }

      this.logger.log(
        `Essential admin user verified/seeded successfully: ${email}`,
      );
    }
    // 4. Seed Essential Categories
    const ethnicWear = await this.prisma.category.upsert({
      where: { slug: 'ethnic-wear' },
      update: {
        name: 'Ethnic Wear',
        isVisible: true,
        status: 'ACTIVE',
        level: 0,
      },
      create: {
        name: 'Ethnic Wear',
        slug: 'ethnic-wear',
        description: 'Women ethnic wear collection',
        level: 0,
        path: 'ethnic-wear',
        displayOrder: 1,
        isFeatured: true,
        isVisible: true,
        isMenuVisible: true,
        status: 'ACTIVE',
      },
    });

    const ESSENTIAL_SUBCATEGORIES = [
      {
        name: 'Kurta Sets',
        slug: 'kurta-sets',
        path: 'ethnic-wear/kurta-sets',
        displayOrder: 1,
      },
      {
        name: 'Sarees',
        slug: 'sarees',
        path: 'ethnic-wear/sarees',
        displayOrder: 2,
      },
      {
        name: 'Lehengas',
        slug: 'lehengas',
        path: 'ethnic-wear/lehengas',
        displayOrder: 3,
      },
      {
        name: 'Kurtis & Suits',
        slug: 'kurtis-suits',
        path: 'ethnic-wear/kurtis-suits',
        displayOrder: 4,
      },
      {
        name: 'Dresses',
        slug: 'dresses',
        path: 'ethnic-wear/dresses',
        displayOrder: 5,
      },
      { name: 'Sale', slug: 'sale', path: 'ethnic-wear/sale', displayOrder: 6 },
    ];

    for (const sub of ESSENTIAL_SUBCATEGORIES) {
      await this.prisma.category.upsert({
        where: { slug: sub.slug },
        update: {
          name: sub.name,
          parentId: ethnicWear.id,
          level: 1,
          isVisible: true,
          status: 'ACTIVE',
        },
        create: {
          name: sub.name,
          slug: sub.slug,
          description: `${sub.name} collection`,
          parentId: ethnicWear.id,
          level: 1,
          path: sub.path,
          displayOrder: sub.displayOrder,
          isFeatured: true,
          isVisible: true,
          isMenuVisible: true,
          status: 'ACTIVE',
        },
      });
    }

    this.logger.log(
      'Essential catalog categories verified/seeded successfully.',
    );

    // 5. Seed Essential Coupons & Offers
    const now = new Date();
    const nextYear = new Date(now.getFullYear() + 1, 11, 31);

    const ESSENTIAL_COUPONS = [
      {
        code: 'WELCOME10',
        name: 'Welcome Offer',
        description: 'Get 10% OFF on your first purchase above ₹1,000.',
        type: 'PERCENTAGE',
        value: 10,
        minOrderAmount: 1000,
        maxDiscountAmount: 500,
        startDate: now,
        endDate: nextYear,
        isActive: true,
      },
      {
        code: 'FESTIVE20',
        name: 'Festive Season Special',
        description: '20% OFF on all Festive Anarkali and Ethnic Kurta Sets.',
        type: 'PERCENTAGE',
        value: 20,
        minOrderAmount: 2500,
        maxDiscountAmount: 1000,
        startDate: now,
        endDate: nextYear,
        isActive: true,
      },
      {
        code: 'FLAT500',
        name: 'Flat ₹500 Savings',
        description: 'Flat ₹500 discount on orders over ₹4,000.',
        type: 'FIXED',
        value: 500,
        minOrderAmount: 4000,
        startDate: now,
        endDate: nextYear,
        isActive: true,
      },
      {
        code: 'VASANTHI15',
        name: "Vasanthi's Signature Special",
        description: '15% OFF on Kanjeevaram Silk Sarees & Bridal Lehengas.',
        type: 'PERCENTAGE',
        value: 15,
        minOrderAmount: 3000,
        maxDiscountAmount: 2000,
        startDate: now,
        endDate: nextYear,
        isActive: true,
      },
    ];

    for (const c of ESSENTIAL_COUPONS) {
      await this.prisma.coupon.upsert({
        where: { code: c.code },
        update: {
          name: c.name,
          description: c.description,
          type: c.type,
          value: c.value,
          minOrderAmount: c.minOrderAmount,
          maxDiscountAmount: c.maxDiscountAmount ?? null,
          startDate: c.startDate,
          endDate: c.endDate,
          isActive: true,
        },
        create: {
          code: c.code,
          name: c.name,
          description: c.description,
          type: c.type,
          value: c.value,
          minOrderAmount: c.minOrderAmount,
          maxDiscountAmount: c.maxDiscountAmount ?? null,
          startDate: c.startDate,
          endDate: c.endDate,
          isActive: true,
        },
      });
    }

    const ESSENTIAL_OFFERS = [
      {
        name: 'Festive Celebration Sale',
        description: 'Enjoy up to 30% OFF on handloomed silk sarees and designer kurta sets.',
        type: 'PERCENTAGE',
        value: 30,
        startDate: now,
        endDate: nextYear,
        isActive: true,
      },
      {
        name: 'Bridal Season Special',
        description: 'Complimentary matching dupatta & flat ₹2,000 OFF on all bridal lehengas.',
        type: 'FIXED',
        value: 2000,
        startDate: now,
        endDate: nextYear,
        isActive: true,
      },
    ];

    for (const off of ESSENTIAL_OFFERS) {
      const existing = await this.prisma.offer.findFirst({ where: { name: off.name } });
      if (!existing) {
        await this.prisma.offer.create({ data: off });
      }
    }

    this.logger.log(
      'Essential coupons & offers verified/seeded successfully.',
    );

    // 6. Seed Essential Products if catalog is empty
    const productCount = await this.prisma.product.count();
    if (productCount === 0) {
      this.logger.log('Catalog empty. Auto-seeding essential products...');

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

      const brand = await this.prisma.brand.upsert({
        where: { slug: 'vasanthis-signature' },
        update: { name: "Vasanthi's Signature", isVisible: true, status: 'ACTIVE' },
        create: {
          name: "Vasanthi's Signature",
          slug: 'vasanthis-signature',
          isVisible: true,
          status: 'ACTIVE',
        },
      });

      const catEthnic = await this.prisma.category.findUnique({ where: { slug: 'ethnic-wear' } });
      const catKurta = await this.prisma.category.findUnique({ where: { slug: 'kurta-sets' } });
      const catSarees = await this.prisma.category.findUnique({ where: { slug: 'sarees' } });
      const catLehengas = await this.prisma.category.findUnique({ where: { slug: 'lehengas' } });

      const PRODUCTS_TO_SEED = [
        {
          sku: 'VAS-KRT-001',
          barcode: '890711718851',
          name: "Women's Floral Printed Anarkali Kurta Set",
          slug: 'women-s-floral-printed-anarkali-kurta-set',
          catId: catKurta?.id || catEthnic?.id,
          basePrice: 3499,
          salePrice: 2499,
          isNewArrival: true,
          isBestSeller: true,
          isFeatured: true,
          hsnCode: '6204',
          bg1: '#800020',
          bg2: '#3D000F',
          desc: 'Elegant floral printed rayon Anarkali kurta set with matching bottom and dupatta.',
        },
        {
          sku: 'VAS-SAR-002',
          barcode: '890711718852',
          name: 'Kanjeevaram Pure Silk Saree with Zari Border',
          slug: 'kanjeevaram-pure-silk-saree-with-zari-border',
          catId: catSarees?.id || catEthnic?.id,
          basePrice: 12999,
          salePrice: 9999,
          isNewArrival: true,
          isBestSeller: true,
          isFeatured: true,
          hsnCode: '5007',
          bg1: '#A4161A',
          bg2: '#4D0A0B',
          desc: 'Handcrafted Kanjeevaram pure silk saree adorned with gold zari weave.',
        },
        {
          sku: 'VAS-LHN-003',
          barcode: '890711718853',
          name: 'Royal Velvet Embroidered Bridal Lehenga Choli',
          slug: 'royal-velvet-embroidered-bridal-lehenga-choli',
          catId: catLehengas?.id || catEthnic?.id,
          basePrice: 24999,
          salePrice: 18999,
          isNewArrival: true,
          isBestSeller: true,
          isFeatured: true,
          hsnCode: '6204',
          bg1: '#7209B7',
          bg2: '#360457',
          desc: 'Heavy velvet lehenga embroidered with zardozi, sequin, and threadwork.',
        },
      ];

      for (const item of PRODUCTS_TO_SEED) {
        const svgUrl = createFashionSvg(item.name.split(' ')[0], "VASANTHI'S SIGNATURE", item.bg1, item.bg2);
        const prod = await this.prisma.product.create({
          data: {
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
            isPublished: true,
            status: 'ACTIVE',
            hsnCode: item.hsnCode,
          },
        });

        if (item.catId) {
          await this.prisma.productCategory.create({
            data: { productId: prod.id, categoryId: item.catId },
          });
        }

        await this.prisma.productMedia.create({
          data: {
            productId: prod.id,
            mediaType: 'IMAGE',
            url: svgUrl,
            thumbnailUrl: svgUrl,
            isPrimary: true,
            displayOrder: 1,
          },
        });

        const vSku = `${item.sku}-M`;
        const variant = await this.prisma.productVariant.create({
          data: {
            productId: prod.id,
            sku: vSku,
            barcode: `${item.barcode}01`,
            title: `${item.name} - M`,
            status: 'ACTIVE',
          },
        });

        await this.prisma.inventory.create({
          data: {
            variantId: variant.id,
            availableQuantity: 50,
          },
        });
      }

      this.logger.log('Essential products auto-seeded successfully.');
    }
  }
}
