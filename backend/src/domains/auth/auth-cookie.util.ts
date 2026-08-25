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
