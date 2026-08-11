export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
  DISCONTINUED = 'DISCONTINUED',
}

export enum ProductType {
  READYMADE = 'READYMADE',
  CUSTOM = 'CUSTOM',
  UNSTITCHED = 'UNSTITCHED',
}

export enum GenderType {
  WOMEN = 'WOMEN',
  GIRLS = 'GIRLS',
  UNISEX = 'UNISEX',
}

export enum AgeGroup {
  ADULTS = 'ADULTS',
  TEENS = 'TEENS',
  KIDS = 'KIDS',
  INFANTS = 'INFANTS',
}

export enum ProductVisibility {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  SEARCHABLE = 'SEARCHABLE',
}

export enum AttributeType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  COLOR = 'COLOR',
  DATE = 'DATE',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  SIZE = 'SIZE',
  IMAGE = 'IMAGE',
  URL = 'URL',
}

export type ProductMediaRole =
  | 'MAIN'
  | 'FRONT'
  | 'BACK'
  | 'SIDE'
  | 'FABRIC'
  | 'MODEL'
  | 'LIFESTYLE'
  | 'VIDEO';

export interface ProductAttributeEntry {
  attributeId: string;
  value?: string;
}

export interface CreateProductDto {
  name: string;
  slug?: string;
  brandId: string;
  shortDescription?: string;
  description?: string;
  type?: ProductType;
  status?: ProductStatus;
  visibility?: ProductVisibility;
  basePrice: number;
  salePrice?: number;
  wholesalePrice?: number;
  costPrice?: number;
  taxPercentage?: number;
  taxInclusive?: boolean;
  discountType?: string;
  discountValue?: number;
  trackInventory?: boolean;
  allowBackorder?: boolean;
  minimumOrderQuantity?: number;
  maximumOrderQuantity?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  isPublished?: boolean;
  displayOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  canonicalUrl?: string;
  searchKeywords?: string;
  gender?: GenderType;
  ageGroup?: AgeGroup;
  occasion?: string;
  season?: string;
  tags?: string[];
  collections?: string[];
  highlights?: string[];
  categoryIds?: string[];
  attributes?: ProductAttributeEntry[];
}

export type UpdateProductDto = Partial<CreateProductDto>;

export interface ProductQueryDto {
  search?: string;
  brandId?: string;
  status?: string;
  visibility?: string;
  type?: ProductType;
  gender?: GenderType;
  ageGroup?: AgeGroup;
  occasion?: string;
  season?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  isPublished?: boolean;
  minPrice?: number;
  maxPrice?: number;
  categoryId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductCategoryInfo {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
}

export interface ProductAttributeInfo {
  attributeId: string;
  attributeName: string;
  attributeType: AttributeType;
  value?: string;
}

export interface ProductRelatedInfo {
  productId: string;
  productName: string;
}

export interface ProductResponse {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  brandId: string;
  brandName?: string;
  type: string;
  status: string;
  visibility: string;
  basePrice: number;
  salePrice?: number;
  wholesalePrice?: number;
  costPrice?: number;
  taxPercentage?: number;
  taxInclusive?: boolean;
  discountType?: string;
  discountValue?: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  minimumOrderQuantity: number;
  maximumOrderQuantity: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isTrending?: boolean;
  isPublished: boolean;
  publishedAt?: string;
  displayOrder: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  canonicalUrl?: string;
  searchKeywords?: string;
  gender?: string;
  ageGroup?: string;
  occasion?: string;
  season?: string;
  tags?: string[];
  collections?: string[];
  highlights?: string[];
  categories?: ProductCategoryInfo[];
  attributes?: ProductAttributeInfo[];
  colorGroups?: ProductColorGroupResponse[];
  relatedProducts?: ProductRelatedInfo[];
  primaryImageUrl?: string;
  images?: Array<{
    id: string;
    url: string;
    thumbnailUrl?: string;
    altText?: string;
    isPrimary: boolean;
    mediaType: string;
    color?: string;
    colorGroupId?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductColorGroupResponse {
  id: string;
  productId: string;
  colorAttributeOptionId: string;
  label?: string;
  sortOrder: number;
  isActive: boolean;
  colorAttributeOption?: {
    id: string;
    value: string;
    label: string;
    swatchImageUrl?: string;
  };
  variants?: any[];
  media?: any[];
}

export interface ProductListResponse {
  data: ProductResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface AssignCategoriesDto {
  categoryIds: string[];
}

export interface AssignAttributesDto {
  attributes: ProductAttributeEntry[];
}

import * as z from 'zod';

export const optNumber = z.preprocess(
  (val) => (val === '' || val === null || val === undefined || isNaN(Number(val)) ? undefined : Number(val)),
  z.number().min(0).optional()
);

export const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  brandId: z.string().uuid('Please select a valid brand'),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  type: z.string().default('READYMADE'),
  gender: z.string().default('WOMEN'),
  ageGroup: z.string().default('ADULTS'),
  season: z.string().optional(),
  basePrice: z.preprocess(
    (val) => (val === '' || val === null || val === undefined || isNaN(Number(val)) ? 0 : Number(val)),
    z.number().min(0.01, 'MRP is required')
  ),
  salePrice: optNumber,
  costPrice: optNumber,
  taxInclusive: z.boolean().default(true),
  taxPercentage: z.preprocess(
    (val) => (val === '' || val === null || val === undefined || isNaN(Number(val)) ? undefined : Number(val)),
    z.number().min(0).max(100).optional()
  ),
  weight: optNumber,
  length: optNumber,
  width: optNumber,
  height: optNumber,
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  slug: z.string().optional(),
  status: z.string().default('DRAFT'),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  collections: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
