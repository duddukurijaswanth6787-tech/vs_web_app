import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import {
  ProductType,
  ProductStatus,
  ProductVisibility,
  GenderType,
  AgeGroup,
} from '@shared/commerce/commerce.enums';

// ─── Create ──────────────────────────────────────────────

export class CreateProductVariantDto {
  @ApiProperty() @IsString() sku!: string;
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @Type(() => Number) @IsNumber() price!: number;
  @ApiProperty() @Type(() => Number) @IsInt() stock!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() color?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() size?: string;
}

export class CreateProductMediaDto {
  @ApiProperty() @IsString() url!: string;
  @ApiProperty() @IsString() role!: string; // MAIN, FRONT, etc.
  @ApiPropertyOptional() @IsOptional() @IsInt() displayOrder?: number;
}

export class ProductAttributeEntry {
  @ApiProperty() @IsUUID() attributeId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() value?: string;
}

export class CreateProductDto {
  @ApiProperty() @IsString() name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
  @ApiProperty() @IsUUID() brandId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shortDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;

  @ApiProperty({ enum: ProductType })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.DRAFT })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({
    enum: ProductVisibility,
    default: ProductVisibility.VISIBLE,
  })
  @IsOptional()
  @IsEnum(ProductVisibility)
  visibility?: ProductVisibility;

  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) basePrice!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salePrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  wholesalePrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  taxPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() discountType?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowBackorder?: boolean;
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minimumOrderQuantity?: number;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maximumOrderQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  length?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  width?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  height?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isNewArrival?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isBestSeller?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isTrending?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isLimitedStock?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFestivePick?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isExclusive?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isOnlineOnly?: boolean;
  @ApiPropertyOptional({ description: 'HSN code used on GST invoices' })
  @IsOptional()
  @IsString()
  hsnCode?: string;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() seoTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() seoDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() seoKeywords?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() canonicalUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() searchKeywords?: string;

  @ApiPropertyOptional({ enum: GenderType })
  @IsOptional()
  @IsEnum(GenderType)
  gender?: GenderType;
  @ApiPropertyOptional({ enum: AgeGroup })
  @IsOptional()
  @IsEnum(AgeGroup)
  ageGroup?: AgeGroup;
  @ApiPropertyOptional() @IsOptional() @IsString() occasion?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() season?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  collections?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  categoryIds?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeEntry)
  attributes?: ProductAttributeEntry[];

  @ApiPropertyOptional({ type: () => [CreateProductVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants?: CreateProductVariantDto[];

  @ApiPropertyOptional({ type: () => [CreateProductMediaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductMediaDto)
  media?: CreateProductMediaDto[];
}

// ─── Update ──────────────────────────────────────────────

export class UpdateProductDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() brandId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shortDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: ProductType })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() visibility?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basePrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salePrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  wholesalePrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costPrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  taxPercentage?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() discountType?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() trackInventory?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allowBackorder?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minimumOrderQuantity?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maximumOrderQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  length?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  width?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  height?: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isNewArrival?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isBestSeller?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isTrending?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isLimitedStock?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFestivePick?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isExclusive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isOnlineOnly?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() hsnCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() taxInclusive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isPublished?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() seoTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() seoDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() seoKeywords?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() canonicalUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() searchKeywords?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;

  @ApiPropertyOptional({ enum: GenderType })
  @IsOptional()
  @IsEnum(GenderType)
  gender?: GenderType;
  @ApiPropertyOptional({ enum: AgeGroup })
  @IsOptional()
  @IsEnum(AgeGroup)
  ageGroup?: AgeGroup;
  @ApiPropertyOptional() @IsOptional() @IsString() occasion?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() season?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  collections?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];
}

// ─── Query ───────────────────────────────────────────────

export class ProductQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() brandId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() visibility?: string;
  @ApiPropertyOptional({ enum: ProductType })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;
  @ApiPropertyOptional({ enum: GenderType })
  @IsOptional()
  @IsEnum(GenderType)
  gender?: GenderType;
  @ApiPropertyOptional({ enum: AgeGroup })
  @IsOptional()
  @IsEnum(AgeGroup)
  ageGroup?: AgeGroup;
  @ApiPropertyOptional() @IsOptional() @IsString() occasion?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() season?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isFeatured?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isNewArrival?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isBestSeller?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isPublished?: boolean;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() categoryId?: string;
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
  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

// ─── Assign DTOs ─────────────────────────────────────────

export class AssignCategoriesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  categoryIds!: string[];
}

export class AssignAttributesDto {
  @ApiProperty({ type: [ProductAttributeEntry] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeEntry)
  attributes!: ProductAttributeEntry[];
}

export class AssignTagsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags!: string[];
}

export class AssignCollectionsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  collections!: string[];
}

export class AssignRelatedProductsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  relatedProductIds!: string[];
}

// ─── Response ────────────────────────────────────────────

class ProductCategoryInfo {
  @ApiProperty() categoryId!: string;
  @ApiProperty() categoryName!: string;
  @ApiProperty() categorySlug!: string;
}

class ProductAttributeInfo {
  @ApiProperty() attributeId!: string;
  @ApiProperty() attributeName!: string;
  @ApiProperty() attributeType!: string;
  @ApiPropertyOptional() value?: string;
}

class ProductRelatedInfo {
  @ApiProperty() productId!: string;
  @ApiProperty() productName!: string;
}

export class ProductResponse {
  @ApiProperty() id!: string;
  @ApiProperty() sku!: string;
  @ApiProperty() barcode!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional() shortDescription?: string;
  @ApiPropertyOptional() description?: string;

  @ApiProperty() brandId!: string;
  @ApiPropertyOptional() brandName?: string;

  @ApiProperty() type!: string;
  @ApiProperty() status!: string;
  @ApiProperty() visibility!: string;

  @ApiProperty() basePrice!: number;
  @ApiPropertyOptional() salePrice?: number;
  @ApiPropertyOptional() wholesalePrice?: number;
  @ApiPropertyOptional() costPrice?: number;
  @ApiPropertyOptional() taxPercentage?: number;
  @ApiPropertyOptional() discountType?: string;
  @ApiPropertyOptional() discountValue?: number;

  @ApiProperty() trackInventory!: boolean;
  @ApiProperty() allowBackorder!: boolean;
  @ApiProperty() minimumOrderQuantity!: number;
  @ApiProperty() maximumOrderQuantity!: number;

  @ApiPropertyOptional() weight?: number;
  @ApiPropertyOptional() length?: number;
  @ApiPropertyOptional() width?: number;
  @ApiPropertyOptional() height?: number;

  @ApiProperty() isFeatured!: boolean;
  @ApiProperty() isNewArrival!: boolean;
  @ApiProperty() isBestSeller!: boolean;
  @ApiProperty() isTrending!: boolean;
  @ApiProperty() isLimitedStock!: boolean;
  @ApiProperty() isFestivePick!: boolean;
  @ApiProperty() isExclusive!: boolean;
  @ApiProperty() isOnlineOnly!: boolean;
  @ApiPropertyOptional() hsnCode?: string;
  @ApiProperty() taxInclusive!: boolean;
  @ApiProperty() isPublished!: boolean;
  @ApiPropertyOptional() publishedAt?: Date;
  @ApiProperty() displayOrder!: number;

  @ApiPropertyOptional() seoTitle?: string;
  @ApiPropertyOptional() seoDescription?: string;
  @ApiPropertyOptional() seoKeywords?: string;
  @ApiPropertyOptional() canonicalUrl?: string;
  @ApiPropertyOptional() searchKeywords?: string;

  @ApiPropertyOptional() gender?: string;
  @ApiPropertyOptional() ageGroup?: string;
  @ApiPropertyOptional() occasion?: string;
  @ApiPropertyOptional() season?: string;
  @ApiPropertyOptional({ type: [String] }) tags?: string[];
  @ApiPropertyOptional({ type: [String] }) collections?: string[];
  @ApiPropertyOptional({ type: [String] }) highlights?: string[];

  @ApiPropertyOptional({ type: [ProductCategoryInfo] })
  categories?: ProductCategoryInfo[];
  @ApiPropertyOptional({ type: [ProductAttributeInfo] })
  attributes?: ProductAttributeInfo[];
  @ApiPropertyOptional({ type: [ProductRelatedInfo] })
  relatedProducts?: ProductRelatedInfo[];

  @ApiPropertyOptional() primaryImageUrl?: string;
  @ApiPropertyOptional({ type: [Object] })
  images?: Array<{
    id: string;
    url: string;
    thumbnailUrl?: string;
    altText?: string;
    isPrimary: boolean;
    mediaType: string;
    color?: string;
  }>;

  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

// ─── List Response ───────────────────────────────────────

export class ProductListResponse {
  @ApiProperty({ type: [ProductResponse] }) data!: ProductResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
