const initialDbUrl = process.env.DATABASE_URL;
import 'dotenv/config';
if (initialDbUrl) {
  process.env.DATABASE_URL = initialDbUrl;
}
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SYSTEM_ROLES = [
  { name: 'super_admin', displayName: 'Super Admin', description: 'Full system access', scope: 'GLOBAL' as const, hierarchy: 100, isSystem: true },
  { name: 'admin', displayName: 'Admin', description: 'Administrative access', scope: 'GLOBAL' as const, hierarchy: 80, isSystem: true },
  { name: 'staff', displayName: 'Staff', description: 'Staff member access', scope: 'DOMAIN' as const, hierarchy: 50, isSystem: true },
  { name: 'pos_operator', displayName: 'POS Operator', description: 'Billing counter access only — confined to the standalone Shopora POS screen, no admin console', scope: 'DOMAIN' as const, hierarchy: 40, isSystem: true },
  { name: 'pos_app', displayName: 'POS App', description: 'Shopora Mobile POS App operator role for counter sales, billing, barcode scanning, stock intake, and quotations.', scope: 'DOMAIN' as const, hierarchy: 40, isSystem: true },
  { name: 'customer', displayName: 'Customer', description: 'Customer access', scope: 'CUSTOM' as const, hierarchy: 10, isSystem: true },
];

async function main() {
  console.log('Seeding system settings...');
  await prisma.systemSetting.upsert({
    where: { key: 'platform_name' },
    update: {},
    create: { key: 'platform_name', value: "Vasanthi's Signature" },
  });

  console.log('Seeding system roles...');
  for (const role of SYSTEM_ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  // ---------------------------------------------------------------------------
  // Storefront Management – seed defaults
  // ---------------------------------------------------------------------------
  console.log('Seeding website settings...');
  await prisma.websiteSetting.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      storeName: "Vasanthi's Signature",
      storeDescription: 'Premium luxury ethnic wear and lifestyle store',
      supportPhone: '+91 98765 43210',
      supportEmail: 'care@vasanthissignature.in',
      supportHours: 'Mon–Sat, 10:00 AM – 7:00 PM IST',
      copyrightText: `© ${new Date().getFullYear()} Vasanthi's Signature. All rights reserved.`,
      maintenanceMode: false,
    },
  });

  const sizeGuideHtml = `
<h2>Women Ethnic Wear Measurement Guide</h2>
<p>Use this chart to find your perfect fit. Measurements are in inches.</p>
<table style="width:100%;border-collapse:collapse;text-align:center;font-size:12px">
  <thead>
    <tr style="background:#fff1f2;color:#0284c7">
      <th style="border:1px solid #fecdd3;padding:8px">Size</th>
      <th style="border:1px solid #fecdd3;padding:8px">Bust</th>
      <th style="border:1px solid #fecdd3;padding:8px">Waist</th>
      <th style="border:1px solid #fecdd3;padding:8px">Hip</th>
    </tr>
  </thead>
  <tbody>
    <tr><td style="border:1px solid #e5e5e5;padding:8px;font-weight:700">S</td><td style="border:1px solid #e5e5e5;padding:8px">34"</td><td style="border:1px solid #e5e5e5;padding:8px">28"</td><td style="border:1px solid #e5e5e5;padding:8px">36"</td></tr>
    <tr><td style="border:1px solid #e5e5e5;padding:8px;font-weight:700">M</td><td style="border:1px solid #e5e5e5;padding:8px">36"</td><td style="border:1px solid #e5e5e5;padding:8px">30"</td><td style="border:1px solid #e5e5e5;padding:8px">38"</td></tr>
    <tr><td style="border:1px solid #e5e5e5;padding:8px;font-weight:700">L</td><td style="border:1px solid #e5e5e5;padding:8px">38"</td><td style="border:1px solid #e5e5e5;padding:8px">32"</td><td style="border:1px solid #e5e5e5;padding:8px">40"</td></tr>
    <tr><td style="border:1px solid #e5e5e5;padding:8px;font-weight:700">XL</td><td style="border:1px solid #e5e5e5;padding:8px">40"</td><td style="border:1px solid #e5e5e5;padding:8px">34"</td><td style="border:1px solid #e5e5e5;padding:8px">42"</td></tr>
  </tbody>
</table>
<p><em>Tip: If you are between sizes, we recommend sizing up for comfort in ethnic wear.</em></p>
`.trim();

  console.log('Seeding CMS size-guide page...');
  await prisma.cmsPage.upsert({
    where: { slug: 'size-guide' },
    update: {
      title: 'Size & Measurement Guide',
      content: sizeGuideHtml,
      status: 'PUBLISHED',
      metaTitle: 'Size Guide | Vasanthi Designers',
      metaDescription: 'Women ethnic wear size and measurement chart',
    },
    create: {
      title: 'Size & Measurement Guide',
      slug: 'size-guide',
      content: sizeGuideHtml,
      status: 'PUBLISHED',
      metaTitle: 'Size Guide | Vasanthi Designers',
      metaDescription: 'Women ethnic wear size and measurement chart',
    },
  });

  const homepageSections = [
    { key: 'hero_banner', title: 'Hero Banner', displayOrder: 1, enabled: true },
    { key: 'announcement_bar', title: 'Announcement Bar', displayOrder: 2, enabled: true },
    { key: 'categories', title: 'Categories', displayOrder: 3, enabled: true },
    { key: 'featured_categories', title: 'Featured Categories', displayOrder: 4, enabled: true },
    { key: 'new_arrivals', title: 'New Arrivals', displayOrder: 5, enabled: true },
    { key: 'best_sellers', title: 'Best Sellers', displayOrder: 6, enabled: true },
    { key: 'featured_products', title: 'Featured Products', displayOrder: 7, enabled: true },
    { key: 'flash_sale', title: 'Flash Sale', displayOrder: 8, enabled: false },
    { key: 'offers', title: 'Offers', displayOrder: 9, enabled: true },
    { key: 'collections', title: 'Season Collections', displayOrder: 10, enabled: true },
    { key: 'shop_by_occasion', title: 'Shop by Occasion', displayOrder: 11, enabled: false },
    { key: 'customer_reviews', title: 'Customer Reviews', displayOrder: 12, enabled: true },
    { key: 'why_choose_us', title: 'Why Choose Us', displayOrder: 13, enabled: true },
    { key: 'brands', title: 'Brand Logos', displayOrder: 14, enabled: true },
    { key: 'newsletter', title: 'Newsletter Signup', displayOrder: 15, enabled: true },
    { key: 'faq', title: 'FAQ', displayOrder: 16, enabled: false },
  ];

  console.log('Seeding homepage sections...');
  for (const section of homepageSections) {
    await prisma.homepageSection.upsert({
      where: { key: section.key },
      update: {},
      create: section,
    });
  }

  const socialPlatforms = [
    { platform: 'FACEBOOK' as const, title: 'Facebook', url: '#', displayOrder: 1 },
    { platform: 'INSTAGRAM' as const, title: 'Instagram', url: '#', displayOrder: 2 },
    { platform: 'YOUTUBE' as const, title: 'YouTube', url: '#', displayOrder: 3 },
    { platform: 'PINTEREST' as const, title: 'Pinterest', url: '#', displayOrder: 4 },
    { platform: 'TWITTER' as const, title: 'Twitter', url: '#', displayOrder: 5 },
    { platform: 'WHATSAPP' as const, title: 'WhatsApp', url: '#', displayOrder: 6 },
  ];

  console.log('Seeding social links...');
  for (const link of socialPlatforms) {
    await prisma.socialLink.upsert({
      where: { platform: link.platform },
      update: {},
      create: link,
    });
  }

  const footerSections = [
    { key: 'company', title: 'Company', displayOrder: 1 },
    { key: 'customer_service', title: 'Customer Service', displayOrder: 2 },
    { key: 'policies', title: 'Policies', displayOrder: 3 },
    { key: 'categories', title: 'Categories', displayOrder: 4 },
    { key: 'follow_us', title: 'Follow Us', displayOrder: 5 },
    { key: 'contact', title: 'Contact', displayOrder: 6 },
  ];

  console.log('Seeding footer sections...');
  for (const section of footerSections) {
    await prisma.footerSection.upsert({
      where: { key: section.key },
      update: {},
      create: section,
    });
  }

  const featureToggles = [
    { key: 'wishlist', name: 'Wishlist', description: 'Allow customers to save products to wishlist', category: 'CUSTOMER' as const, enabled: true },
    { key: 'cart', name: 'Shopping Cart', description: 'Enable shopping cart functionality', category: 'CHECKOUT' as const, enabled: true },
    { key: 'guest_cart', name: 'Guest Cart', description: 'Allow guest users to add items to cart', category: 'CHECKOUT' as const, enabled: true },
    { key: 'checkout', name: 'Checkout', description: 'Enable checkout process', category: 'CHECKOUT' as const, enabled: true },
    { key: 'coupon', name: 'Coupon Codes', description: 'Allow coupon code usage at checkout', category: 'CHECKOUT' as const, enabled: true },
    { key: 'wallet', name: 'Wallet', description: 'Enable customer wallet feature', category: 'CUSTOMER' as const, enabled: true },
    { key: 'returns', name: 'Returns', description: 'Allow customers to request returns', category: 'CUSTOMER' as const, enabled: true },
    { key: 'refunds', name: 'Refunds', description: 'Enable refund processing', category: 'CUSTOMER' as const, enabled: true },
    { key: 'reviews', name: 'Reviews', description: 'Allow customers to write product reviews', category: 'PRODUCT' as const, enabled: true },
    { key: 'ratings', name: 'Ratings', description: 'Allow customers to rate products', category: 'PRODUCT' as const, enabled: true },
    { key: 'notifications', name: 'Notifications', description: 'Enable in-app notifications', category: 'CUSTOMER' as const, enabled: true },
    { key: 'support', name: 'Support Tickets', description: 'Enable customer support ticket system', category: 'CUSTOMER' as const, enabled: true },
    { key: 'ai_chat', name: 'AI Chat Assistant', description: 'Enable AI-powered chat assistant', category: 'AI' as const, enabled: true },
    { key: 'search', name: 'Search', description: 'Enable product search', category: 'SEARCH' as const, enabled: true },
    { key: 'search_suggestions', name: 'Search Suggestions', description: 'Show autocomplete suggestions in search', category: 'SEARCH' as const, enabled: true },
    { key: 'product_share', name: 'Product Share', description: 'Allow sharing product links', category: 'PRODUCT' as const, enabled: true },
    { key: 'quick_view', name: 'Quick View', description: 'Enable quick product view modal', category: 'PRODUCT' as const, enabled: true },
    { key: 'related_products', name: 'Related Products', description: 'Show related products on product page', category: 'PRODUCT' as const, enabled: true },
    { key: 'newsletter', name: 'Newsletter', description: 'Enable newsletter subscription', category: 'MARKETING' as const, enabled: true },
    { key: 'social_feed', name: 'Social Feed', description: 'Display social media feed on homepage', category: 'SOCIAL' as const, enabled: true },
    // Super-admin controlled: off by default until explicitly enabled for customer storefront
    { key: 'loyalty', name: 'Loyalty Points', description: 'Show loyalty points on customer side when enabled by super admin', category: 'CUSTOMER' as const, enabled: false },
    { key: 'referral', name: 'Referral Program', description: 'Show referral program on customer side when enabled by super admin', category: 'MARKETING' as const, enabled: false },
    { key: 'gift_cards', name: 'Gift Cards', description: 'Enable gift card purchase and redeem', category: 'CUSTOMER' as const, enabled: true },
    { key: 'recently_viewed', name: 'Recently Viewed', description: 'Track and show recently viewed products', category: 'PRODUCT' as const, enabled: true },
    { key: 'otp_login', name: 'OTP Login', description: 'Allow customers to login with phone OTP', category: 'CUSTOMER' as const, enabled: true },
  ];

  console.log('Seeding feature toggles...');
  for (const toggle of featureToggles) {
    await prisma.featureToggle.upsert({
      where: { key: toggle.key },
      update: {},
      create: toggle,
    });
  }

  // ---------------------------------------------------------------------------
  // Women's ethnic wear catalog – clean + seed attributes / categories / brand
  // ---------------------------------------------------------------------------
  await prisma.orderTimeline.deleteMany({}).catch(() => undefined);
  await prisma.orderItem.deleteMany({}).catch(() => undefined);
  await prisma.order.deleteMany({}).catch(() => undefined);
  await prisma.shoppingCartItem.deleteMany({}).catch(() => undefined);
  await prisma.shoppingCart.deleteMany({}).catch(() => undefined);
  await prisma.wishlistItem.deleteMany({}).catch(() => undefined);
  await prisma.wishlist.deleteMany({}).catch(() => undefined);
  await prisma.review.deleteMany({}).catch(() => undefined);
  await prisma.inventoryMovement.deleteMany({}).catch(() => undefined);
  await prisma.inventory.deleteMany({}).catch(() => undefined);
  await prisma.variantWarehouseInventory.deleteMany({}).catch(() => undefined);
  await prisma.productMedia.deleteMany({}).catch(() => undefined);
  await prisma.productAttribute.deleteMany({}).catch(() => undefined);
  await prisma.productCategory.deleteMany({}).catch(() => undefined);
  await prisma.productRelatedProduct.deleteMany({}).catch(() => undefined);
  await prisma.productVariant.deleteMany({}).catch(() => undefined);
  await prisma.product.deleteMany({}).catch(() => undefined);
  await prisma.categoryAttribute.deleteMany({}).catch(() => undefined);
  await prisma.attributeOption.deleteMany({}).catch(() => undefined);
  await prisma.attribute.deleteMany({}).catch(() => undefined);
  await prisma.attributeGroup.deleteMany({}).catch(() => undefined);

  console.log("Seeding brand Vasanthi's Signature...");
  const brand = await prisma.brand.upsert({
    where: { slug: 'vasanthis-signature' },
    update: { name: "Vasanthi's Signature", isVisible: true, status: 'ACTIVE' },
    create: {
      name: "Vasanthi's Signature",
      slug: 'vasanthis-signature',
      description: 'Premium ethnic wear for women',
      isFeatured: true,
      isVisible: true,
      status: 'ACTIVE',
    },
  });

  console.log('Seeding Ethnic Wear categories...');
  const ethnicWear = await prisma.category.upsert({
    where: { slug: 'ethnic-wear' },
    update: { name: 'Ethnic Wear', isVisible: true, status: 'ACTIVE', level: 0 },
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

  const kurtaSets = await prisma.category.upsert({
    where: { slug: 'kurta-sets' },
    update: {
      name: 'Kurta Sets',
      parentId: ethnicWear.id,
      level: 1,
      isVisible: true,
      status: 'ACTIVE',
    },
    create: {
      name: 'Kurta Sets',
      slug: 'kurta-sets',
      description: 'Kurta sets with bottom and dupatta',
      parentId: ethnicWear.id,
      level: 1,
      path: 'ethnic-wear/kurta-sets',
      displayOrder: 1,
      isFeatured: true,
      isVisible: true,
      isMenuVisible: true,
      status: 'ACTIVE',
    },
  });

  await prisma.category.upsert({
    where: { slug: 'sarees' },
    update: { parentId: ethnicWear.id, level: 1, status: 'ACTIVE' },
    create: {
      name: 'Sarees',
      slug: 'sarees',
      parentId: ethnicWear.id,
      level: 1,
      path: 'ethnic-wear/sarees',
      displayOrder: 2,
      isVisible: true,
      isMenuVisible: true,
      status: 'ACTIVE',
    },
  });

  await prisma.category.upsert({
    where: { slug: 'lehengas' },
    update: { parentId: ethnicWear.id, level: 1, status: 'ACTIVE' },
    create: {
      name: 'Lehengas',
      slug: 'lehengas',
      parentId: ethnicWear.id,
      level: 1,
      path: 'ethnic-wear/lehengas',
      displayOrder: 3,
      isVisible: true,
      isMenuVisible: true,
      status: 'ACTIVE',
    },
  });

  console.log('Seeding Hyderabad warehouse...');
  await prisma.warehouse.upsert({
    where: { code: 'HYD-01' },
    update: { name: 'Hyderabad Warehouse', status: 'ACTIVE', isDefault: true },
    create: {
      code: 'HYD-01',
      name: 'Hyderabad Warehouse',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      isDefault: true,
      status: 'ACTIVE',
    },
  }).catch(async () => {
    const existing = await prisma.warehouse.findFirst({ where: { code: 'HYD-01' } });
    if (!existing) {
      await prisma.warehouse.create({
        data: {
          code: 'HYD-01',
          name: 'Hyderabad Warehouse',
          city: 'Hyderabad',
          state: 'Telangana',
          country: 'India',
          isDefault: true,
          status: 'ACTIVE',
        },
      });
    }
  });

  async function upsertGroup(name: string, slug: string, order: number) {
    return prisma.attributeGroup.upsert({
      where: { slug },
      update: { name, displayOrder: order, status: 'ACTIVE' },
      create: { name, slug, displayOrder: order, status: 'ACTIVE' },
    });
  }

  async function upsertAttribute(
    groupId: string,
    name: string,
    slug: string,
    type: string,
    opts: {
      isVariant?: boolean;
      isRequired?: boolean;
      isFilterable?: boolean;
      displayOrder?: number;
      options?: Array<{ value: string; label: string }>;
    } = {},
  ) {
    const existing = await prisma.attribute.findFirst({
      where: { groupId, slug },
    });
    const attr = existing
      ? await prisma.attribute.update({
          where: { id: existing.id },
          data: {
            name,
            type,
            isVariant: opts.isVariant ?? false,
            isRequired: opts.isRequired ?? false,
            isFilterable: opts.isFilterable ?? false,
            displayOrder: opts.displayOrder ?? 0,
            status: 'ACTIVE',
            deletedAt: null,
          },
        })
      : await prisma.attribute.create({
          data: {
            groupId,
            name,
            slug,
            type,
            isVariant: opts.isVariant ?? false,
            isRequired: opts.isRequired ?? false,
            isFilterable: opts.isFilterable ?? false,
            displayOrder: opts.displayOrder ?? 0,
            status: 'ACTIVE',
          },
        });

    if (opts.options?.length) {
      await prisma.attributeOption.deleteMany({ where: { attributeId: attr.id } });
      let i = 0;
      for (const opt of opts.options) {
        await prisma.attributeOption.create({
          data: {
            attributeId: attr.id,
            value: opt.value,
            label: opt.label,
            displayOrder: i++,
            status: 'ACTIVE',
          },
        });
      }
    }
    return attr;
  }

  const variantGroup = await upsertGroup('Variant Options', 'variant-options', 1);
  const dynamicGroup = await upsertGroup('Dynamic Attributes', 'dynamic-attributes', 2);
  const specGroup = await upsertGroup('Customer Specifications', 'customer-specifications', 3);

  console.log('Seeding Size / Color variant attributes...');
  await upsertAttribute(variantGroup.id, 'Size', 'size', 'SIZE', {
    isVariant: true,
    isRequired: true,
    isFilterable: true,
    displayOrder: 1,
    options: [
      { value: 'S', label: 'S' },
      { value: 'M', label: 'M' },
      { value: 'L', label: 'L' },
      { value: 'XL', label: 'XL' },
    ],
  });
  await upsertAttribute(variantGroup.id, 'Color', 'color', 'COLOR', {
    isVariant: true,
    isRequired: true,
    isFilterable: true,
    displayOrder: 2,
    options: [
      { value: 'Pink', label: 'Pink' },
      { value: 'Red', label: 'Red' },
      { value: 'Blue', label: 'Blue' },
      { value: 'Green', label: 'Green' },
      { value: 'Yellow', label: 'Yellow' },
      { value: 'Black', label: 'Black' },
      { value: 'White', label: 'White' },
      { value: 'Maroon', label: 'Maroon' },
    ],
  });

  console.log('Seeding dynamic ethnic attributes...');
  await upsertAttribute(dynamicGroup.id, 'Fabric', 'fabric', 'SELECT', {
    isRequired: true,
    isFilterable: true,
    displayOrder: 1,
    options: [
      { value: 'Rayon', label: 'Rayon' },
      { value: 'Cotton', label: 'Cotton' },
      { value: 'Silk', label: 'Silk' },
      { value: 'Georgette', label: 'Georgette' },
      { value: 'Chiffon', label: 'Chiffon' },
      { value: 'Polyester', label: 'Polyester' },
    ],
  });
  await upsertAttribute(dynamicGroup.id, 'Pattern', 'pattern', 'SELECT', {
    displayOrder: 2,
    options: [
      { value: 'Floral Print', label: 'Floral Print' },
      { value: 'Solid', label: 'Solid' },
      { value: 'Embroidered', label: 'Embroidered' },
      { value: 'Printed', label: 'Printed' },
      { value: 'Striped', label: 'Striped' },
    ],
  });
  await upsertAttribute(dynamicGroup.id, 'Sleeve Type', 'sleeve-type', 'SELECT', {
    displayOrder: 3,
    options: [
      { value: '3/4 Sleeve', label: '3/4 Sleeve' },
      { value: 'Full Sleeve', label: 'Full Sleeve' },
      { value: 'Half Sleeve', label: 'Half Sleeve' },
      { value: 'Sleeveless', label: 'Sleeveless' },
    ],
  });
  await upsertAttribute(dynamicGroup.id, 'Neck Type', 'neck-type', 'SELECT', {
    displayOrder: 4,
    options: [
      { value: 'Round Neck', label: 'Round Neck' },
      { value: 'V-Neck', label: 'V-Neck' },
      { value: 'Boat Neck', label: 'Boat Neck' },
      { value: 'Mandarin Collar', label: 'Mandarin Collar' },
    ],
  });
  await upsertAttribute(dynamicGroup.id, 'Fit', 'fit', 'SELECT', {
    displayOrder: 5,
    options: [
      { value: 'Regular Fit', label: 'Regular Fit' },
      { value: 'Slim Fit', label: 'Slim Fit' },
      { value: 'Relaxed Fit', label: 'Relaxed Fit' },
    ],
  });
  await upsertAttribute(dynamicGroup.id, 'Occasion', 'occasion', 'SELECT', {
    displayOrder: 6,
    options: [
      { value: 'Festive', label: 'Festive' },
      { value: 'Casual', label: 'Casual' },
      { value: 'Office', label: 'Office' },
      { value: 'Wedding', label: 'Wedding' },
      { value: 'Party', label: 'Party' },
    ],
  });
  await upsertAttribute(dynamicGroup.id, 'Season', 'attr-season', 'SELECT', {
    displayOrder: 7,
    options: [
      { value: 'All Season', label: 'All Season' },
      { value: 'Summer', label: 'Summer' },
      { value: 'Winter', label: 'Winter' },
      { value: 'Monsoon', label: 'Monsoon' },
    ],
  });
  await upsertAttribute(dynamicGroup.id, 'Wash Care', 'wash-care', 'SELECT', {
    displayOrder: 8,
    options: [
      { value: 'Hand Wash', label: 'Hand Wash' },
      { value: 'Machine Wash', label: 'Machine Wash' },
      { value: 'Dry Clean Only', label: 'Dry Clean Only' },
    ],
  });

  console.log('Seeding customer specification attributes...');
  const specDefs: Array<{ name: string; slug: string; type: string; options?: Array<{ value: string; label: string }> }> = [
    { name: 'Fabric', slug: 'spec-fabric', type: 'TEXT' },
    { name: 'Sleeve', slug: 'spec-sleeve', type: 'TEXT' },
    { name: 'Neck', slug: 'spec-neck', type: 'TEXT' },
    { name: 'Pattern', slug: 'spec-pattern', type: 'TEXT' },
    { name: 'Fit', slug: 'spec-fit', type: 'TEXT' },
    { name: 'Occasion', slug: 'spec-occasion', type: 'TEXT' },
    {
      name: 'Transparency',
      slug: 'spec-transparency',
      type: 'SELECT',
      options: [
        { value: 'Opaque', label: 'Opaque' },
        { value: 'Semi-Sheer', label: 'Semi-Sheer' },
        { value: 'Sheer', label: 'Sheer' },
      ],
    },
    {
      name: 'Stretch',
      slug: 'spec-stretch',
      type: 'SELECT',
      options: [
        { value: 'No', label: 'No' },
        { value: 'Yes', label: 'Yes' },
        { value: 'Slight', label: 'Slight' },
      ],
    },
    {
      name: 'Lining',
      slug: 'spec-lining',
      type: 'SELECT',
      options: [
        { value: 'Yes', label: 'Yes' },
        { value: 'No', label: 'No' },
      ],
    },
    { name: 'Package Includes', slug: 'spec-package', type: 'TEXT' },
    { name: 'Country of Origin', slug: 'spec-origin', type: 'TEXT' },
    { name: 'Manufacturer', slug: 'spec-manufacturer', type: 'TEXT' },
  ];
  let specOrder = 1;
  for (const def of specDefs) {
    await upsertAttribute(specGroup.id, def.name, def.slug, def.type, {
      displayOrder: specOrder++,
      options: def.options,
    });
  }

  void brand;
  void kurtaSets;


  console.log('Seeding super admin...');
  const adminRole = await prisma.role.findUnique({ where: { name: 'super_admin' } });
  if (adminRole) {
    const passwordHash = await require('argon2').hash('Admin@123');
    await prisma.user.upsert({
      where: { email: 'admin@vasanthi.com' },
      update: {},
      create: {
        email: 'admin@vasanthi.com',
        passwordHash: passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        userType: 'ADMIN',
        accountStatus: 'ACTIVE',
        isEmailVerified: true,
        userRoles: {
          create: { roleId: adminRole.id }
        }
      }
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
