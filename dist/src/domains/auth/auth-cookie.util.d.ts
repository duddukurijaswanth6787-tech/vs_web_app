import type { Response } from 'express';
export declare const REFRESH_TOKEN_COOKIE = "vd_rt";
export declare function setRefreshTokenCookie(res: Response, token: string): void;
export declare function clearRefreshTokenCookie(res: Response): void;
export declare function withoutRefreshToken<T extends {
    refreshToken?: string;
}>(result: T): Omit<T, 'refreshToken'>;
