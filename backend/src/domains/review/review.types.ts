import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  IsUrl,
  IsUUID,
  MinLength,
  MaxLength,
  ArrayMaxSize,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiProperty({ minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];
}

export class UpdateReviewDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
}

export class ReviewQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() productId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() customerId?: string;
  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ReviewImageResponse {
  @ApiProperty() id!: string;
  @ApiProperty() url!: string;
  @ApiPropertyOptional() altText?: string;
  @ApiProperty() displayOrder!: number;
}

export class ReviewResponse {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() customerId!: string;
  @ApiProperty() rating!: number;
  @ApiPropertyOptional() title?: string;
  @ApiPropertyOptional() comment?: string;
  @ApiProperty() isVerifiedPurchase!: boolean;
  @ApiProperty() isApproved!: boolean;
  @ApiProperty() helpfulCount!: number;
  @ApiProperty() unhelpfulCount!: number;
  @ApiProperty() status!: string;
  @ApiPropertyOptional({ type: [ReviewImageResponse] })
  images?: ReviewImageResponse[];
  @ApiProperty() createdAt!: Date;
}

export class ReviewListResponse {
  @ApiProperty({ type: [ReviewResponse] }) data!: ReviewResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export class ProductRatingSummary {
  @ApiProperty() averageRating!: number;
  @ApiProperty() totalReviews!: number;
  @ApiProperty() ratingDistribution!: Record<number, number>;
}

export class CustomerCreateReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;
  @ApiProperty({ minLength: 5, maxLength: 120 })
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  title!: string;
  @ApiProperty({ minLength: 10, maxLength: 5000 })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  comment!: string;
  @ApiPropertyOptional({ type: [String], maxItems: 10 })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  @ArrayMaxSize(10)
  images?: string[];
}

export class CustomerUpdateReviewDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
  @ApiPropertyOptional({ minLength: 5, maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  title?: string;
  @ApiPropertyOptional({ minLength: 10, maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  comment?: string;
  @ApiPropertyOptional({ type: [String], maxItems: 10 })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  @ArrayMaxSize(10)
  images?: string[];
}

export class ProductReviewQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
  @ApiPropertyOptional({
    enum: ['newest', 'oldest', 'highest', 'lowest', 'helpful'],
  })
  @IsOptional()
  @IsString()
  sort?: string;
  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  verifiedPurchase?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  imagesOnly?: boolean;
}

export enum ReportReason {
  SPAM = 'Spam',
  ABUSE = 'Abuse',
  FAKE = 'Fake Review',
  OFFENSIVE = 'Offensive',
  OTHER = 'Other',
}

export class ReportReviewDto {
  @ApiProperty({ enum: ReportReason })
  @IsEnum(ReportReason)
  reason!: ReportReason;
}
