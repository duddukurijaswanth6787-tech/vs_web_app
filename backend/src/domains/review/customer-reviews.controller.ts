import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BusinessException } from '@common/exceptions';
import { ReviewService } from './review.service';
import {
  CustomerCreateReviewDto,
  CustomerUpdateReviewDto,
  ProductReviewQueryDto,
  ReportReviewDto,
} from './review.types';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { PrismaService } from '@database/prisma.service';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';

@ApiTags('Customer Reviews')
@Controller()
export class CustomerReviewsController {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveCustomerId(userId: string): Promise<string | null> {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { userId },
    });
    return profile?.id ?? null;
  }

  @Get('products/:productId/reviews')
  @ApiOperation({ summary: 'Get product reviews with sorting and filtering' })
  async getProductReviews(
    @Param('productId') productId: string,
    @Query() query: ProductReviewQueryDto,
  ) {
    const reviews = await this.reviewService.findForProduct(productId, query);
    const summary = await this.reviewService.getProductRatingSummary(productId);
    return ResponseBuilder.success({
      ...reviews,
      summary: {
        averageRating: summary.averageRating,
        totalReviews: summary.totalReviews,
        ratingBreakdown: summary.ratingDistribution,
      },
    });
  }

  @Post('products/:productId/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a product review (purchased products only)',
  })
  async createReview(
    @Param('productId') productId: string,
    @Body() dto: CustomerCreateReviewDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // ponytail: verified purchase check via order lookup
    const customerId = await this.resolveCustomerId(user.sub);
    const orderItem = customerId
      ? await this.prisma.orderItem.findFirst({
          where: {
            productId,
            order: { customerId, status: 'DELIVERED' },
          },
          select: { orderId: true },
        })
      : null;
    if (!orderItem || !customerId)
      throw new BusinessException(
        'Product must be purchased before reviewing',
        'REVIEW_004',
      );

    return ResponseBuilder.created(
      await this.reviewService.create(customerId, { ...dto, productId } as any),
      'Review created',
    );
  }

  @Get('me/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current customer reviews' })
  async getMyReviews(
    @Query() query: ProductReviewQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const customerId = await this.resolveCustomerId(user.sub);
    if (!customerId) return ResponseBuilder.success({ data: [], meta: {} });
    return ResponseBuilder.success(
      await this.reviewService.findAll({ ...query, customerId }),
    );
  }

  @Get('me/pending-reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get delivered products awaiting review' })
  async getPendingReviews(@CurrentUser() user: JwtPayload) {
    const customerId = await this.resolveCustomerId(user.sub);
    if (!customerId) return ResponseBuilder.success([]);
    return ResponseBuilder.success(
      await this.reviewService.findPendingReviews(customerId),
    );
  }

  @Put('reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own review' })
  async updateReview(
    @Param('reviewId') reviewId: string,
    @Body() dto: CustomerUpdateReviewDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const customerId = await this.resolveCustomerId(user.sub);
    return ResponseBuilder.success(
      await this.reviewService.update(
        reviewId,
        dto as any,
        customerId || user.sub,
      ),
      'Review updated',
    );
  }

  @Delete('reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own review (soft delete)' })
  async deleteReview(
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const customerId = await this.resolveCustomerId(user.sub);
    await this.reviewService.delete(reviewId, customerId || user.sub);
    return ResponseBuilder.deleted('Review deleted');
  }

  @Post('reviews/:reviewId/helpful')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark review as helpful (toggle)' })
  async markHelpful(
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const customerId = await this.resolveCustomerId(user.sub);
    return ResponseBuilder.success(
      await this.reviewService.vote(reviewId, customerId || user.sub, true),
      'Vote recorded',
    );
  }

  @Post('reviews/:reviewId/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report a review' })
  async reportReview(
    @Param('reviewId') reviewId: string,
    @Body() dto: ReportReviewDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.reviewService.report(reviewId, user.sub, dto.reason);
    return ResponseBuilder.success(null, 'Review reported');
  }
}
