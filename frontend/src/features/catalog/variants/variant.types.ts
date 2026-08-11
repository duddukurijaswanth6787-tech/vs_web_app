export interface VariantAttributeEntry {
  attributeId: string;
  attributeOptionId?: string;
  value?: string;
}

export interface CreateVariantDto {
  productId: string;
  colorGroupId?: string;
  sku?: string;
  title?: string;
  priceOverride?: number;
  salePriceOverride?: number;
  costPrice?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  displayOrder?: number;
  isDefault?: boolean;
  attributeValues?: VariantAttributeEntry[];
}

export interface UpdateVariantDto {
  colorGroupId?: string;
  title?: string;
  priceOverride?: number;
  salePriceOverride?: number;
  costPrice?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  displayOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface VariantQueryDto {
  productId?: string;
  status?: string;
  isActive?: boolean;
  isDefault?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface VariantAttributeInfo {
  attributeId: string;
  attributeName: string;
  attributeType: string;
  attributeOptionId?: string;
  optionLabel?: string;
  value?: string;
}

export interface VariantResponse {
  id: string;
  productId: string;
  colorGroupId?: string;
  sku: string;
  barcode: string;
  title: string;
  priceOverride?: number;
  salePriceOverride?: number;
  costPrice?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  displayOrder: number;
  status: string;
  isDefault: boolean;
  isActive: boolean;
  attributeValues?: VariantAttributeInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface VariantListResponse {
  data: VariantResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface AssignAttributeValuesDto {
  attributeValues: {
    attributeId: string;
    attributeOptionId?: string;
    value?: string;
  }[];
}
