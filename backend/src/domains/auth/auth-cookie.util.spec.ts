import {
  REFRESH_TOKEN_COOKIE,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from './auth-cookie.util';

describe('auth-cookie.util', () => {
  function mockRes() {
    return { cookie: jest.fn(), clearCookie: jest.fn() } as any;
  }

  it('sets the refresh token cookie as httpOnly, scoped to /api/v1/auth', () => {
    const res = mockRes();
    setRefreshTokenCookie(res, 'raw-token');

    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      'raw-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/api/v1/auth',
      }),
    );
  });

  it('clears the cookie on the same path it was set on', () => {
    const res = mockRes();
    clearRefreshTokenCookie(res);

    expect(res.clearCookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      expect.objectContaining({ path: '/api/v1/auth' }),
    );
  });
});
