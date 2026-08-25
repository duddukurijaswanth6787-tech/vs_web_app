import type { Response } from 'express';

// Refresh token lives in an httpOnly cookie so browser JS (and therefore an
// XSS payload) can never read it -- unlike the old localStorage approach.
// Scoped to /api/v1/auth so it's only ever sent to token endpoints, not
// leaked to every API call. Mobile clients don't send credentials and
// never read Set-Cookie, so they're unaffected and keep using the token in
// the JSON response body instead.
export const REFRESH_TOKEN_COOKIE = 'vd_rt';

// Cookie maxAge is just a browser-side retention hint -- the real expiry is
// still enforced server-side in RefreshTokenService.validate(). 30 days
// covers the longest configurable session (rememberMeRefreshTokenDays);
// a shorter server-side expiry just means the server rejects it sooner.
const MAX_COOKIE_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function setRefreshTokenCookie(res: Response, token: string) {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: MAX_COOKIE_AGE_MS,
  });
}

export function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: '/api/v1/auth' });
}

// No client in this codebase reads refreshToken from the response body: the
// web app reads the httpOnly cookie exclusively, and shopora-mobile (the
// only other consumer) only ever reads accessToken. Leaving it in the JSON
// body served no purpose but exposing a long-lived credential to anything
// with page access (XSS, browser history/logs) -- the opposite of what the
// httpOnly cookie migration was for. Controllers still read
// result.refreshToken directly (before calling this) to set the cookie.
export function withoutRefreshToken<T extends { refreshToken?: string }>(
  result: T,
): Omit<T, 'refreshToken'> {
  const { refreshToken: _refreshToken, ...rest } = result;
  return rest;
}
