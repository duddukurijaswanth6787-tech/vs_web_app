import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    productId?: string;
    customerId?: string;
    rating?: number;
    status?: string;
    page: number;
    limit: number;
  }) {
    const { productId, customerId, rating, status, page, limit } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.ReviewWhereInput = { deletedAt: null };
    if (productId) where.productId = productId;
    if (customerId) where.customerId = customerId;
    if (rating) where.rating = rating;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { images: { orderBy: { displayOrder: 'asc' } } },
      }),
      this.prisma.review.count({ where }),
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
    return this.prisma.review.findUnique({
      where: { id },
      include: { images: { orderBy: { displayOrder: 'asc' } } },
    });
  }

  async create(data: Prisma.ReviewCreateInput) {
    return this.prisma.review.create({
      data,
      include: { images: true },
    });
  }

  async update(id: string, data: Prisma.ReviewUpdateInput) {
    return this.prisma.review.update({
      where: { id },
      data,
      include: { images: true },
    });
  }

  async createImage(data: Prisma.ReviewImageCreateInput) {
    return this.prisma.reviewImage.create({ data });
  }

  async vote(reviewId: string, userId: string, isHelpful: boolean) {
    return this.prisma.reviewVote.upsert({
      where: { reviewId_userId: { reviewId, userId } },
      update: { isHelpful },
      create: { reviewId, userId, isHelpful },
    });
  }

  async getProductRatingSummary(productId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { productId, deletedAt: null, status: 'APPROVED' },
      select: { rating: true },
    });
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;
    const ratingDistribution: Record<number, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    reviews.forEach((r) => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    });
    return { averageRating, totalReviews, ratingDistribution };
  }

  async findAllForProduct(params: {
    productId: string;
    page: number;
    limit: number;
    sort?: string;
    rating?: number;
    verifiedPurchase?: boolean;
    imagesOnly?: boolean;
  }) {
    const {
      productId,
      page,
      limit,
      sort,
      rating,
      verifiedPurchase,
      imagesOnly,
    } = params;
    const skip = (page - 1) * limit;
    const where: Prisma.ReviewWhereInput = {
      productId,
      deletedAt: null,
      isApproved: true,
    };
    if (rating) where.rating = rating;
    if (verifiedPurchase) where.isVerifiedPurchase = true;
    if (imagesOnly) where.images = { some: {} };

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'oldest') orderBy = { createdAt: 'asc' };
    else if (sort === 'highest') orderBy = { rating: 'desc' };
    else if (sort === 'lowest') orderBy = { rating: 'asc' };
    else if (sort === 'helpful') orderBy = { helpfulCount: 'desc' };

    const include = {
      images: { orderBy: { displayOrder: 'asc' as const } },
      customer: {
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true } },
        },
      },
    };

    const [data, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include,
      }),
      this.prisma.review.count({ where }),
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

  async softDelete(id: string) {
    return this.prisma.review.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async report(reviewId: string, userId: string, reason: string) {
    return this.prisma.reviewReport.upsert({
      where: { reviewId_userId: { reviewId, userId } },
      update: { reason },
      create: { reviewId, userId, reason },
    });
  }

  async incrementReportCount(reviewId: string) {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { reportCount: { increment: 1 } },
    });
  }
}
