import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';
import { SizeChartRowDto } from './size-chart.types';

const withRows = {
  rows: { orderBy: { displayOrder: 'asc' } },
} satisfies Prisma.SizeChartTemplateInclude;

@Injectable()
export class SizeChartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    garmentType?: string;
    status?: string;
    page: number;
    limit: number;
  }) {
    const { search, garmentType, status, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.SizeChartTemplateWhereInput = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { garmentType: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (garmentType) where.garmentType = garmentType;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.sizeChartTemplate.findMany({
        where,
        include: withRows,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.sizeChartTemplate.count({ where }),
    ]);

    return { data, total };
  }

  findById(id: string) {
    return this.prisma.sizeChartTemplate.findFirst({
      where: { id, deletedAt: null },
      include: withRows,
    });
  }

  findBySlug(slug: string) {
    return this.prisma.sizeChartTemplate.findFirst({
      where: { slug, deletedAt: null },
      include: withRows,
    });
  }

  /** The chart attached to a product, for the customer-facing size guide. */
  async findByProductId(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { sizeChartTemplateId: true },
    });
    if (!product?.sizeChartTemplateId) return null;
    return this.findById(product.sizeChartTemplateId);
  }

  slugExists(slug: string, excludeId?: string) {
    return this.prisma.sizeChartTemplate.findFirst({
      where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
  }

  create(
    data: Omit<Prisma.SizeChartTemplateCreateInput, 'rows'>,
    rows: SizeChartRowDto[],
  ) {
    return this.prisma.sizeChartTemplate.create({
      data: {
        ...data,
        rows: {
          create: rows.map((row, index) => ({
            size: row.size,
            measurements: row.measurements,
            displayOrder: row.displayOrder ?? index,
          })),
        },
      },
      include: withRows,
    });
  }

  /**
   * Update the template, and when rows are supplied replace the whole set in a
   * transaction so a partial write cannot leave a half-updated chart behind.
   */
  async update(
    id: string,
    data: Prisma.SizeChartTemplateUpdateInput,
    rows?: SizeChartRowDto[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.sizeChartTemplate.update({ where: { id }, data });

      if (rows) {
        await tx.sizeChartRow.deleteMany({ where: { templateId: id } });
        if (rows.length > 0) {
          await tx.sizeChartRow.createMany({
            data: rows.map((row, index) => ({
              templateId: id,
              size: row.size,
              measurements: row.measurements,
              displayOrder: row.displayOrder ?? index,
            })),
          });
        }
      }

      return tx.sizeChartTemplate.findUnique({
        where: { id },
        include: withRows,
      });
    });
  }

  softDelete(id: string) {
    return this.prisma.sizeChartTemplate.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });
  }

  countProductsUsing(id: string) {
    return this.prisma.product.count({
      where: { sizeChartTemplateId: id, deletedAt: null },
    });
  }
}
