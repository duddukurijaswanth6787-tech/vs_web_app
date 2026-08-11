import { apiClient, setClientTokens, getClientRefreshToken } from '@/lib/api/client';
import { AuthTokens, UserProfile } from '@/types/auth.types';
import { StandardResponse } from '@/types/api.types';
import { customerWishlistService } from '@/features/customer/wishlist.service';

export const authService = {
  login: async (credentials: Record<string, unknown>): Promise<AuthTokens> => {
    const response = await apiClient.post<StandardResponse<AuthTokens>>('/auth/login', credentials);
    const tokens = response.data.data;
    if (!tokens) throw new Error(response.data.message || 'Login failed');
    setClientTokens(tokens);
    customerWishlistService.syncGuestWishlist().catch(() => {});
    return tokens;
  },

  logout: async (): Promise<void> => {
    const refreshToken = getClientRefreshToken();
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refreshToken });
      } catch {
        // Silently catch so that frontend logout completes regardless
      }
    }
    setClientTokens(null);
  },

  getMe: async (): Promise<UserProfile> => {
    const response = await apiClient.get<StandardResponse<UserProfile>>('/auth/me');
    const profile = response.data.data;
    if (!profile) throw new Error(response.data.message || 'Failed to fetch user profile');
    return profile;
  },
};
