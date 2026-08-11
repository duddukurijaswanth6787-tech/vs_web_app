import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  IsUrl,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

// ─── Create ──────────────────────────────────────────────

const PRODUCT_MEDIA_TYPES = [
  'IMAGE',
  'VIDEO',
  'DOCUMENT',
  '360_IMAGE',
  'MAIN',
  'FRONT',
  'BACK',
  'SIDE',
  'FABRIC',
  'MODEL',
  'LIFESTYLE',
] as const;

export class CreateMediaDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() variantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() colorGroupId?: string;
  @ApiProperty({ enum: PRODUCT_MEDIA_TYPES })
  @IsEnum(PRODUCT_MEDIA_TYPES)
  mediaType!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() altText?: string;
  @ApiProperty() @IsUrl({ require_tld: false }) url!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  thumbnailUrl?: string;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
}

// ─── Update ──────────────────────────────────────────────

export class UpdateMediaDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() colorGroupId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() altText?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  url?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  thumbnailUrl?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPrimary?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
}

// ─── Query ───────────────────────────────────────────────

export class MediaQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() productId?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() variantId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() mediaType?: string;
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
  @ApiPropertyOptional({ default: 'displayOrder' })
  @IsOptional()
  @IsString()
  sortBy?: string;
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

// ─── Reorder ─────────────────────────────────────────────

export class ReorderMediaDto {
  @ApiProperty({ type: [Object] }) items!: {
    id: string;
    displayOrder: number;
  }[];
}

// ─── Response ────────────────────────────────────────────

export class MediaResponse {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiPropertyOptional() variantId?: string;
  @ApiProperty() mediaType!: string;
  @ApiPropertyOptional() title?: string;
  @ApiPropertyOptional() altText?: string;
  @ApiProperty() url!: string;
  @ApiPropertyOptional() thumbnailUrl?: string;
  @ApiProperty() displayOrder!: number;
  @ApiProperty() isPrimary!: boolean;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() color?: string;
  @ApiPropertyOptional() colorGroupId?: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class MediaListResponse {
  @ApiProperty({ type: [MediaResponse] }) data!: MediaResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
