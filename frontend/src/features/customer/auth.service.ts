import { apiClient, setClientTokens } from '@/lib/api/client';
import { StandardResponse } from '@/types/api.types';
import { AuthTokens } from '@/types/auth.types';
import { customerWishlistService } from './wishlist.service';

export const customerAuthService = {
  sendOtp: async (phone: string, purpose: 'LOGIN' | 'REGISTER' | 'VERIFY_PHONE' = 'LOGIN') => {
    const res = await apiClient.post<StandardResponse<{ phone: string; expiresInSeconds: number; purpose: string; devCode?: string }>>(
      '/auth/otp/send',
      { phone, purpose },
    );
    return res.data.data!;
  },

  verifyOtp: async (phone: string, code: string, purpose = 'LOGIN') => {
    const res = await apiClient.post<StandardResponse<any>>('/auth/otp/verify', {
      phone,
      code,
      purpose,
    });
    return res.data.data!;
  },

  loginWithOtp: async (dto: {
    phone: string;
    code: string;
    firstName?: string;
    rememberMe?: boolean;
  }): Promise<AuthTokens> => {
    const res = await apiClient.post<StandardResponse<AuthTokens>>('/auth/otp/login', dto);
    const tokens = res.data.data!;
    setClientTokens(tokens);
    customerWishlistService.syncGuestWishlist().catch(() => {});
    return tokens;
  },

  register: async (dto: Record<string, unknown>): Promise<AuthTokens> => {
    const res = await apiClient.post<StandardResponse<AuthTokens>>('/auth/register', dto);
    const tokens = res.data.data!;
    setClientTokens(tokens);
    customerWishlistService.syncGuestWishlist().catch(() => {});
    return tokens;
  },

  forgotPassword: async (email: string) => {
    const res = await apiClient.post<StandardResponse<any>>('/password/forgot', { email });
    return res.data.data!;
  },

  resetPassword: async (dto: { token: string; newPassword: string }) => {
    const res = await apiClient.post<StandardResponse<any>>('/password/reset', dto);
    return res.data.data!;
  },
};
