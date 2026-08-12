import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  ProductResponse,
  ProductListResponse,
  AssignCategoriesDto,
  AssignAttributesDto,
  ProductColorGroupResponse,
} from './product.types';

export const productService = {
  uploadImage: async (file: File | Blob, filename: string, folder = 'products'): Promise<{ url: string }> => {
    const form = new FormData();
    form.append('file', file, filename);
    form.append('folder', folder);
    const response = await apiClient.post<StandardResponse<{ url: string }>>('/storage/upload', form, {
      headers: { 'Content-Type': undefined },
    });
    return response.data.data!;
  },

  addMedia: async (dto: {
    productId: string;
    url: string;
    mediaType?: string;
    isPrimary?: boolean;
    displayOrder?: number;
    color?: string;
    /** Shot type — Front, Back, Detail … */
    title?: string;
  }): Promise<Record<string, unknown>> => {
    const response = await apiClient.post<StandardResponse<Record<string, unknown>>>('/media', {
      mediaType: 'IMAGE',
      ...dto,
    });
    return response.data.data!;
  },

  findAll: async (query: ProductQueryDto = {}): Promise<ProductListResponse> => {
    // Build query params
    const params: Record<string, string | number | boolean> = {};
    if (query.search) params.search = query.search;
    if (query.brandId) params.brandId = query.brandId;
    if (query.status) params.status = query.status;
    if (query.visibility) params.visibility = query.visibility;
    if (query.type) params.type = query.type;
    if (query.gender) params.gender = query.gender;
    if (query.ageGroup) params.ageGroup = query.ageGroup;
    if (query.occasion) params.occasion = query.occasion;
    if (query.season) params.season = query.season;
    if (query.isFeatured !== undefined) params.isFeatured = query.isFeatured;
    if (query.isNewArrival !== undefined) params.isNewArrival = query.isNewArrival;
    if (query.isBestSeller !== undefined) params.isBestSeller = query.isBestSeller;
    if (query.isPublished !== undefined) params.isPublished = query.isPublished;
    if (query.minPrice !== undefined) params.minPrice = query.minPrice;
    if (query.maxPrice !== undefined) params.maxPrice = query.maxPrice;
    if (query.categoryId) params.categoryId = query.categoryId;
    if (query.page) params.page = query.page;
    if (query.limit) params.limit = query.limit;
    if (query.sortBy) params.sortBy = query.sortBy;
    if (query.sortOrder) params.sortOrder = query.sortOrder;

    const response = await apiClient.get<StandardResponse<ProductListResponse>>('/products', { params });
    return response.data.data!;
  },

  findById: async (id: string): Promise<ProductResponse> => {
    const response = await apiClient.get<StandardResponse<ProductResponse>>(`/products/${id}`);
    return response.data.data!;
  },

  create: async (dto: CreateProductDto): Promise<ProductResponse> => {
    const response = await apiClient.post<StandardResponse<ProductResponse>>('/products', dto);
    return response.data.data!;
  },

  update: async (id: string, dto: UpdateProductDto): Promise<ProductResponse> => {
    const response = await apiClient.patch<StandardResponse<ProductResponse>>(`/products/${id}`, dto);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  restore: async (id: string): Promise<ProductResponse> => {
    const response = await apiClient.post<StandardResponse<ProductResponse>>(`/products/${id}/restore`);
    return response.data.data!;
  },

  publish: async (id: string): Promise<ProductResponse> => {
    const response = await apiClient.post<StandardResponse<ProductResponse>>(`/products/${id}/publish`);
    return response.data.data!;
  },

  unpublish: async (id: string): Promise<ProductResponse> => {
    const response = await apiClient.post<StandardResponse<ProductResponse>>(`/products/${id}/unpublish`);
    return response.data.data!;
  },

  feature: async (id: string): Promise<ProductResponse> => {
    const response = await apiClient.post<StandardResponse<ProductResponse>>(`/products/${id}/feature`);
    return response.data.data!;
  },

  unfeature: async (id: string): Promise<ProductResponse> => {
    const response = await apiClient.post<StandardResponse<ProductResponse>>(`/products/${id}/unfeature`);
    return response.data.data!;
  },

  assignCategories: async (id: string, dto: AssignCategoriesDto): Promise<ProductResponse> => {
    const response = await apiClient.post<StandardResponse<ProductResponse>>(`/products/${id}/categories`, dto);
    return response.data.data!;
  },

  removeCategory: async (id: string, categoryId: string): Promise<ProductResponse> => {
    const response = await apiClient.delete<StandardResponse<ProductResponse>>(`/products/${id}/categories/${categoryId}`);
    return response.data.data!;
  },

  assignAttributes: async (id: string, dto: AssignAttributesDto): Promise<ProductResponse> => {
    const response = await apiClient.post<StandardResponse<ProductResponse>>(`/products/${id}/attributes`, dto);
    return response.data.data!;
  },

  createColorGroup: async (id: string, dto: { colorAttributeOptionId: string; label?: string }): Promise<ProductColorGroupResponse> => {
    const response = await apiClient.post<StandardResponse<ProductColorGroupResponse>>(`/products/${id}/color-groups`, dto);
    return response.data.data!;
  },

  getColorGroups: async (id: string): Promise<ProductColorGroupResponse[]> => {
    const response = await apiClient.get<StandardResponse<ProductColorGroupResponse[]>>(`/products/${id}/color-groups`);
    return response.data.data!;
  },

  deleteColorGroup: async (productId: string, groupId: string): Promise<void> => {
    await apiClient.delete(`/products/${productId}/color-groups/${groupId}`);
  },

  syncColorGroups: async (id: string, dto: { colorGroups: Array<Record<string, unknown>> }): Promise<ProductColorGroupResponse[]> => {
    const response = await apiClient.post<StandardResponse<ProductColorGroupResponse[]>>(`/products/${id}/color-groups/sync`, dto);
    return response.data.data!;
  },

  removeAttribute: async (id: string, attributeId: string): Promise<ProductResponse> => {
    const response = await apiClient.delete<StandardResponse<ProductResponse>>(`/products/${id}/attributes/${attributeId}`);
    return response.data.data!;
  },
};
