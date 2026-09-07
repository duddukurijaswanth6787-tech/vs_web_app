import { apiClient } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import {
  ShippingMethodResponse,
  ShippingZoneResponse,
  ShippingCalculationResponse,
  CreateShippingMethodDto,
  CreateShippingZoneDto,
  CalculateShippingDto,
} from './shipping.types';

export const shippingService = {
  getMethods: async (): Promise<ShippingMethodResponse[]> => {
    const response = await apiClient.get<StandardResponse<ShippingMethodResponse[]>>('/shipping/methods');
    return response.data.data!;
  },

  calculateShipping: async (code: string, dto: CalculateShippingDto): Promise<ShippingCalculationResponse> => {
    const response = await apiClient.get<StandardResponse<ShippingCalculationResponse>>(`/shipping/methods/${code}/calculate`, {
      params: dto,
    });
    return response.data.data!;
  },

  createMethod: async (dto: CreateShippingMethodDto): Promise<ShippingMethodResponse> => {
    const response = await apiClient.post<StandardResponse<ShippingMethodResponse>>('/shipping/methods', dto);
    return response.data.data!;
  },

  getZones: async (methodId?: string): Promise<ShippingZoneResponse[]> => {
    const response = await apiClient.get<StandardResponse<ShippingZoneResponse[]>>('/shipping/zones', {
      params: methodId ? { methodId } : undefined,
    });
    return response.data.data!;
  },

  createZone: async (dto: CreateShippingZoneDto): Promise<ShippingZoneResponse> => {
    const response = await apiClient.post<StandardResponse<ShippingZoneResponse>>('/shipping/zones', dto);
    return response.data.data!;
  },

  checkPincode: async (pincode: string): Promise<{
    pincode: string;
    isServiceable: boolean;
    prepaidAvailable: boolean;
    codAvailable: boolean;
    city?: string;
    state?: string;
    remarks?: string;
  }> => {
    const response = await apiClient.get<StandardResponse<{
      pincode: string;
      isServiceable: boolean;
      prepaidAvailable: boolean;
      codAvailable: boolean;
      city?: string;
      state?: string;
      remarks?: string;
    }>>(`/shipping/delhivery/pincode/${encodeURIComponent(pincode)}`);
    return response.data.data!;
  },
};
