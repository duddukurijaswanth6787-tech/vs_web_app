import type { Response } from 'express';

// Refresh token lives in an httpOnly cookie so browser JS (and therefore an
// XSS payload) can never read it -- unlike the old localStorage approach.
// Scoped to root path so it is consistently sent across all API endpoints.
export const REFRESH_TOKEN_COOKIE = 'vd_rt';

// 90 days covers the longest configurable session (rememberMeRefreshTokenDays);
// a shorter server-side expiry just means the server rejects it sooner.
const MAX_COOKIE_AGE_MS = 90 * 24 * 60 * 60 * 1000;

export function setRefreshTokenCookie(res: Response, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
    maxAge: MAX_COOKIE_AGE_MS,
  });
}

export function clearRefreshTokenCookie(res: Response) {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  });
}

export function withoutRefreshToken<T extends { refreshToken?: string }>(
  result: T,
): Omit<T, 'refreshToken'> {
  const { refreshToken: _refreshToken, ...rest } = result;
  return rest;
}

