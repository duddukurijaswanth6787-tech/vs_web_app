import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    status?: string;
    isFeatured?: boolean;
    isMenuVisible?: boolean;
    isVisible?: boolean;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      status,
      isFeatured,
      isMenuVisible,
      isVisible,
    } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.CategoryWhereInput = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (isMenuVisible !== undefined) where.isMenuVisible = isMenuVisible;
    if (isVisible !== undefined) where.isVisible = isVisible;

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.category.count({ where }),
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

  async findById(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async findByIds(ids: string[]) {
    return this.prisma.category.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.category.findUnique({ where: { slug } });
  }

  async findAllActive() {
    return this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: [{ level: 'asc' }, { displayOrder: 'asc' }],
    });
  }

  async findChildren(parentId: string) {
    return this.prisma.category.findMany({
      where: { parentId, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findDescendants(path: string) {
    return this.prisma.category.findMany({
      where: { path: { startsWith: path }, deletedAt: null },
    });
  }

  async create(data: Prisma.CategoryCreateInput) {
    return this.prisma.category.create({ data });
  }

  async update(id: string, data: Prisma.CategoryUpdateInput) {
    return this.prisma.category.update({ where: { id }, data });
  }

  async unlinkChildren(parentId: string, newParentId: string | null = null, newLevel = 0) {
    return this.prisma.category.updateMany({
      where: { parentId },
      data: { parentId: newParentId, level: newLevel },
    });
  }

  async softDelete(id: string) {
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  }

  async restore(id: string) {
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: null, status: 'ACTIVE' },
    });
  }

  async countByParentId(parentId: string) {
    return this.prisma.category.count({ where: { parentId, deletedAt: null } });
  }
}
