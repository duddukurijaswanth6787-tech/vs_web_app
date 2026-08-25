'use client';

import React, { createContext, useContext, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from './auth.service';
import { queryKeys } from '@/lib/query/client';
import { UserProfile } from '@/types/auth.types';
import { customerCartService } from '@/features/customer/cart.service';
import { clearGuestId } from '@/features/customer/guest';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isStaffUser: boolean;
  isInitializing: boolean;
  login: (credentials: Record<string, unknown>) => Promise<unknown>;
  completeTokenLogin: () => Promise<unknown>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<unknown>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STAFF_ROLES = ['admin', 'super_admin', 'staff', 'pos_operator', 'pos_staff'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  // The refresh token is an httpOnly cookie (see auth-cookie.util.ts), so JS
  // cannot read it -- the client has no way to know up-front whether a session
  // exists and must ask the server. This used to seed from
  // localStorage('vd_refresh_token'), which nothing writes any more: it read
  // false on every load, gated the /auth/me query off, and logged the user out
  // on every full page load or direct URL visit.
  //
  // So /auth/me now runs on mount. If the access token is missing or expired
  // the 401 interceptor in lib/api/client.ts silently refreshes from the
  // cookie and retries, restoring the session. Only an explicit logout stops
  // the query from running.
  const [loggedOut, setLoggedOut] = useState(false);

  const {
    data: user = null,
    isLoading,
    refetch: refetchUser,
  } = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: authService.getMe,
    enabled: !loggedOut,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: async () => {
      setLoggedOut(false);
      try {
        await customerCartService.merge();
        clearGuestId();
      } catch {
        // guest merge is best-effort
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      refetchUser();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      setLoggedOut(true);
      queryClient.setQueryData(queryKeys.auth.me(), null);
      queryClient.clear();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    },
  });

  const isInitializing = !loggedOut && isLoading;
  const isStaffUser = !!user && user.roles.some((r) => STAFF_ROLES.includes(r));

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isStaffUser,
    isInitializing,
    login: async (credentials) => loginMutation.mutateAsync(credentials),
    completeTokenLogin: async () => {
      setLoggedOut(false);
      try {
        await customerCartService.merge();
        clearGuestId();
      } catch {
        // ignore
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      return refetchUser();
    },
    logout: async () => logoutMutation.mutateAsync(),
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
