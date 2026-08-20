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
    const res = await apiClient.post<StandardResponse<{ verified: boolean; purpose?: string }>>('/auth/otp/verify', {
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

  /**
   * Phone login where Firebase already sent the SMS and confirmed the code
   * client-side (see src/lib/firebase/phoneAuth.ts) -- `idToken` is what
   * `confirmationResult.confirm(code)` returns. The backend re-verifies that
   * token against Firebase before trusting the phone number and issuing its
   * own session, so this is not just a client-side check.
   */
  loginWithFirebasePhone: async (dto: {
    idToken: string;
    firstName?: string;
    rememberMe?: boolean;
  }): Promise<AuthTokens> => {
    const res = await apiClient.post<StandardResponse<AuthTokens>>(
      '/auth/otp/firebase-login',
      dto,
    );
    const tokens = res.data.data!;
    setClientTokens(tokens);
    customerWishlistService.syncGuestWishlist().catch(() => {});
    return tokens;
  },

  /**
   * `credential` is the signed ID token Google's Sign-In button hands us
   * client-side -- the backend re-verifies it against Google's public keys
   * before trusting any of its claims, so this is not just a client-side check.
   */
  loginWithGoogle: async (credential: string, rememberMe = true): Promise<AuthTokens> => {
    const res = await apiClient.post<StandardResponse<AuthTokens>>('/auth/google', {
      credential,
      rememberMe,
    });
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
    const res = await apiClient.post<StandardResponse<{ sent: boolean; message?: string }>>('/password/forgot', { email });
    return res.data.data!;
  },

  resetPassword: async (dto: { token: string; newPassword: string }) => {
    const res = await apiClient.post<StandardResponse<{ success: boolean; message?: string }>>('/password/reset', dto);
    return res.data.data!;
  },

  validateResetToken: async (token: string) => {
    const res = await apiClient.post<StandardResponse<{ valid: boolean }>>('/password/validate-token', { token });
    return res.data.data!;
  },
};
