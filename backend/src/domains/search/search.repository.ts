import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

// Cap on how many text-matched candidates we rank/paginate in memory --
// mirrors the existing 1000-row cap in getAvailableFilters below. A real
// text query narrows the catalog enough that this is never actually hit
// in practice; it just bounds worst-case memory for a query like "a".
const RANKED_CANDIDATE_CAP = 3000;

@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Full-text + trigram relevance ranking over Postgres directly, using the
   * generated `searchVector` tsvector column (see migration
   * 20260820010000_add_product_full_text_search). Falls back to trigram
   * similarity on the name so typos ("saaree") still surface results, and to
   * a plain SKU/barcode substring match for exact-code lookups.
   */
  private async getRankedProductIds(
    q: string,
  ): Promise<{ id: string; rank: number }[]> {
    const like = `%${q}%`;
    return this.prisma.$queryRaw<{ id: string; rank: number }[]>`
      SELECT "id",
        GREATEST(
          ts_rank("searchVector", plainto_tsquery('english', ${q})),
          similarity("name", ${q}) * 0.5
        ) AS rank
      FROM "products"
      WHERE "deletedAt" IS NULL
        AND "isPublished" = true
        AND "visibility" = 'VISIBLE'
        AND (
          "searchVector" @@ plainto_tsquery('english', ${q})
          OR similarity("name", ${q}) > 0.25
          OR "sku" ILIKE ${like}
          OR "barcode" ILIKE ${like}
        )
      ORDER BY rank DESC
      LIMIT ${RANKED_CANDIDATE_CAP}
    `;
  }

  async search(params: {
    q?: string;
    brandId?: string;
    categoryId?: string;
    gender?: string;
    ageGroup?: string;
    occasion?: string;
    season?: string;
    type?: string;
    isFeatured?: boolean;
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
    tags?: string[];
    collections?: string[];
    attributeFilters?: Record<string, string[]>;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    page: number;
    limit: number;
  }) {
    const {
      q,
      brandId,
      categoryId,
      gender,
      ageGroup,
      occasion,
      season,
      type,
      isFeatured,
      isNewArrival,
      isBestSeller,
      inStock,
      minPrice,
      maxPrice,
      tags,
      collections,
      attributeFilters,
      sortBy,
      sortOrder,
      page,
      limit,
    } = params;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      isPublished: true,
      visibility: 'VISIBLE',
    };

    let rankMap: Map<string, number> | null = null;
    if (q) {
      const ranked = await this.getRankedProductIds(q);
      if (ranked.length === 0) {
        return {
          data: [],
          meta: {
            page,
            limit,
            total: 0,
            totalPages: 1,
            hasNext: false,
            hasPrevious: false,
          },
        };
      }
      rankMap = new Map(ranked.map((r) => [r.id, Number(r.rank)]));
      where.OR = [
        { id: { in: ranked.map((r) => r.id) } },
        { brand: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }
    if (brandId) where.brandId = brandId;
    if (gender) where.gender = gender;
    if (ageGroup) where.ageGroup = ageGroup;
    if (occasion) where.occasion = occasion;
    if (season) where.season = season;
    if (type) where.type = type;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (isNewArrival !== undefined) where.isNewArrival = isNewArrival;
    if (isBestSeller !== undefined) where.isBestSeller = isBestSeller;
    if (tags?.length) where.tags = { hasSome: tags };
    if (collections?.length) where.collections = { hasSome: collections };

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }

    if (categoryId) where.categories = { some: { categoryId } };

    if (inStock) {
      where.variants = { some: { inventory: { stockStatus: 'IN_STOCK' } } };
    }

    // Attribute filters: { "color": ["blue", "red"], "size": ["M"] }
    if (attributeFilters && Object.keys(attributeFilters).length > 0) {
      const attributeConditions = Object.entries(attributeFilters).map(
        ([slug, values]) => ({
          attributeValues: {
            some: {
              attribute: { slug },
              OR: [
                { value: { in: values, mode: 'insensitive' as const } },
                { option: { value: { in: values } } },
              ],
            },
          },
        }),
      );
      where.AND = attributeConditions.map((c) => c);
    }

    const include: Prisma.ProductInclude = {
      brand: { select: { id: true, name: true, slug: true } },
      categories: {
        include: { category: { select: { id: true, name: true, slug: true } } },
      },
    };

    // With a text query, "relevance" means the tsvector/trigram rank
    // computed above, which isn't a sortable DB column -- fetch every
    // filtered candidate (bounded by the ranked-id cap), rank in memory,
    // then paginate the sorted array.
    if (rankMap) {
      const matches = await this.prisma.product.findMany({ where, include });
      const sorted =
        sortBy === 'relevance'
          ? matches.sort(
              (a, b) => (rankMap!.get(b.id) ?? 0) - (rankMap!.get(a.id) ?? 0),
            )
          : matches.sort((a: any, b: any) => {
              const av = a[sortBy];
              const bv = b[sortBy];
              const cmp = av < bv ? -1 : av > bv ? 1 : 0;
              return sortOrder === 'asc' ? cmp : -cmp;
            });
      const total = sorted.length;
      const data = sorted.slice((page - 1) * limit, (page - 1) * limit + limit);
      return {
        data,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasNext: page < Math.ceil(total / limit),
          hasPrevious: page > 1,
        },
      };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      sortBy === 'relevance'
        ? [
            { isFeatured: 'desc' },
            { displayOrder: 'asc' },
            { createdAt: 'desc' },
          ]
        : [{ [sortBy]: sortOrder }];

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page < Math.ceil(total / limit),
        hasPrevious: page > 1,
      },
    };
  }

  async getAvailableFilters(baseWhere: Prisma.ProductWhereInput) {
    const products = await this.prisma.product.findMany({
      where: baseWhere,
      include: {
        brand: { select: { id: true, name: true } },
        categories: {
          select: { category: { select: { id: true, name: true } } },
        },
        attributeValues: {
          select: {
            value: true,
            attribute: { select: { slug: true, name: true } },
          },
        },
      },
      take: 1000, // ponytail: cap at 1000 for facet calculation, good enough for most catalogs
    });

    const brands = new Map<string, { label: string; count: number }>();
    const categories = new Map<string, { label: string; count: number }>();
    const genders = new Map<string, number>();
    const ageGroups = new Map<string, number>();
    const occasions = new Map<string, number>();
    const seasons = new Map<string, number>();
    const types = new Map<string, number>();
    const tags = new Map<string, number>();
    const collections = new Map<string, number>();
    let minPrice = Infinity;
    let maxPrice = 0;
    const attributeMap = new Map<
      string,
      { name: string; options: Map<string, number> }
    >();

    for (const p of products) {
      if (p.brandId) {
        const existing = brands.get(p.brandId);
        brands.set(p.brandId, {
          label: p.brand?.name ?? p.brandId,
          count: (existing?.count ?? 0) + 1,
        });
      }
      for (const pc of p.categories) {
        const existing = categories.get(pc.category.id);
        categories.set(pc.category.id, {
          label: pc.category.name,
          count: (existing?.count ?? 0) + 1,
        });
      }
      if (p.gender) genders.set(p.gender, (genders.get(p.gender) ?? 0) + 1);
      if (p.ageGroup)
        ageGroups.set(p.ageGroup, (ageGroups.get(p.ageGroup) ?? 0) + 1);
      if (p.occasion)
        occasions.set(p.occasion, (occasions.get(p.occasion) ?? 0) + 1);
      if (p.season) seasons.set(p.season, (seasons.get(p.season) ?? 0) + 1);
      if (p.type) types.set(p.type, (types.get(p.type) ?? 0) + 1);
      for (const t of p.tags) tags.set(t, (tags.get(t) ?? 0) + 1);
      for (const c of p.collections)
        collections.set(c, (collections.get(c) ?? 0) + 1);

      const price = Number(p.salePrice ?? p.basePrice);
      if (price < minPrice) minPrice = price;
      if (price > maxPrice) maxPrice = price;

      for (const av of p.attributeValues) {
        const slug = av.attribute.slug;
        const value = av.value;
        if (!value) continue;
        if (!attributeMap.has(slug))
          attributeMap.set(slug, {
            name: av.attribute.name,
            options: new Map(),
          });
        const attr = attributeMap.get(slug)!;
        attr.options.set(value, (attr.options.get(value) ?? 0) + 1);
      }
    }

    const toOptions = (map: Map<string, number>) =>
      [...map.entries()]
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => b.count - a.count);

    const toOptionsWithLabel = (
      map: Map<string, { label: string; count: number }>,
    ) =>
      [...map.entries()]
        .map(([value, { label, count }]) => ({ value, label, count }))
        .sort((a, b) => b.count - a.count);

    return {
      brands: toOptionsWithLabel(brands),
      categories: toOptionsWithLabel(categories),
      genders: toOptions(genders),
      ageGroups: toOptions(ageGroups),
      occasions: toOptions(occasions),
      seasons: toOptions(seasons),
      types: toOptions(types),
      tags: toOptions(tags),
      collections: toOptions(collections),
      priceRange: { min: minPrice === Infinity ? 0 : minPrice, max: maxPrice },
      attributes: [...attributeMap.entries()].map(
        ([slug, { name, options }]) => ({
          slug,
          name,
          options: [...options.entries()]
            .map(([value, count]) => ({ value, label: value, count }))
            .sort((a, b) => b.count - a.count),
        }),
      ),
    };
  }

  async globalSearch(q: string, limit: number) {
    const [products, orders, customers, categories, brands, coupons] =
      await Promise.all([
        this.prisma.product.findMany({
          where: {
            deletedAt: null,
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { sku: { contains: q, mode: 'insensitive' } },
              { barcode: { contains: q, mode: 'insensitive' } },
            ],
          },
          select: {
            id: true,
            name: true,
            sku: true,
            slug: true,
            basePrice: true,
          },
          take: limit,
          orderBy: { name: 'asc' },
        }),
        this.prisma.order.findMany({
          where: {
            OR: [{ orderNumber: { contains: q, mode: 'insensitive' } }],
          },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            grandTotal: true,
            currency: true,
          },
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.user.findMany({
          where: {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
          select: { id: true, firstName: true, lastName: true, email: true },
          take: limit,
          orderBy: { firstName: 'asc' },
        }),
        this.prisma.category.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { slug: { contains: q, mode: 'insensitive' } },
            ],
          },
          select: { id: true, name: true, slug: true },
          take: limit,
          orderBy: { name: 'asc' },
        }),
        this.prisma.brand.findMany({
          where: { name: { contains: q, mode: 'insensitive' } },
          select: { id: true, name: true, slug: true },
          take: limit,
          orderBy: { name: 'asc' },
        }),
        this.prisma.coupon.findMany({
          where: {
            OR: [
              { code: { contains: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
            ],
          },
          select: { id: true, code: true, name: true, type: true },
          take: limit,
          orderBy: { name: 'asc' },
        }),
      ]);

    return {
      products: products.map((p) => ({ ...p, basePrice: Number(p.basePrice) })),
      orders,
      customers,
      categories,
      brands,
      coupons,
    };
  }

  async autocomplete(q: string, limit: number) {
    const [products, tagResults] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          deletedAt: null,
          isPublished: true,
          visibility: 'VISIBLE',
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          tags: true,
        },
        take: limit,
      }),
      this.prisma.product.findMany({
        where: { deletedAt: null, isPublished: true, tags: { has: q } },
        select: { tags: true },
        take: 50,
      }),
    ]);

    const suggestions = new Set<string>();
    for (const p of tagResults) {
      for (const t of p.tags) {
        if (t.toLowerCase().includes(q.toLowerCase())) suggestions.add(t);
      }
    }
    // Also add product names as suggestions
    for (const p of products) suggestions.add(p.name);

    return {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        basePrice: Number(p.basePrice),
      })),
      suggestions: [...suggestions].slice(0, limit),
    };
  }
}
