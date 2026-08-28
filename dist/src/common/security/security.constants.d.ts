export declare const SECURITY_CONSTANTS: {
    readonly MAX_JSON_SIZE: "2mb";
    readonly MAX_URLENCODED_SIZE: "2mb";
    readonly DEFAULT_THROTTLE_TTL: 60;
    readonly DEFAULT_THROTTLE_LIMIT: 100;
    readonly TRUSTED_HEADERS: readonly ["x-correlation-id", "x-request-id", "x-forwarded-for", "x-real-ip"];
    readonly COOKIE_NAMES: {
        readonly SESSION: "vd_session";
        readonly CSRF: "vd_csrf";
    };
    readonly ERROR_CODES: {
        readonly SEC_001: "SEC_001";
        readonly SEC_002: "SEC_002";
    };
    readonly CORRELATION_ID_REGEX: RegExp;
};
