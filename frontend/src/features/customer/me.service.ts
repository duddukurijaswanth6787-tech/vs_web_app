import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';

export interface AddressDto {
  id: string;
  fullName: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  data?: AddressDto[];
  [key: string]: unknown;
}

export interface CustomerProfileDto {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  [key: string]: unknown;
}

export const customerMeService = {
  getProfile: async (): Promise<CustomerProfileDto> => {
    const res = await apiClient.get<StandardResponse<CustomerProfileDto>>('/me');
    return res.data.data!;
  },

  updateProfile: async (dto: Record<string, unknown>): Promise<CustomerProfileDto> => {
    const res = await apiClient.put<StandardResponse<CustomerProfileDto>>('/me', dto);
    return res.data.data!;
  },

  getAddresses: async (): Promise<AddressDto[]> => {
    const res = await apiClient.get<StandardResponse<AddressDto[]>>('/me/addresses');
    return res.data.data!;
  },

  createAddress: async (dto: Record<string, unknown>): Promise<AddressDto> => {
    const res = await apiClient.post<StandardResponse<AddressDto>>('/me/addresses', dto);
    return res.data.data!;
  },

  updateAddress: async (id: string, dto: Record<string, unknown>): Promise<AddressDto> => {
    const res = await apiClient.put<StandardResponse<AddressDto>>(`/me/addresses/${id}`, dto);
    return res.data.data!;
  },

  deleteAddress: async (id: string): Promise<void> => {
    await apiClient.delete(`/me/addresses/${id}`);
  },
};
