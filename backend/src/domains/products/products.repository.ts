import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Product CRUD ───────────────────────────────────────

  async findAll(params: {
    search?: string;
    brandId?: string;
    status?: string;
    visibility?: string;
    type?: string;
    gender?: string;
    ageGroup?: string;
    occasion?: string;
    season?: string;
    isFeatured?: boolean;
    isNewArrival?: boolean;
    isBestSeller?: boolean;
    isPublished?: boolean;
    minPrice?: number;
    maxPrice?: number;
    categoryId?: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const {
      search,
      brandId,
      status,
      visibility,
      type,
      gender,
      ageGroup,
      occasion,
      season,
      isFeatured,
      isNewArrival,
      isBestSeller,
      isPublished,
      minPrice,
      maxPrice,
      categoryId,
      page,
      limit,
      sortBy,
      sortOrder,
    } = params;
    const where: Prisma.ProductWhereInput = { deletedAt: null };

    if (search)
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
        { searchKeywords: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    if (brandId) where.brandId = brandId;
    if (status) where.status = status;
    if (visibility) where.visibility = visibility;
    if (type) where.type = type;
    if (gender) where.gender = gender;
    if (ageGroup) where.ageGroup = ageGroup;
    if (occasion) where.occasion = occasion;
    if (season) where.season = season;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (isNewArrival !== undefined) where.isNewArrival = isNewArrival;
    if (isBestSeller !== undefined) where.isBestSeller = isBestSeller;
    if (isPublished !== undefined) where.isPublished = isPublished;
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }
    if (categoryId) {
      where.categories = { some: { categoryId } };
    }

    const include: Prisma.ProductInclude = {
      brand: { select: { id: true, name: true, slug: true } },
      categories: {
        include: { category: { select: { id: true, name: true, slug: true } } },
      },
      attributeValues: {
        include: {
          attribute: { select: { id: true, name: true, type: true } },
        },
      },
      media: {
        where: { deletedAt: null, status: 'ACTIVE' },
        orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
        take: 8,
      },
    };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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

  private detailInclude(): Prisma.ProductInclude {
    return {
      brand: { select: { id: true, name: true, slug: true } },
      colorGroups: {
        include: {
          colorAttributeOption: {
            select: {
              id: true,
              value: true,
              label: true,
              swatchImageUrl: true,
            },
          },
          variants: {
            where: { deletedAt: null },
            include: {
              attributeValues: {
                include: {
                  attribute: { select: { id: true, name: true, slug: true } },
                  option: {
                    select: {
                      id: true,
                      value: true,
                      label: true,
                      swatchImageUrl: true,
                    },
                  },
                },
              },
            },
          },
          media: {
            where: { deletedAt: null, status: 'ACTIVE' },
            orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
      categories: {
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      },
      attributeValues: {
        include: {
          attribute: { select: { id: true, name: true, type: true } },
        },
      },
      media: {
        where: { deletedAt: null, status: 'ACTIVE' },
        orderBy: [{ isPrimary: 'desc' }, { displayOrder: 'asc' }],
      },
      relatedTo: {
        include: { relatedProduct: { select: { id: true, name: true } } },
      },
      relatedFrom: {
        include: { product: { select: { id: true, name: true } } },
      },
    };
  }

  async findBasicById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        sku: true,
        name: true,
        slug: true,
        basePrice: true,
        salePrice: true,
        brand: { select: { name: true } },
        media: {
          where: { isPrimary: true, status: 'ACTIVE' },
          select: { url: true },
          take: 1,
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: this.detailInclude(),
    });
  }

  async findBySku(sku: string) {
    return this.prisma.product.findUnique({ where: { sku } });
  }
  async findBySlug(slug: string) {
    return this.prisma.product.findUnique({
      where: { slug },
      include: this.detailInclude(),
    });
  }
  async findByBarcode(barcode: string) {
    return this.prisma.product.findUnique({ where: { barcode } });
  }

  async create(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({ data });
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  }

  async restore(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: null, status: 'DRAFT' },
    });
  }

  // ─── Category assignments ───────────────────────────────

  async assignCategories(productId: string, categoryIds: string[]) {
    await this.prisma.productCategory.createMany({
      data: categoryIds.map((categoryId) => ({ productId, categoryId })),
      skipDuplicates: true,
    });
  }

  async removeCategory(productId: string, categoryId: string) {
    await this.prisma.productCategory.delete({
      where: { productId_categoryId: { productId, categoryId } },
    });
  }

  // ─── Attribute assignments ──────────────────────────────

  async assignAttributes(
    productId: string,
    entries: { attributeId: string; value?: string }[],
  ) {
    await this.prisma.productAttribute.createMany({
      data: entries.map((e) => ({
        productId,
        attributeId: e.attributeId,
        value: e.value,
      })),
      skipDuplicates: true,
    });
  }

  async removeAttribute(productId: string, attributeId: string) {
    await this.prisma.productAttribute.delete({
      where: { productId_attributeId: { productId, attributeId } },
    });
  }

  // ─── Related products ───────────────────────────────────

  async assignRelatedProducts(productId: string, relatedProductIds: string[]) {
    await this.prisma.productRelatedProduct.createMany({
      data: relatedProductIds.map((rpid) => ({
        productId,
        relatedProductId: rpid,
      })),
      skipDuplicates: true,
    });
  }

  async removeRelatedProduct(productId: string, relatedProductId: string) {
    await this.prisma.productRelatedProduct.delete({
      where: { productId_relatedProductId: { productId, relatedProductId } },
    });
  }
}
