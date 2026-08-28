"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REFRESH_TOKEN_COOKIE = void 0;
exports.setRefreshTokenCookie = setRefreshTokenCookie;
exports.clearRefreshTokenCookie = clearRefreshTokenCookie;
exports.withoutRefreshToken = withoutRefreshToken;
exports.REFRESH_TOKEN_COOKIE = 'vd_rt';
const MAX_COOKIE_AGE_MS = 30 * 24 * 60 * 60 * 1000;
function setRefreshTokenCookie(res, token) {
    res.cookie(exports.REFRESH_TOKEN_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/v1/auth',
        maxAge: MAX_COOKIE_AGE_MS,
    });
}
function clearRefreshTokenCookie(res) {
    res.clearCookie(exports.REFRESH_TOKEN_COOKIE, { path: '/api/v1/auth' });
}
function withoutRefreshToken(result) {
    const { refreshToken: _refreshToken, ...rest } = result;
    return rest;
}
//# sourceMappingURL=auth-cookie.util.js.map