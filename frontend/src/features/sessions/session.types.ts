export interface UserSession {
  id: string;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  loginProvider: string;
  expiresAt: string;
  lastActivityAt: string;
  isRevoked: boolean;
  revokedAt?: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
  };
}

export interface SessionStats {
  totalActiveSessions: number;
  uniqueUsersActive: number;
  revokedSessionsCount: number;
  expiredSessionsCount: number;
}
